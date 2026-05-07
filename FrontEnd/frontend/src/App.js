import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';


import Login    from './pages/Login';
import SignIn   from './pages/SignIn';
import HomePage from './pages/Home';
import WebbyDocs from './pages/Docs';
import Dashboard from './tabs/Dashboard';

import CreateUser      from './components/CreateUser';
import UserLists       from './components/UserLists';
import ProtectedRoutes from './components/ProtectedRoutes';




function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"       element={<HomePage />} />
          <Route path="/login"  element={<Login />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/docs"    element={<WebbyDocs />} />

          {/* Protected — all handled inside Dashboard shell via sidebar tabs */}
          <Route path="/dashboard" element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>} />
          <Route path="/jobs"      element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>} />
          <Route path="/export"    element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>} />
          <Route path="/settings"  element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>} />
          <Route path="/models"    element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>} />

          {/* Other protected pages */}
          <Route path="/users"       element={<ProtectedRoutes><UserLists /></ProtectedRoutes>} />
          <Route path="/create-user" element={<ProtectedRoutes><CreateUser /></ProtectedRoutes>} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;