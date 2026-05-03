import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Video, MessageSquare, LogOut, Hash } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import './Dashboard.css';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/rooms');
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms', error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/users/online');
      // Filter out the current user so they don't see themselves in the online friends list
      setOnlineFriends(data.filter(u => u._id !== user?._id));
    } catch (error) {
      console.error('Error fetching online users', error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchRooms();
    fetchOnlineUsers();
  }, [user, navigate]);

  useEffect(() => {
    if (socket) {
      const handleUserStatusChange = () => {
        // Simple strategy: refetch the list when anyone comes online or goes offline
        fetchOnlineUsers();
      };

      socket.on('user-online', handleUserStatusChange);
      socket.on('user-offline', handleUserStatusChange);

      return () => {
        socket.off('user-online', handleUserStatusChange);
        socket.off('user-offline', handleUserStatusChange);
      };
    }
  }, [socket, user]);

  return (
    <div className="dashboard-container">
      <aside className="glass-panel sidebar">
        <div className="sidebar-header">
          <MessageSquare size={24} color="var(--accent-primary)" />
          <span className="heading-md" style={{ marginLeft: '0.5rem' }}>ChitMeet</span>
        </div>

        <div className="sidebar-nav">
          <h4 className="nav-title">Profile</h4>
          <div style={{ marginBottom: '2rem' }}>
            <p className="text-body" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-small">{user?.hostelBlock}</p>
          </div>

          <h4 className="nav-title">Online Friends ({onlineFriends.length})</h4>
          <ul className="friend-list">
            {onlineFriends.map(friend => (
              <li key={friend._id} className="friend-item">
                <div className="avatar-placeholder">
                  {friend.name.charAt(0).toUpperCase()}
                  <div className="online-indicator"></div>
                </div>
                <div className="friend-info">
                  <span className="friend-name">{friend.name}</span>
                  <span className="friend-hostel">{friend.hostelBlock}</span>
                </div>
              </li>
            ))}
            {onlineFriends.length === 0 && (
              <p className="text-small">No one else is online right now.</p>
            )}
          </ul>
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-secondary w-100" onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header flex-between glass-panel">
          <div>
            <h2 className="heading-lg">Rooms</h2>
            <p className="text-body">Join a room to start chatting.</p>
          </div>
          
          <div className="search-bar input-with-icon">
            <Search size={18} className="input-icon" />
            <input type="text" className="input-field" placeholder="Search rooms or people..." />
          </div>
        </header>

        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room._id} className="glass-card room-card">
              <div className="room-card-header flex-between">
                <div className="room-icon flex-center">
                  <Hash size={24} color="var(--accent-primary)" />
                </div>
                <span className="badge">{room.activeUsers || 0} online</span>
              </div>
              <h3 className="heading-md room-title">{room.name}</h3>
              <div className="room-types">
                {(room.type === 'video' || room.type === 'both') && (
                  <span className="type-indicator"><Video size={14} /> Video</span>
                )}
                {(room.type === 'text' || room.type === 'both') && (
                  <span className="type-indicator"><MessageSquare size={14} /> Text</span>
                )}
              </div>
              <button 
                className="btn btn-primary w-100 mt-4"
                onClick={() => navigate(`/chat/${room.roomId}`)}
              >
                Join Room
              </button>
            </div>
          ))}
          {rooms.length === 0 && <p className="text-muted">No rooms available. Seed the database to get started.</p>}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
