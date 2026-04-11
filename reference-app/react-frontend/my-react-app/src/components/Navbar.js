// ./react-frontend/my-react-app/src/components/Navbar.js

import React, { useContext } from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import { UserRoleContext } from '../contexts/UserRoleContext';

import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/mystyle.css'
import '../assets/custom.css'

function Navbar() {
  const navClassName = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;
  
  const { userRole, setUserRole, loading } = useContext(UserRoleContext); // Access setUserRole from context
  const navigate = useNavigate(); // Use useNavigate to programmatically navigate

  const handleLogout = () => {
    // Clear session cookies by setting their expiration date to a past time
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      console.log('logging of sesstion cookies', name);
      // document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      // Skip clearing the "_xsrf" cookie
      if (name !== '_xsrf') {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }      
    });

    // Reset the user role state to null
    setUserRole(null);
    console.log('User role reset to null, session cookies cleared.');

    // Navigate to the login page
    navigate('/login');
  };
  
  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <nav className="navbar navbar-expand-sm bg-plant-green navbar-dark">
      <div className="container">
        <ul className="navbar-nav mr-auto">
        <li className="nav-item">
            <NavLink className={navClassName} to="/">Home</NavLink>
        </li>  
        {userRole === 'author' && (
            <>
            <li className="nav-item">
              <NavLink className={navClassName} to="/blog-entries">Blog Entries</NavLink>
            </li>            
            <li className="nav-item">
              <NavLink className={navClassName} to="/create-blog-entry">Create Blog Entry</NavLink>
            </li>            
            </>
          )}      
        </ul>
        <ul className="navbar-nav ml-auto">
        {!userRole ? (
        <>
          <li className="nav-item">
            <NavLink className={navClassName} to="/login">
              Login
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className={navClassName} to="/register">
              Register
            </NavLink>
          </li>          
        </>
        ) : (
          <li className="nav-item">
            <button
              className="nav-link btn btn-link"
              onClick={handleLogout} // Adjust this as needed for your actual function
            >
              Logout
            </button>
          </li>
        )}



      </ul>
      </div>
    </nav>
  );
}

export default Navbar
