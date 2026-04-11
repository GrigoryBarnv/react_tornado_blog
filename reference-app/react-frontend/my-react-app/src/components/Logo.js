// ./src/components/Navbar.js

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/mystyle.css';
import '../assets/custom.css';

function Logo() {
  return (
    <div
      className="logo-cl header-01-cl"
      style={{
        textAlign: 'center',
        paddingTop: '20px',
        paddingBottom: '20px',
        backgroundColor: 'rgba(246, 248, 242, 0.9)',
      }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/plant_logo.jpg`}
        alt="PlantBlog logo"
        style={{
          width: '96px',
          height: '96px',
          objectFit: 'cover',
          borderRadius: '50%',
          marginBottom: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        }}
      />
      <h1 style={{ margin: 0, fontSize: '3rem', letterSpacing: '0.08em' }}>PlantBlog</h1>
      <p style={{ margin: '8px 0 0', color: '#4f4f4f' }}>Simple gardening stories and plant notes</p>
    </div>
  );
}

export default Logo;
