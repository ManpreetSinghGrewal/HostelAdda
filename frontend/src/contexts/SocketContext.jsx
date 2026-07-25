import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      // Avoid unsecure http socket calls when deployed on https
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_URL.startsWith('http:')) {
        console.warn('Live site running on HTTPS cannot connect to HTTP API. Please configure VITE_API_URL.');
      }

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
