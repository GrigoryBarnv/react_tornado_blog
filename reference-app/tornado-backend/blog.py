# ./tornado-backend/blog.py

#!/usr/bin/env python3
#
# Copyright 2009 Facebook
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

import aiopg
import asyncio
import bcrypt
import markdown
import os.path
import psycopg2
import re
import tornado
import tornado.web
import tornado.locks
import unicodedata

from datetime import datetime, date, timezone
import pytz

import json
import logging
# Configure logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)
define("db_host", default="127.0.0.1", help="blog database host")
define("db_port", default=5432, help="blog database port")
define("db_database", default="blog", help="blog database name")
define("db_user", default="blog", help="blog database user")
define("db_password", default="blog", help="blog database password")


class NoResultError(Exception):
    pass


async def maybe_create_tables(db):
    try:
        with await db.cursor() as cur:
            # Set timezone for the current session
            await cur.execute("SET TIME ZONE 'UTC';")
            await cur.execute("SELECT COUNT(*) FROM entries LIMIT 1")
            await cur.fetchone()
    except psycopg2.ProgrammingError:
        with open("schema.sql") as f:
            schema = f.read()
        with await db.cursor() as cur:
            await cur.execute(schema)


class Application(tornado.web.Application):
    def __init__(self, db):
        self.db = db
        handlers = [
            (r"/", HomeHandler),
            (r"/archive", ArchiveHandler),
            (r"/feed", FeedHandler),
            (r"/entry/([^/]+)", EntryHandler),
            (r"/compose", ComposeHandler),
            (r"/auth/create", AuthCreateHandler),
            (r"/auth/login", AuthLoginHandler),
            (r"/auth/logout", AuthLogoutHandler),
            (r"/api/message", APIHandler),
            (r"/api/register", AuthorRegisterHandler),
            (r"/api/login", AuthorLoginHandler),
            (r"/api/logout", AuthLogoutHandler),
            (r"/api/get-user-role", GetUserRoleHandler),
            (r"/api/blog-entries", BlogEntriesHandler),
            (r"/api/create-blog-entry", CreateBlogEntryHandler),            
            (r"/api/update-blog-entry/([^/]+)", UpdateBlogEntriesHandler),
            (r"/api/xsrf-token", XSRFTokenHandler),
        ]
        settings = dict(
            blog_title="PlantBlog",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            ui_modules={"Entry": EntryModule},
            xsrf_cookies=True,
            xsrf_cookie_kwargs={"path": "/"},
            cookie_secret="__TODO:_GENERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
            login_url="/auth/login",
            debug=True,
        )
        super().__init__(handlers, **settings)


