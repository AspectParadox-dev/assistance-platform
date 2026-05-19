import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, getMe, googleLogin as apiGoogleLogin } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
      getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const { token, user } = await apiLogin(email, password);
    if (!token || token === 'undefined' || token === 'null') {
      throw new Error('Authentication failed: server did not return a valid token');
    }
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  }

  async function googleLogin(credential) {
    const { token, user } = await apiGoogleLogin(credential);
    if (!token || token === 'undefined' || token === 'null') {
      throw new Error('Authentication failed: server did not return a valid token');
    }
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
