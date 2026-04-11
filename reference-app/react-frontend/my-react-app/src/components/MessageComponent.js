// ./react-frontend/my-react-app/src/components/MessageComponent.js

import React, { useEffect, useState } from "react";
import config from '../config';

const MessageComponent = () => {
  const [message, setMessage] = useState(""); // State to hold the fetched message
  const [error, setError] = useState(null); // State to hold any errors during fetch

  useEffect(() => {
    // Function to fetch the message from the backend
    const fetchMessage = async () => {
      try {
        const response = await fetch(`${config.backendBaseUrl}/message`); // Fetch from the proxy URL
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json(); // Parse JSON response
        setMessage(data.message); // Update the message state
      } catch (err) {
        setError(err.message); // Set the error state
      }
    };

    fetchMessage(); // Call the fetch function on component mount
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div>
      <h1>Backend Message</h1>
      {error ? (
        <p style={{ color: "red" }}>Error: {error}</p> // Display error if any
      ) : (
        <p>{message || "Loading..."}</p> // Display message or a loading indicator
      )}
    </div>
  );
};

export default MessageComponent;
