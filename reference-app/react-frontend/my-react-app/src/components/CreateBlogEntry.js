// ./react-frontend/my-react-app/src/components/CreateBlogEntry.js

import React, { useState } from 'react';
import { Link } from "react-router-dom";
import Cookies from 'js-cookie';
import config from '../config';

const CreateBlogEntry = () => {
  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError(null);
      setSuccess(null);

      console.log('Data sent to backend: ', JSON.stringify({ title, markdown }))

      // Define headers for request
      const headers = {
        'Content-Type': 'application/json',
      };
      // Retrieve the CSRF token from the cookie
      const csrfToken = Cookies.get('_xsrf');
      console.log('CSRF Token:', csrfToken);
      if (csrfToken) {
        headers['X-XSRFToken'] = csrfToken; // Add the CSRF token to the headers
      }      

      const response = await fetch(`${config.backendBaseUrl}/create-blog-entry`, {
        method: 'POST',
        headers: headers,
        credentials: 'include', // To include cookies for authentication
        body: JSON.stringify({ title, markdown }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Blog post created successfully!');
        setTitle('');
        setMarkdown('');
        setIsSubmitted(true); // Set submitted state to true
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create the blog post.');
      }
    } catch (err) {
      console.error('Error creating blog post:', err);
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div>
      <h2>Create Blog Entry</h2>
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
              className="form-control"
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
              row="10"
              style={{ minHeight: '200px' }}              
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn btn-plant-green"
          >
            Create Entry
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

export default CreateBlogEntry;
