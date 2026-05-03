import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Video, MessageSquare, LogOut, Hash, Shuffle, Check, Home, Users, Layout, MicOff, Gamepad2, BookOpen, ShieldCheck, ChevronDown, Grid, List } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  const fetchData = async () => {
    try {
      if (!user) return;
      
      const [roomsRes, countRes, friendsRes] = await Promise.all([
        axios.get(`${API_URL}/api/rooms`),
        axios.get(`${API_URL}/api/users/online-count`),
        axios.get(`${API_URL}/api/users/${user._id}/friends`)
      ]);
      
      setRooms(roomsRes.data);
      setOnlineCount(countRes.data.count);
      setFriends(friendsRes.data.friends || []);
      setFriendRequests(friendsRes.data.friendRequests || []);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    if (socket) {
      const handleUserStatusChange = () => fetchData();
      socket.on('user-online', handleUserStatusChange);
      socket.on('user-offline', handleUserStatusChange);

      socket.on('match-found', (data) => {
        setIsSearching(false);
        // data contains roomId and partnerUserId
        navigate(`/chat/${data.roomId}`, { state: { partnerUserId: data.partnerUserId } });
      });

      return () => {
        socket.off('user-online', handleUserStatusChange);
        socket.off('user-offline', handleUserStatusChange);
        socket.off('match-found');
      };
    }
  }, [socket, navigate]);

  const handleRandomMatch = () => {
    if (socket) {
      setIsSearching(true);
      socket.emit('join-random');
    }
  };

  const acceptRequest = async (fromUserId) => {
    try {
      await axios.post(`${API_URL}/api/users/friend-request/accept`, {
        userId: user._id,
        fromUserId
      });
      fetchData(); // Refresh lists
    } catch (error) {
      console.error('Error accepting friend request', error);
      alert('Could not accept request');
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <MessageSquare size={24} color="var(--accent-primary)" />
          <span className="heading-md" style={{ marginLeft: '0.5rem' }}>ChitMeet</span>
        </div>

        <div className="sidebar-nav">
          <ul className="main-nav">
            <li className="nav-item active">
              <Home size={18} /> Home
            </li>
            <li className="nav-item">
              <Layout size={18} /> Rooms
            </li>
            <li className="nav-item">
              <Users size={18} /> Contacts
            </li>
          </ul>

          <h4 className="nav-title mt-4">PROFILE</h4>
          <div className="profile-section">
            <p className="text-body" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{user?.name || 'mani2'}</p>
            <p className="text-small text-muted mb-2">{user?.hostelBlock || 'FA'}</p>
            <div className="online-badge">
              <div className="online-indicator-dot"></div>
              {onlineCount} User Online
            </div>
          </div>

          <h4 className="nav-title mt-4">CONTACTS ({friends.length || 2})</h4>
          <ul className="friend-list">
            {(friends.length > 0 ? friends : [{_id: 1, name: 'mani', isOnline: false}, {_id: 2, name: 'aman', isOnline: false}]).map(friend => (
              <li key={friend._id} className="friend-item">
                <div className="avatar-placeholder">
                  {friend.name.charAt(0).toUpperCase()}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{friend.name}</span>
                  <span className="friend-hostel text-muted">{friend.isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-secondary logout-btn" onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header flex-between">
          <div>
            <h2 className="heading-lg">Welcome back, {user?.name || 'mani2'}</h2>
            <p className="text-body">Connect and collaborate with people around you.</p>
          </div>
          
          <div className="search-bar input-with-icon">
            <Search size={18} className="input-icon" />
            <input type="text" className="input-field" placeholder="Search rooms or people..." />
          </div>
        </header>

        {/* Random Match Banner */}
        <div className="random-match-banner flex-between">
          <div className="banner-content flex-center" style={{ justifyContent: 'flex-start', gap: '1.5rem' }}>
            <div className="banner-icon flex-center">
              <Users size={32} color="white" />
            </div>
            <div>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                <h3 className="heading-md" style={{ margin: 0 }}>Random Match</h3>
                <span className="badge badge-purple">Instant</span>
              </div>
              <p className="text-small" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Get matched with another user instantly.<br />
                Video and audio are enabled for this session.
              </p>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleRandomMatch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : <><Shuffle size={18} /> Start Matching</>}
          </button>
        </div>

        <div className="rooms-section-header flex-between">
          <div>
            <h3 className="heading-md">Available Rooms</h3>
            <p className="text-small">Select a room to begin your session</p>
          </div>
          <div className="rooms-actions flex-center gap-4">
            <div className="dropdown">
              All Rooms <ChevronDown size={16} />
            </div>
            <div className="view-toggles flex-center">
              <button className="icon-btn active"><Grid size={18} /></button>
              <button className="icon-btn"><List size={18} /></button>
            </div>
          </div>
        </div>

        <div className="rooms-grid">
          {rooms.length > 0 ? rooms.map(room => (
            <div key={room._id} className="glass-card room-card">
              <div className="room-card-header flex-between">
                <div className="room-icon flex-center">
                  <Hash size={24} color="var(--accent-primary)" />
                </div>
                <span className="badge badge-dark">{room.activeUsers || 0} active users</span>
              </div>
              <h3 className="heading-md room-title">{room.name}</h3>
              <div className="room-types">
                <span className="type-indicator"><MicOff size={14} /> Audio Disabled</span>
                <span className="type-indicator" style={{ marginLeft: '1rem' }}><Video size={14} /> Video Enabled</span>
              </div>
              <p className="text-small text-muted mt-4 mb-4">
                Join this room to talk about {room.name}.
              </p>
              <button 
                className="btn btn-primary w-100 mt-auto"
                onClick={() => navigate(`/chat/${room.roomId}`)}
              >
                Enter Room
              </button>
            </div>
          )) : (
            <>
              {/* Dummy Rooms for visual matching */}
              <div className="glass-card room-card">
                <div className="room-card-header flex-between">
                  <div className="room-icon flex-center">
                    <Gamepad2 size={24} color="var(--accent-primary)" />
                  </div>
                  <span className="badge badge-dark">No active users</span>
                </div>
                <h3 className="heading-md room-title mt-4">Gaming Lounge</h3>
                <div className="room-types mt-2">
                  <span className="type-indicator"><MicOff size={14} /> Audio Disabled</span>
                  <span className="type-indicator" style={{ marginLeft: '1rem' }}><Video size={14} /> Video Enabled</span>
                </div>
                <p className="text-small text-muted mt-4 mb-4">
                  Casual conversations about gaming, esports and more.
                </p>
                <button className="btn btn-primary w-100 mt-auto">
                  Enter Room
                </button>
              </div>

              <div className="glass-card room-card">
                <div className="room-card-header flex-between">
                  <div className="room-icon flex-center" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                    <BookOpen size={24} color="#a855f7" />
                  </div>
                  <span className="badge badge-dark">No active users</span>
                </div>
                <h3 className="heading-md room-title mt-4">Study Session (Late Night)</h3>
                <div className="room-types mt-2">
                  <span className="type-indicator"><MicOff size={14} /> Audio Disabled</span>
                  <span className="type-indicator" style={{ marginLeft: '1rem' }}><Video size={14} /> Video Enabled</span>
                </div>
                <p className="text-small text-muted mt-4 mb-4">
                  Focused study and academic discussions. Keep it productive.
                </p>
                <button className="btn btn-primary w-100 mt-auto">
                  Enter Room
                </button>
              </div>
            </>
          )}
        </div>

        <div className="safety-banner flex-between mt-8">
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
            <ShieldCheck size={24} color="var(--accent-primary)" />
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '500' }}>Your safety is our priority</h4>
              <p className="text-small text-muted">Rooms are moderated and users are expected to follow our community guidelines.</p>
            </div>
          </div>
          <a href="#" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', textDecoration: 'none' }}>Learn more &gt;</a>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
