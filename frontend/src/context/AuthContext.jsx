import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // { id, email, role }
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          // In a real app, you'd have an endpoint like /auth/me to validate token and get user info
          // For now, we'll decode the token or assume a successful login has set user data
          // Or, if the backend sends user info with the access token, we'd parse it.
          // For this example, we'll simulate fetching user data.
          const response = await axiosInstance.get('/auth/me'); // Example endpoint
          setUser(response.data.user); // Assuming response.data.user contains { id, email, role }
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to load user from token:', error);
          localStorage.removeItem('accessToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const register = async (email, password, first_name, last_name, role) => {
    try {
      const response = await axiosInstance.post('/auth/register', { email, password, first_name, last_name, role });
      const { accessToken, user } = response.data;
      localStorage.setItem('accessToken', accessToken);
      setIsAuthenticated(true);
      setUser(user);
      if (user.role === 'Manager') navigate('/manager/dashboard');
      else if (user.role === 'Employee') navigate('/employee/dashboard');
      else navigate('/');
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { accessToken, user } = response.data; // Assuming backend returns accessToken and user info
      localStorage.setItem('accessToken', accessToken);
      setIsAuthenticated(true);
      setUser(user);
      // Redirect based on role
      if (user.role === 'Manager') {
        navigate('/manager/dashboard');
      } else if (user.role === 'Employee') {
        navigate('/employee/dashboard');
      } else {
        navigate('/'); // Default fallback
      }
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      setIsAuthenticated(false);
      setUser(null);
      throw error; // Re-throw to be handled by the component
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout'); // Invalidate refresh token on backend
    } catch (error) {
      console.error('Logout failed on server:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false);
      setUser(null);
      navigate('/login');
    }
  };

  const hasRole = (requiredRoles) => {
    if (!user || !user.role) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, register, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
