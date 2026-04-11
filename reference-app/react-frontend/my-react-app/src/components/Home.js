// ./react-frontend/my-react-app/src/components/Home.js

import React, { useEffect, useState } from 'react';
import config from '../config';

function About() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch(`${config.backendBaseUrl}/blog-entries`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setEntries(data.entries || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div className="about-page">
      <h2>Welcome to PlantBlog</h2>
      <hr/>
      <h3>General</h3>
      <p>
        This web application is a simple full-stack blog for plant care notes, updates, and entries.
      </p>
      <hr />
      <h3>Latest Entries</h3>
      {loading && <p>Loading blog entries...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && entries.length === 0 && <p>No blog entries yet.</p>}
      {!loading && !error && entries.length > 0 && (
        <div>
          {entries.map((entry) => (
            <article
              key={entry.id}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.88)',
                border: '1px solid #dbe7d3',
                borderRadius: '14px',
                padding: '1.25rem',
                marginBottom: '1rem',
              }}
            >
              <h4 style={{ marginBottom: '0.5rem' }}>{entry.title}</h4>
              <p style={{ color: '#5a6d58', marginBottom: '0.75rem' }}>
                Published {new Date(entry.published).toLocaleString()}
              </p>
              <div dangerouslySetInnerHTML={{ __html: entry.html }} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default About;