class BaseHandler(tornado.web.RequestHandler):
    def row_to_obj(self, row, cur):
        """Convert a SQL row to an object supporting dict and attribute access."""
        obj = tornado.util.ObjectDict()
        for val, desc in zip(row, cur.description):
            obj[desc.name] = val
        return obj

    async def execute(self, stmt, *args):
        """Execute a SQL statement.

        Must be called with ``await self.execute(...)``
        """
        with await self.application.db.cursor() as cur:
            await cur.execute(stmt, args)

    async def query(self, stmt, *args):
        """Query for a list of results.

        Typical usage::

            results = await self.query(...)

        Or::

            for row in await self.query(...)
        """
        with await self.application.db.cursor() as cur:
            await cur.execute(stmt, args)
            return [self.row_to_obj(row, cur) for row in await cur.fetchall()]

    async def queryone(self, stmt, *args):
        """Query for exactly one result.

        Raises NoResultError if there are no results, or ValueError if
        there are more than one.
        """
        results = await self.query(stmt, *args)
        if len(results) == 0:
            raise NoResultError()
        elif len(results) > 1:
            raise ValueError("Expected 1 result, got %d" % len(results))
        return results[0]

    # async def prepare(self):

    #     # Ensure XSRF cookie is set with a correct path
    #     if not self.get_secure_cookie("_xsrf"):
    #         self.xsrf_token  # This will set the _xsrf cookie

    #     # get_current_user cannot be a coroutine, so set
    #     # self.current_user in prepare instead.
    #     # user_id = self.get_signed_cookie("blogdemo_user")
    #     user_id = self.get_secure_cookie("blogdemo_user")
    #     # user_id = self.get_cookie("blogdemo_user")
    #     if user_id:
    #         self.current_user = await self.queryone(
    #             "SELECT * FROM authors WHERE id = %s", int(user_id)
    #         )

    async def prepare(self):
        self.current_user = None

        # Log incoming cookies for every request
        logging.info(f"[PREPARE] Incoming Cookie Header: {self.request.headers.get('Cookie')}")
        logging.info(f"[PREPARE] Parsed _xsrf cookie: {self.get_cookie('_xsrf')}")
        logging.info(f"[PREPARE] X-XSRFToken header: {self.request.headers.get('X-XSRFToken')}")
        logging.info(f"SENT COOKIES FROM CLIENT: {self.request.headers.get('Cookie')}")

        # Ensure XSRF cookie exists
        if not self.get_cookie("_xsrf"):
            _ = self.xsrf_token   # force cookie creation

        # Load user from cookie if present
        user_id = self.get_secure_cookie("blogdemo_user")
        if user_id:
            try:
                self.current_user = await self.queryone(
                    "SELECT * FROM authors WHERE id = %s", int(user_id)
                )
            except (NoResultError, ValueError):
                logging.warning("Invalid blogdemo_user cookie detected; clearing cookie")
                self.clear_cookie("blogdemo_user")
                self.current_user = None

    async def any_author_exists(self):
        return bool(await self.query("SELECT * FROM authors LIMIT 1"))
    
    # Serialization of dates
    def date_serialization(self, obj):
        if isinstance(obj, (date, datetime)):
            # Ensure the datetime is timezone-aware
            if obj.tzinfo is None:
                obj = pytz.UTC.localize(obj)  # Assuming UTC as default
            return obj.isoformat()
        raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

   # CORS setup for development 
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "http://localhost:3000")
        self.set_header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With")
        self.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.set_header("Access-Control-Allow-Credentials", "true")

    def options(self, *args, **kwargs):
        # no body needed for preflight
        self.set_status(204)
        self.finish()    
  
class XSRFTokenHandler(BaseHandler):
    def check_xsrf_cookie(self):
        pass  # allow this endpoint without XSRF check

    def get(self):
        # DO NOT call self.xsrf_token here again!
        token = self.get_cookie("_xsrf")  
        logging.info(f"COOKIE: {token}")
        logging.info(f"HEADER: {token}")  # same value now
        self.write({"_xsrf": token})

class HomeHandler(BaseHandler):
    async def get(self):
        entries = await self.query(
            "SELECT * FROM entries ORDER BY published DESC LIMIT 5"
        )

        # Ensure all `published` attributes in entries are naive
        for entry in entries:
            if entry.published and entry.published.tzinfo is not None:  # Only if it's timezone-aware
                # Convert to naive datetime in UTC
                entry.published = entry.published.astimezone(timezone.utc).replace(tzinfo=None)        
        # Log the type of the `published` field for the first entry (if exists)
        if entries:
            logging.info(f"Logging type of entries[0].published: {type(entries[0].published)}")

        if not entries:
            self.redirect("/compose")
            return
        self.render("home.html", entries=entries)


class EntryHandler(BaseHandler):
    async def get(self, slug):
        entry = await self.queryone("SELECT * FROM entries WHERE slug = %s", slug)

        # Ensure `published` attribute in entry is naive
        if entry.published and entry.published.tzinfo is not None:  # Only if it's timezone-aware
            # Convert to naive datetime in UTC
            entry.published = entry.published.astimezone(timezone.utc).replace(tzinfo=None)        
        # Log the type of the `published` field for the first entry (if exists)
        if entry:
            logging.info(f"Logging type of entries[0].published: {type(entry.published)}")

        if not entry:
            raise tornado.web.HTTPError(404)
        
        self.render("entry.html", entry=entry)


