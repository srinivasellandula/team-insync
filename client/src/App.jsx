import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';
import { toast } from 'sonner';

export const AuthContext = React.createContext(null);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setLastActivity(Date.now());
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    toast.info('You have been logged out');
  }, []);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => setLastActivity(Date.now());
    
    // Listen to user interactions
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [user]);

  // Check for session timeout
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity > SESSION_TIMEOUT) {
        logout();
        toast.error('Session expired due to inactivity');
      } else if (timeSinceActivity > SESSION_TIMEOUT - 60000) {
        // Warn 1 minute before timeout
        toast.warning('Your session will expire soon due to inactivity');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, lastActivity, logout]);

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Router>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
