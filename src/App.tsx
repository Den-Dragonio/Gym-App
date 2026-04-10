import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Social } from './pages/Social';
import { Workouts } from './pages/Workouts';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="social" element={<Social />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:uid" element={<Profile />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
