// ./react-frontend/my-react-app/src/components/Login.js

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import config from '../config';

function Login() {

  // const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Function for login of external users
  const handleLogin = async (e) => {
    e.preventDefault();
    try {

      // Define data for request
      const data = {
        email,
        password,
      };
      console.log('logging of data: ', data);
      
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

      // Make fetch request
      const response = await fetch(`${config.backendBaseUrl}/login`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: headers,
        credentials: 'include', // Include cookies in the request
      });

      console.log('logging of response status: ', response.ok);
      if (response.ok) {
        window.location.href = `${config.frontendBaseUrl}/`
      }      
    } catch (error) {
      alert('Login failed!')
      console.error('There was an error!', error);
    }
  };

  return (
      <div>
      <h2>Login</h2>
      <hr />
      <form onSubmit={handleLogin}>
      <div className="mb-3 mt-3">
        <label htmlFor="email" className="form-label">Email:</label>
        <input
          type="email"
          className="form-control"
          id="email"
          placeholder="Enter email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="pwd" className="form-label">Password:</label>
        <input
          type="password"
          className="form-control"
          id="pwd"
          placeholder="Enter password"
          name="pswd"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {/* <hr /> */}
      <button type="submit" className="btn btn-plant-green">Login</button>
      </form>
      </div>
      
  );
}

export default Login
