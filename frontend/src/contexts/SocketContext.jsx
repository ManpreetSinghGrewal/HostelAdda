import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'https://chitmeet.onrender.com';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5001';
};

const API_URL = getApiUrl();

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const authContext = useContext(AuthContext) || { user: null };
  const user = authContext.user;

  useEffect(() => {
    try {
      const newSocket = io(API_URL, {
        query: { userId: user ? user._id : 'guest' },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) newSocket.close();
      };
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