class ArchiveHandler(BaseHandler):
    async def get(self):
        entries = await self.query("SELECT * FROM entries ORDER BY published DESC")

        # Ensure all `published` attributes in entries are naive
        for entry in entries:
            if entry.published and entry.published.tzinfo is not None:  # Only if it's timezone-aware
                # Convert to naive datetime in UTC
                entry.published = entry.published.astimezone(timezone.utc).replace(tzinfo=None)        
        # Log the type of the `published` field for the first entry (if exists)
        if entries:
            logging.info(f"Logging type of entries[0].published: {type(entries[0].published)}")

        self.render("archive.html", entries=entries)


class FeedHandler(BaseHandler):
    async def get(self):
        entries = await self.query(
            "SELECT * FROM entries ORDER BY published DESC LIMIT 10"
        )

        # Ensure all `published` attributes in entries are naive
        for entry in entries:
            if entry.published and entry.published.tzinfo is not None:  # Only if it's timezone-aware
                # Convert to naive datetime in UTC
                entry.published = entry.published.astimezone(timezone.utc).replace(tzinfo=None)        
        # Log the type of the `published` field for the first entry (if exists)
        if entries:
            logging.info(f"Logging type of entries[0].published: {type(entries[0].published)}")

        self.set_header("Content-Type", "application/atom+xml")
        self.render("feed.xml", entries=entries)


class ComposeHandler(BaseHandler):
    @tornado.web.authenticated
    async def get(self):
        id = self.get_argument("id", None)
        entry = None
        if id:
            entry = await self.queryone("SELECT * FROM entries WHERE id = %s", int(id))
        self.render("compose.html", entry=entry)

    @tornado.web.authenticated
    async def post(self):
        id = self.get_argument("id", None)
        title = self.get_argument("title")
        text = self.get_argument("markdown")
        html = markdown.markdown(text)
        if id:
            try:
                entry = await self.queryone(
                    "SELECT * FROM entries WHERE id = %s", int(id)
                )
            except NoResultError:
                raise tornado.web.HTTPError(404)
            slug = entry.slug
            await self.execute(
                "UPDATE entries SET title = %s, markdown = %s, html = %s "
                "WHERE id = %s",
                title,
                text,
                html,
                int(id),
            )
        else:
            slug = unicodedata.normalize("NFKD", title)
            slug = re.sub(r"[^\w]+", " ", slug)
            slug = "-".join(slug.lower().strip().split())
            slug = slug.encode("ascii", "ignore").decode("ascii")
            if not slug:
                slug = "entry"
            while True:
                e = await self.query("SELECT * FROM entries WHERE slug = %s", slug)
                if not e:
                    break
                slug += "-2"
            await self.execute(
                "INSERT INTO entries (author_id,title,slug,markdown,html,published,updated)"
                "VALUES (%s,%s,%s,%s,%s,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
                self.current_user.id,
                title,
                slug,
                text,
                html,
            )
        self.redirect("/entry/" + slug)


class AuthCreateHandler(BaseHandler):
    def get(self):
        self.render("create_author.html")

    async def post(self):
        if await self.any_author_exists():
            raise tornado.web.HTTPError(400, "author already created")
        hashed_password = await tornado.ioloop.IOLoop.current().run_in_executor(
            None,
            bcrypt.hashpw,
            tornado.escape.utf8(self.get_argument("password")),
            bcrypt.gensalt(),
        )
        author = await self.queryone(
            "INSERT INTO authors (email, name, hashed_password) "
            "VALUES (%s, %s, %s) RETURNING id",
            self.get_argument("email"),
            self.get_argument("name"),
            tornado.escape.to_unicode(hashed_password),
        )
        # self.set_signed_cookie("blogdemo_user", str(author.id))
        self.set_secure_cookie("blogdemo_user", str(author.id))
        # self.set_cookie("blogdemo_user", str(author.id))
        self.redirect(self.get_argument("next", "/"))


