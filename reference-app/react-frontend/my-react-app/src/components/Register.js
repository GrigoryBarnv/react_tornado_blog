// ./react-frontend/my-react-app/src/components/Register.js

import React, { useState } from 'react';
import Cookies from 'js-cookie';
import config from '../config';

function Register() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {

      // Define data for request
      const data = {
        email,
        name,
        password,
      };

      // Define headers for request
      const headers = {
        'Content-Type': 'application/json',
      };

      // Retrieve the CSRF token from the cookie
      const csrfToken = Cookies.get('_xsrf');
      console.log('Logging of Csrf token', csrfToken)
      // console.log('CSRF Token:', csrfToken);
      if (csrfToken) {
        headers['X-XSRFToken'] = csrfToken;
      }
      console.log('Headers sent from registration', headers)

      const response = await fetch(`${config.backendBaseUrl}/register`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: headers,
        credentials: 'include', // Include cookies in the request
      });
      console.log('logging of response status: ', response.ok);
      if (response.ok) {
        window.location.href = `${config.frontendBaseUrl}/login`
      }      
    } catch (error) {
      alert('Registering failed!')
      console.error('There was an error!', error);
    }
  };

  return (
    <div>
        <h2>Register</h2>
        <hr />
        <form onSubmit={handleRegister}>
            <div className="mb-3">
                <label htmlFor="name" className="form-label">Name:</label>
                <input
                    type="text"
                    className="form-control"
                    id="name"
                    placeholder="Enter name"
                    name="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required                   
                />
            </div>
            <div className="mb-3">
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
            <hr />
            <button type="submit" className="btn btn-plant-green">Register</button>
      </form>
    </div>
  );
}

export default Register
