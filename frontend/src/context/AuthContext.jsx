import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    console.log('checkAuth: Token exists?', !!token);
    
    if (token) {
      try {
        console.log('checkAuth: Fetching user profile...');
        const response = await authAPI.getCurrentUser();
        console.log('checkAuth: User data received:', response.data);
        setUser(response.data);
        console.log('checkAuth: User state set');
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } else {
      console.log('checkAuth: No token found');
    }
    console.log('checkAuth: Setting loading to false');
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      console.log('AuthContext: Calling login API...');
      const response = await authAPI.login(username, password);
      console.log('AuthContext: Login API response:', response.data);
      
      const { access, refresh } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      console.log('AuthContext: Getting user profile...');
      const userResponse = await authAPI.getCurrentUser();
      console.log('AuthContext: User profile:', userResponse.data);
      
      setUser(userResponse.data);
      
      console.log('AuthContext: Returning success');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};