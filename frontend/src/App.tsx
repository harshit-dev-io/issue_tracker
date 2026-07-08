import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import Login from './views/Login';
import Signup from './views/Signup';
import Dashboard from './views/Dashboard';

function ProtectedRoutes() {
  const auth = useContext(AuthContext);

  if (!auth?.accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <WorkspaceProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </WorkspaceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard/*" element={<ProtectedRoutes />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}