class AuthLoginHandler(BaseHandler):
    async def get(self):
        # If there are no authors, redirect to the account creation page.
        if not await self.any_author_exists():
            self.redirect("/auth/create")
        else:
            self.render("login.html", error=None)

    async def post(self):
        try:
            author = await self.queryone(
                "SELECT * FROM authors WHERE email = %s", self.get_argument("email")
            )
        except NoResultError:
            self.render("login.html", error="email not found")
            return
        password_equal = await tornado.ioloop.IOLoop.current().run_in_executor(
            None,
            bcrypt.checkpw,
            tornado.escape.utf8(self.get_argument("password")),
            tornado.escape.utf8(author.hashed_password),
        )
        if password_equal:
            # self.set_signed_cookie("blogdemo_user", str(author.id))
            self.set_secure_cookie("blogdemo_user", str(author.id))
            # self.set_cookie("blogdemo_user", str(author.id))            
            self.redirect(self.get_argument("next", "/"))
        else:
            self.render("login.html", error="incorrect password")


class AuthLogoutHandler(BaseHandler):
    def get(self):
        self.clear_cookie("blogdemo_user")
        self.redirect(self.get_argument("next", "/"))


class EntryModule(tornado.web.UIModule):
    def render(self, entry):
        return self.render_string("modules/entry.html", entry=entry)


class APIHandler(tornado.web.RequestHandler):
    def get(self):
        self.write({"message": "Hello from Tornado Backend!"})


class AuthorRegisterHandler(BaseHandler):
    async def post(self):
        logging.info(f"Hello from registration handler!")
        # Parse JSON data from request body
        data = json.loads(self.request.body)
        email = data.get("email")
        name = data.get("name")
        password = data.get("password")                                
        hashed_password = await tornado.ioloop.IOLoop.current().run_in_executor(
            None,
            bcrypt.hashpw,
            tornado.escape.utf8(password),
            bcrypt.gensalt(),
        )        
        author = await self.queryone(
            "INSERT INTO authors (email, name, hashed_password) "
            "VALUES (%s, %s, %s) RETURNING id",
            email,
            name,
            tornado.escape.to_unicode(hashed_password),
        )
        self.write({"message": "Author registered successfully"})
    

class AuthorLoginHandler(BaseHandler):
    async def get(self):
        if not await self.any_author_exists():
            self.status(404)
            self.write({"message": "No author exists"})
        else:
            self.write({"message": "Authors exists"})

    async def post(self):
        try:
            data = json.loads(self.request.body)
            email = data.get("email")
            password = data.get("password")
            
            author = await self.queryone(
                "SELECT * FROM authors WHERE email = %s", email
            )
        except NoResultError:
            self.status(404)
            self.write({"message": "Author does not exist"})
            return
        
        password_equal = await tornado.ioloop.IOLoop.current().run_in_executor(
            None,
            bcrypt.checkpw,
            tornado.escape.utf8(password),
            tornado.escape.utf8(author.hashed_password),
        )
        if password_equal:
            # self.set_signed_cookie("blogdemo_user", str(author.id))
            self.set_secure_cookie("blogdemo_user", str(author.id))
            # self.set_cookie("blogdemo_user", str(author.id))
            self.set_status(200)
            self.write({"message": "Login successful"})                
        else:
            self.set_status(401)
            self.write({"message": "Incorrect email or password"})                


class AuthLogoutHandler(BaseHandler):
    def get(self):
        self.clear_cookie("blogdemo_user")
        self.write({"message": "Logout successful"}) 


class GetUserRoleHandler(BaseHandler): 
    async def get(self):
        user_id = self.get_secure_cookie("blogdemo_user")
        logging.info(user_id)
        if user_id and self.current_user:
            self.write({"role": "author"})
            return

        self.write({"role": None, "message": "Not logged in!"})


class BlogEntriesHandler(BaseHandler):
    async def get(self):
        try:
            # Query to fetch all entries, ordered by published date
            entries = await self.query("SELECT * FROM entries ORDER BY published DESC")

            logging.info(f"logging of entries: {entries}")
            
            # Format the entries as a JSON response
            # self.write({"status": "success", "data": entries})
            self.write(json.dumps({"status": "success",
                                   "entries": entries
                                   }, default=self.date_serialization))

        except Exception as e:
            logging.error(f"Error fetching blog entries: {e}")
            self.set_status(500)
            self.write({"status": "error", "message": "Failed to fetch blog entries"})


