// ./react-frontend/my-react-app/src/components/UpdateBlogEntry.js

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from "react-router-dom";
import Cookies from 'js-cookie';
import config from '../config';

const UpdateBlogEntry = ({ slug }) => {
  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const location = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const query = new URLSearchParams(location.search);
  const entrySlug = query.get("entry_slug");

  useEffect(() => {
    // Fetch the blog entry by slug when the component mounts
    const fetchEntry = async () => {
      try {
        const response = await fetch(`${config.backendBaseUrl}/update-blog-entry/${entrySlug}`, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setTitle(data.entry.title);
            setMarkdown(data.entry.markdown);
          } else {
            setError(data.message || 'Failed to fetch blog entry.');
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to fetch blog entry.');
        }
      } catch (err) {
        console.error('Error fetching blog entry:', err);
        setError('An unexpected error occurred while fetching the blog entry.');
      }
    };

    fetchEntry();
  }, [entrySlug]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError(null);
      setSuccess(null);

      console.log('Data sent to backend:', JSON.stringify({ title, markdown }));

      // Define headers for the request
      const headers = {
        'Content-Type': 'application/json',
      };

      // Retrieve the CSRF token from the cookie
      const csrfToken = Cookies.get('_xsrf');
      console.log('CSRF Token:', csrfToken);
      if (csrfToken) {
        headers['X-XSRFToken'] = csrfToken; // Add the CSRF token to the headers
      }

      const response = await fetch(`${config.backendBaseUrl}/update-blog-entry/${entrySlug}`, {
        method: 'POST',
        headers: headers,
        credentials: 'include', // To include cookies for authentication
        body: JSON.stringify({ title, markdown }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Blog post updated successfully!');
        setIsSubmitted(true); // Set submitted state to true
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update the blog post.');
      }
    } catch (err) {
      console.error('Error updating blog post:', err);
      setError('An unexpected error occurred while updating the blog post.');
    }
  };

  return (
    <div>
      <h2>Update Blog Post</h2>
      <hr />
      {error && 
        <div class="alert alert-warning" role="alert">
        {error}
        </div>
      }
      {success && 
        <div class="alert alert-success" role="alert">
        {success}
        </div>
      }
      {!isSubmitted ? (
        <form onSubmit={handleSubmit}>
            <div className="mb-3 mt-3">
            <label htmlFor="title" className="form-label">
                Title:
            </label>
            <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
            </div>

            <div className="mb-3">
            <label htmlFor="markdown" className="form-label">
                Content:
            </label>
            <textarea
                id="markdown"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                required
                className="form-control"
            ></textarea>
            </div>

            <button
            type="submit"
            className="btn btn-plant-green"
            >
            Update Entry
            </button>
        </form>
      ) : (
        <div>
          <Link to="/" className="btn btn-plant-green">
            Go to Home Page
          </Link>
        </div>
      )}      
    </div>
  );
};

export default UpdateBlogEntry;
