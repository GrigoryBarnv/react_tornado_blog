// ./react-frontend/my-react-app/src/contexts/UserRoleContext.js

import React, { createContext, useState, useEffect } from 'react';
import config from '../config';

export const UserRoleContext = createContext();

export const UserRoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from backend
  const fetchUserRole = async () => {      
    try {            
        const response = await fetch(`${config.backendBaseUrl}/get-user-role`);
        if (!response.ok) {
            throw new Error(`Failed to fetch user role with status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched role:', data.role); // Debugging log
        setUserRole(data.role); // Update userRole state with fetched role
    } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null); // Handle unauthorized access or errors by setting role to null
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole, fetchUserRole, loading }}>
      {children}
    </UserRoleContext.Provider>
  );
};
