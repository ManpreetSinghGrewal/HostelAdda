import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Video, MessageSquare, LogOut, Hash, Shuffle, Check, Home, Users, Layout, MicOff, Gamepad2, BookOpen, ShieldCheck, ChevronDown, Grid, List, Edit2, X, MoreVertical } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineMaleCount, setOnlineMaleCount] = useState(0);
  const [onlineFemaleCount, setOnlineFemaleCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHostel, setEditHostel] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useContext(AuthContext);
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
      setOnlineMaleCount(countRes.data.maleCount || 0);
      setOnlineFemaleCount(countRes.data.femaleCount || 0);
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
        // data contains roomId, partnerUserId, partnerName
        navigate(`/chat/${data.roomId}`, { state: { partnerUserId: data.partnerUserId, partnerName: data.partnerName } });
      });

      return () => {
        socket.off('user-online', handleUserStatusChange);
        socket.off('user-offline', handleUserStatusChange);
        socket.off('match-found');
      };
    }
  }, [socket, navigate]);

  const handleRandomMatch = () => {
    if (socket && user) {
      setIsSearching(true);
      socket.emit('join-random', user.name);
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

  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditHostel(user?.hostelBlock || '');
    setIsEditProfileOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    const res = await updateProfile(editName, editHostel);
    setIsUpdating(false);
    if (res.success) {
      setIsEditProfileOpen(false);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="top-navbar glass-panel">
        <div className="navbar-left flex-center">
          <MessageSquare size={24} color="var(--accent-primary)" />
          <span className="heading-md" style={{ marginLeft: '0.5rem' }}>ChitMeet</span>
        </div>
        
        <div className="navbar-right flex-center">
          {/* Desktop Nav Items */}
          <div className="desktop-nav">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              <Home size={18} /> Home
            </button>
            <div className="online-badge" style={{ marginLeft: '1rem' }}>
              <div className="online-indicator-dot"></div>
              {onlineCount} Online (👨 {onlineMaleCount} 👩 {onlineFemaleCount})
            </div>
          </div>
          
          <button className="icon-btn mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <MoreVertical size={24} color="var(--text-primary)" />
          </button>
        </div>
      </header>

      {/* Mobile/Three-dot Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-dropdown glass-card" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 className="heading-md" style={{ margin: 0 }}>Menu</h3>
              <button className="icon-btn" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="profile-section mb-4">
              <div className="flex-between">
                <div>
                  <p className="text-body" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{user?.name}</p>
                  <p className="text-small text-muted">{user?.hostelBlock}</p>
                </div>
                <button className="icon-btn" onClick={() => { setIsMobileMenuOpen(false); openEditProfile(); }} title="Edit Profile">
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="online-badge mt-2">
                <div className="online-indicator-dot"></div>
                {onlineCount} Online (👨 {onlineMaleCount} 👩 {onlineFemaleCount})
              </div>
            </div>

            <h4 className="nav-title mt-4">CONTACTS ({friends.length})</h4>
            <ul className="friend-list mb-4">
              {friends.map(friend => (
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
              {friends.length === 0 && (
                <p className="text-small text-muted">You haven't added any friends yet. Meet people in Chitmeet Random Mode!</p>
              )}
            </ul>

            <div className="menu-actions mt-auto">
              <button className="btn btn-secondary logout-btn w-100" onClick={logout}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-main">
        {/* Edit Profile Modal */}
        {isEditProfileOpen && (
          <div className="modal-overlay flex-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }}>
            <div className="glass-card" style={{ width: '400px', padding: '2rem', position: 'relative' }}>
              <button className="icon-btn" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setIsEditProfileOpen(false)}>
                <X size={20} />
              </button>
              <h2 className="heading-lg mb-4">Edit Profile</h2>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="text-small text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Display Name</label>
                  <input 
                    type="text" 
                    className="input-field w-100" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-small text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Hostel Block</label>
                  <input 
                    type="text" 
                    className="input-field w-100" 
                    value={editHostel}
                    onChange={(e) => setEditHostel(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary mt-4" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        <header className="dashboard-header flex-between">
          <div>
            <h2 className="heading-lg">Welcome back, {user?.name}</h2>
            <p className="text-body">Connect and collaborate with people around you.</p>
          </div>
        </header>

        {/* Random Match Banner */}
        <div className="random-match-banner flex-between">
          <div className="banner-content flex-center" style={{ justifyContent: 'flex-start', gap: '1.5rem' }}>
            <div className="banner-icon flex-center">
              <Users size={32} color="var(--accent-primary)" />
            </div>
            <div>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                <h3 className="heading-md" style={{ margin: 0 }}>Chitmeet Random Match</h3>
                <span className="badge badge-purple">Instant</span>
              </div>
              <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
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
