import React, { createContext, useState } from 'react';
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

  const googleAuth = async (credential, gender, hostelBlock) => {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_URL.includes('localhost')) {
      return {
        success: false,
        message: 'Live site cannot connect to localhost. Please add VITE_API_URL in Vercel Environment Variables.'
      };
    }

    try {
      const { data } = await axios.post(`${API_URL}/api/auth/google`, {
        credential,
        gender,
        hostelBlock
      }, { timeout: 15000 });

      if (data.requiresProfileDetails) {
        return {
          requiresProfileDetails: true,
          email: data.email,
          name: data.name,
          picture: data.picture,
          message: data.message
        };
      }

      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return { success: false, message: 'Server connection timed out. Please check backend connection.' };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Google Sign-In failed'
      };
    }
  };

  const sendOTP = async (email) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/send-otp`, { email }, { timeout: 15000 });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP email.'
      };
    }
  };

  const verifyOTP = async (email, otp, name, password, gender, hostelBlock) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp,
        name,
        password,
        gender,
        hostelBlock
      }, { timeout: 15000 });

      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed.'
      };
    }
  };

  const emailRegister = async (name, email, password, gender, hostelBlock) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
        gender,
        hostelBlock
      }, { timeout: 15000 });

      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const emailLogin = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      }, { timeout: 15000 });

      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed.'
      };
    }
  };

  const updateProfile = async (name, hostelBlock) => {
    try {
      const { data } = await axios.put(`${API_URL}/api/users/${user._id}/profile`, { name, hostelBlock });
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
    <AuthContext.Provider value={{ user, logout, updateProfile, googleAuth, sendOTP, verifyOTP, emailRegister, emailLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
