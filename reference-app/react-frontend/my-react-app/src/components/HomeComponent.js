// ./react-frontend/my-react-app/src/components/HomeComponent.js

import React from "react";
import "../App.css";

const HomeComponent = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img
          src={`${process.env.PUBLIC_URL}/plant_logo.jpg`}
          className="App-logo"
          alt="PlantBlog logo"
        />
        <p>PlantBlog collects plant care notes, updates, and new entries in one place.</p>
        <a className="App-link" href={`${process.env.PUBLIC_URL}/`}>
          Go to PlantBlog home
        </a>
        <a
          className="App-link"
          href="https://www.rhs.org.uk/plants/types/houseplants"
          target="_blank"
          rel="noopener noreferrer"
        >
          Plant care inspiration
        </a>
      </header>
    </div>
  );
};

export default HomeComponent;
