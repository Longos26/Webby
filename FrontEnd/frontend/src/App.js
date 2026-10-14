// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';

import AuthBootstrap from './components/AuthBootstrap';
import ProtectedRoutes from './components/ProtectedRoutes';

import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import WebbyDocs from './pages/DocumentationPage';
import Dashboard from './tabs/Dashboard';

import CreateUser from './components/CreateUser';
import UserLists from './components/UserLists';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthBootstrap>
          <Routes>
            {/* ---------- Public ---------- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/docs" element={<WebbyDocs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ---------- App Shell (role-aware tabs inside AppShell) ----------
                Any authenticated user can hit these paths.
                AppShell decides which tabs are visible and which content renders.
                Non-admins attempting /dashboard, /jobs, /datasets, or /monitoring
                are automatically redirected to their default tab (/export). */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoutes>
                  <Dashboard />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoutes>
                  <Dashboard />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/datasets"
              element={
                <ProtectedRoutes>
                  <Dashboard />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoutes>
                  <Dashboard />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/export"
              element={
                <ProtectedRoutes>
                  <Dashboard />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/models"
              element={
                <ProtectedRoutes>
                  <Dashboard />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoutes>
                  <Dashboard />
                </ProtectedRoutes>
              }
            />

            {/* ---------- Admin only (non-shell pages) ---------- */}
            <Route
              path="/admin"
              element={
                <ProtectedRoutes adminOnly>
                  <Dashboard />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoutes adminOnly>
                  <UserLists />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/create-user"
              element={
                <ProtectedRoutes adminOnly>
                  <CreateUser />
                </ProtectedRoutes>
              }
            />

            {/* ---------- Fallback ---------- */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
    </Provider>
  );
}

export default App;