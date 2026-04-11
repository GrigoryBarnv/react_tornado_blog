// ./react-frontend/my-react-app/src/components/BlogEntries.js

import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import config from '../config';

const BlogEntries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch blog entries from the backend
    const fetchEntries = async () => {
      try {
        const response = await fetch(`${config.backendBaseUrl}/blog-entries`); // Replace with your actual API endpoint
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Logging of fetched data ', data);
        setEntries(data.entries);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Blog Entries</h2>
      <hr />

      {entries.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Title</th>
              <th scope="col">Slug</th>
              <th scope="col">Published</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>{entry.title}</td>
                <td>{entry.slug}</td>
                <td>{new Date(entry.published).toLocaleString()}</td>
                <td>{new Date(entry.updated).toLocaleString()}</td>
                <td>
                  <NavLink
                    className="btn btn-plant-green btn-sm"
                    to={`/update-blog-entry?entry_slug=${entry.slug}`}
                  >
                    Update entry
                  </NavLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div class="alert alert-info" role="alert">
        No entries available!
        </div>
      )}        
    </div>
  );
};

export default BlogEntries;
