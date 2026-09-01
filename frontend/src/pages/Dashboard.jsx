import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, Hash, Shuffle, Users, ShieldCheck, Edit2, X, LogIn, MessageCircle, Loader2, Smartphone, Wifi, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHostel, setEditHostel] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const navigate = useNavigate();
  const { user, updateProfile } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  const fetchData = async () => {
    try {
      const roomsRes = await axios.get(`${API_URL}/api/rooms`, { timeout: 6000 });
      if (roomsRes.data) {
        setRooms(roomsRes.data);
      }
    } catch (err) {
      console.log('Error fetching rooms from server:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleUserStatusChange = () => fetchData();
      socket.on('user-online', handleUserStatusChange);
      socket.on('user-offline', handleUserStatusChange);

      socket.on('match-found', (data) => {
        setIsSearching(false);
        navigate(`/chat/${data.roomId}`, { state: { partnerUserId: data.partnerUserId, partnerName: data.partnerName } });
      });

      socket.on('room-count-updated', (data) => {
        setRooms(prevRooms => prevRooms.map(room => 
          room.roomId === data.roomId ? { ...room, activeUsers: data.count } : room
        ));
      });

      return () => {
        socket.off('user-online', handleUserStatusChange);
        socket.off('user-offline', handleUserStatusChange);
        socket.off('match-found');
        socket.off('room-count-updated');
      };
    }
  }, [socket, navigate]);

  const handleRandomMatch = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (socket && user) {
      setIsSearching(true);
      socket.emit('join-random', user.name);
    }
  };

  const handleEnterRoom = (roomId) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/chat/${roomId}`);
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
      {/* Unified Global Navbar */}
      <Navbar />

      <main className="dashboard-main">
        {/* Edit Profile Modal */}
        {isEditProfileOpen && user && (
          <div className="modal-overlay flex-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }}>
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
            <h2 className="heading-lg">
              {user ? `Welcome back, ${user.name}` : 'Chitkara Hostel Rooms'}
            </h2>
            <p className="text-body">
              Explore rooms or connect with hostel peers.
            </p>
          </div>
          {!user && (
            <button className="btn btn-primary" onClick={() => navigate('/auth')}>
              <LogIn size={18} /> Sign In
            </button>
          )}
        </header>

        {/* Slim Distinct Network Alert Bar */}
        <div className="network-alert-strip flex-between">
          <div className="flex-center" style={{ gap: '0.85rem' }}>
            <div className="alert-pulse-dot"></div>
            <div className="alert-text-content">
              <span className="alert-highlight-tag">Network Advisory:</span>
              <span> Please switch to your <strong>Personal Mobile Hotspot (4G/5G)</strong> before matching. Campus & hostel Wi-Fi firewalls often block live video streams.</span>
            </div>
          </div>
        </div>

        {/* Hero Random Matchmaking Card */}
        <div className="match-launchpad-card flex-between">
          <div className="match-launchpad-info flex-center" style={{ justifyContent: 'flex-start', gap: '1.5rem' }}>
            <div className="match-icon-halo flex-center">
              <Shuffle size={30} color="#6366f1" />
            </div>
            <div>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <h3 className="heading-md" style={{ margin: 0 }}>Instant Random Matchmaking</h3>
                <span className="badge badge-indigo">1-on-1 Live Peer</span>
              </div>
              <p className="text-small" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Connect 1-on-1 with verified Chitkara hostel students for instant video & voice chats.
              </p>
            </div>
          </div>
          <button 
            className="btn btn-primary match-start-btn" 
            onClick={handleRandomMatch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching Match...' : <><Shuffle size={18} /> Start Matching</>}
          </button>
        </div>

        <div className="rooms-section-header flex-between">
          <div>
            <h3 className="heading-md">Available Rooms</h3>
            <p className="text-small">Select a room to enter text and video discussion</p>
          </div>
        </div>

        {/* Rooms Grid */}
        {isLoadingRooms ? (
          <div className="text-center py-5 glass-card" style={{ padding: '3rem 1rem' }}>
            <Loader2 size={32} color="#ea580c" className="animate-spin mb-3" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Loading rooms...</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room._id || room.roomId} className="glass-card room-card">
                <div className="room-card-header flex-between">
                  <div className="room-icon flex-center">
                    <Hash size={24} color="#ea580c" />
                  </div>
                  <span className="badge badge-dark">{room.activeUsers || 0} active users</span>
                </div>
                <h3 className="heading-md room-title">{room.name}</h3>
                <div className="room-types">
                  <span className="type-indicator"><MessageCircle size={14} /> Real-time Chat</span>
                  <span className="type-indicator" style={{ marginLeft: '1rem' }}><Video size={14} /> Video Enabled</span>
                </div>
                <p className="text-small text-muted mt-4 mb-4">
                  {room.description || `Join this room to discuss with peers.`}
                </p>
                <button 
                  className="btn btn-primary w-100 mt-auto"
                  onClick={() => handleEnterRoom(room.roomId)}
                >
                  Enter Room
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="safety-banner flex-between mt-8">
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
            <ShieldCheck size={24} color="#ea580c" />
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600' }}>Chitkara Student Safety Guarantee</h4>
              <p className="text-small text-muted">All rooms are verified for @chitkara.edu.in accounts. Zero tolerance for abusive language.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