class CreateBlogEntryHandler(BaseHandler):
    @tornado.web.authenticated
    async def post(self):
        try:
            # Parse JSON data from the request body
            data = json.loads(self.request.body)
            title = data.get("title")
            text = data.get("markdown")

            if not title or not text:
                raise tornado.web.HTTPError(400, "Title and markdown are required")

            # Convert markdown to HTML
            html = markdown.markdown(text)

            # Generate a unique slug from the title
            slug = unicodedata.normalize("NFKD", title)
            slug = re.sub(r"[^\w]+", "-", slug)
            slug = slug.strip("-").lower()
            slug = slug.encode("ascii", "ignore").decode("ascii")
            if not slug:
                slug = "entry"
            # Ensure slug uniqueness
            while True:
                existing = await self.query("SELECT * FROM entries WHERE slug = %s", slug)
                if not existing:
                    break
                slug += "-2"

            # Insert the new entry into the database
            current_time = datetime.now(pytz.UTC)  # Use UTC timezone
            await self.execute(
                "INSERT INTO entries (author_id, title, slug, markdown, html, published, updated) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                self.current_user.id,
                title,
                slug,
                text,
                html,
                current_time,
                current_time,
            )

            # Respond with success
            self.write({"status": "success", "message": "Blog post created", "slug": slug})

        except Exception as e:
            logging.error(f"Error creating blog post: {e}")
            self.set_status(500)
            self.write({"status": "error", "message": "Failed to create blog post"})


class UpdateBlogEntriesHandler(BaseHandler):
    @tornado.web.authenticated
    async def get(self, slug):
        try:
            # Query one enty, by slug
            entry = await self.queryone("SELECT * FROM entries WHERE slug = %s", slug)

            logging.info(f"logging of entry: {entry}")
            
            # Format the entries as a JSON response
            # self.write({"status": "success", "data": entries})
            self.write(json.dumps({"status": "success",
                                   "entry": entry
                                   }, default=self.date_serialization))

        except Exception as e:
            logging.error(f"Error fetching blog entries: {e}")
            self.set_status(500)
            self.write({"status": "error", "message": "Failed to fetch blog entries"})

    async def post(self, slug):
        try:
            # Parse JSON data from the request body
            data = json.loads(self.request.body)
            title = data.get("title")
            text = data.get("markdown")

            if not title or not text:
                raise tornado.web.HTTPError(400, "Title and markdown are required")

            # Convert markdown to HTML
            html = markdown.markdown(text)

            # Update the entry in the database
            current_time = datetime.now(pytz.UTC)  # Use UTC timezone
            await self.execute(
                "UPDATE entries SET author_id = %s, title = %s, markdown = %s, html = %s, updated = %s "
                "WHERE slug = %s",
                self.current_user.id,
                title,                
                text,
                html,
                current_time,
                slug,
            )

            # Respond with success
            self.write({"status": "success", "message": "Blog post updated", "slug": slug})

        except Exception as e:
            logging.error(f"Error updating blog post: {e}")
            self.set_status(500)
            self.write({"status": "error", "message": "Failed to update blog post"})


async def main():
    tornado.options.parse_command_line()

    # Create the global connection pool.
    async with aiopg.create_pool(
        host=options.db_host,
        port=options.db_port,
        user=options.db_user,
        password=options.db_password,
        dbname=options.db_database,
    ) as db:
        await maybe_create_tables(db)
        app = Application(db)
        app.listen(options.port)

        # In this demo the server will simply run until interrupted
        # with Ctrl-C, but if you want to shut down more gracefully,
        # call shutdown_event.set().
        shutdown_event = tornado.locks.Event()
        await shutdown_event.wait()


if __name__ == "__main__":
    asyncio.run(main())
