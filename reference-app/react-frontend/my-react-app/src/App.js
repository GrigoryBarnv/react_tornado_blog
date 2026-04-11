import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomeComponent from "./components/HomeComponent"; 
import MessageComponent from "./components/MessageComponent";
import Home from "./components/Home";
import { UserRoleProvider } from './contexts/UserRoleContext';
import ProtectedRoute from "./components/ProtectedRoute";
import Logo from './components/Logo';
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import Login from "./components/Login";
import BlogEntries from "./components/BlogEntries";
import CreateBlogEntry from "./components/CreateBlogEntry";
import UpdateBlogEntry from "./components/UpdateBlogEntry";

import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/mystyle.css'
import './assets/custom.css'

function App() {
  return (
    <UserRoleProvider>
    <Router basename="/blog-demo-01">
      <Logo />
      <Navbar />
      <div
        className="container mt-5 mb-5"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 18px 45px rgba(31, 56, 38, 0.12)',
        }}
      >
      <Routes>
        {/* Public Routes */}
        <Route path="/home" element={<HomeComponent />} />
        <Route path="/" element={<Home />} />
        <Route path="/message" element={<MessageComponent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/blog-entries"
          element={
            <ProtectedRoute allowedRoles={['author']}>
              <BlogEntries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-blog-entry"
          element={
            <ProtectedRoute allowedRoles={['author']}>
              <CreateBlogEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/update-blog-entry"
          element={
            <ProtectedRoute allowedRoles={['author']}>
              <UpdateBlogEntry />
            </ProtectedRoute>
          }
        />
      </Routes>
      </div>
    </Router>
    </UserRoleProvider>
  );
}

export default App;
