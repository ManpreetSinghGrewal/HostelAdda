import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  });

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const sendOtp = async (email) => {
    // Check if live site (HTTPS) is trying to call unconfigured localhost backend
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_URL.includes('localhost')) {
      return {
        success: false,
        message: 'Live site cannot connect to localhost. Please add VITE_API_URL in Vercel Environment Variables.'
      };
    }

    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/send-otp`,
        { email },
        { timeout: 12000 }
      );
      return { 
        success: true, 
        message: data.message,
        isDevFallback: data.isDevFallback,
        devOtp: data.devOtp
      };
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return { success: false, message: 'Server connection timed out. Please check backend connection.' };
      }
      return { success: false, message: error.response?.data?.message || error.message || 'Failed to send OTP' };
    }
  };

  const register = async (name, email, password, gender, hostelBlock, otp) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, { name, email, password, gender, hostelBlock, otp });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const updateProfile = async (name, hostelBlock) => {
    try {
      const { data } = await axios.put(`${API_URL}/api/users/${user._id}/profile`, { name, hostelBlock });
      // Keep token if existing
      const updatedUser = { ...user, name: data.name, hostelBlock: data.hostelBlock };
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, sendOtp }}>
      {children}
    </AuthContext.Provider>
  );
};
