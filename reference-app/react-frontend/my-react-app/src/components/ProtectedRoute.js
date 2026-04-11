// ./react-frontend/my-react-app/src/components/ProtectedRoute.js

import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserRoleContext } from "../contexts/UserRoleContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userRole, loading } = useContext(UserRoleContext);

  if (loading) {
    return(
        <div class="alert alert-info" role="alert">
        Loading...
    </div>
    )
  }

  if (!userRole) {
    // If user is not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // If user's role is not authorized, redirect to home or an error page
    return <Navigate to="/" replace />;
  }

  // If user is authorized, render the child components
  return children;
};

export default ProtectedRoute;
