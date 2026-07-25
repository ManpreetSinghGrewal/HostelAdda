import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, MessageSquare, LogOut, Hash, Shuffle, Home, Users, MicOff, Gamepad2, BookOpen, ShieldCheck, Edit2, X, MoreVertical, Sun, Moon, LogIn, Sparkles, MessageCircle, Search, Filter } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import { ThemeContext } from '../contexts/ThemeContext';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Dashboard = () => {
  // Default Chitkara Hostel Rooms
  const defaultRooms = [
    {
      _id: 'default-1',
      roomId: 'franklin-lounge',
      name: 'Franklin Block Lounge',
      description: 'Franklin Hostel A & B student hub. Tech, projects, and casual hangouts.',
      activeUsers: 6,
      category: 'boys'
    },
    {
      _id: 'default-2',
      roomId: 'archimedes-lounge',
      name: 'Archimedes Block Lounge',
      description: 'CSE, Coding, Assignment help, and developer chats.',
      activeUsers: 9,
      category: 'boys'
    },
    {
      _id: 'default-3',
      roomId: 'ngh-girls-hub',
      name: 'NGH Girls Hub',
      description: 'Exclusive lounge for NGH Hostel A & B students. Peer chat & academic discussions.',
      activeUsers: 5,
      category: 'girls'
    },
    {
      _id: 'default-4',
      roomId: 'vasco-columbus-hub',
      name: 'Vasco & Columbus Hub',
      description: 'Girls Hostel discussion room for campus events, creative projects, and general chat.',
      activeUsers: 4,
      category: 'girls'
    },
    {
      _id: 'default-5',
      roomId: 'gaming-esports',
      name: 'Gaming & Esports Lounge',
      description: 'Valorant, BGMI, GTA, and multiplayer gaming matchmaking for Chitkara hostels.',
      activeUsers: 12,
      category: 'gaming'
    },
    {
      _id: 'default-6',
      roomId: 'late-night-study',
      name: 'Late Night Study & Code',
      description: 'Quiet study, exam revision, assignment collaboration, and coding help.',
      activeUsers: 7,
      category: 'study'
    }
  ];

  const navigate = useNavigate();
  const authContext = useContext(AuthContext) || {};
  const user = authContext.user || null;
  const logout = authContext.logout || (() => {});
  const updateProfile = authContext.updateProfile || (() => {});

  const socket = useContext(SocketContext);

  const themeContext = useContext(ThemeContext) || { isDark: true, toggleTheme: () => {} };
  const isDark = themeContext.isDark;
  const toggleTheme = themeContext.toggleTheme;

  const [rooms, setRooms] = useState(defaultRooms);
  const [friends, setFriends] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineMaleCount, setOnlineMaleCount] = useState(0);
  const [onlineFemaleCount, setOnlineFemaleCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHostel, setEditHostel] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search & Category Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchData = async () => {
    try {
      // Fetch online count
      try {
        const countRes = await axios.get(`${API_URL}/api/users/online-count`, { timeout: 5000 });
        if (countRes.data) {
          setOnlineCount(countRes.data.count || 0);
          setOnlineMaleCount(countRes.data.maleCount || 0);
          setOnlineFemaleCount(countRes.data.femaleCount || 0);
        }
      } catch (err) {
        console.log('Online count fetch fallback');
      }

      // Fetch active rooms
      try {
        const roomsRes = await axios.get(`${API_URL}/api/rooms`, { timeout: 5000 });
        if (roomsRes.data && roomsRes.data.length > 0) {
          setRooms(roomsRes.data);
        } else {
          setRooms(defaultRooms);
        }
      } catch (err) {
        setRooms(defaultRooms);
      }

      // Fetch friends if user logged in
      if (user && user._id) {
        try {
          const friendsRes = await axios.get(`${API_URL}/api/users/${user._id}/friends`, { timeout: 5000 });
          setFriends(friendsRes.data?.friends || []);
        } catch (err) {
          console.log('Error fetching friends list');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

      socket.on('online-count-updated', (data) => {
        if (data) {
          setOnlineCount(data.count || 0);
          setOnlineMaleCount(data.maleCount || 0);
          setOnlineFemaleCount(data.femaleCount || 0);
        }
      });

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
        socket.off('online-count-updated');
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

  const safeRooms = Array.isArray(rooms) && rooms.length > 0 ? rooms : defaultRooms;
  const displayRooms = safeRooms.filter(room => {
    if (!room || !room.name) return false;
    const matchesSearch = room.name.toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (room.description && room.description.toLowerCase().includes((searchQuery || '').toLowerCase()));
    
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && (room.category === activeCategory);
  });

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="top-navbar glass-panel">
        <div className="navbar-left flex-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <div className="flex-center" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/favicon.svg.jpeg" alt="HostelAdda Logo" style={{ width: '26px', height: '26px', objectFit: 'cover', borderRadius: '4px' }} />
            <span className="heading-md" style={{ marginLeft: '0.5rem' }}>HostelAdda</span>
          </div>
          <div className="online-badge">
            <div className="online-indicator-dot"></div>
            {onlineFemaleCount > 0 
              ? `${onlineCount} Online (👨 ${onlineMaleCount} 👩 ${onlineFemaleCount})`
              : `${onlineCount} Online (👨 ${onlineMaleCount})`}
          </div>
        </div>
        
        <div className="navbar-right flex-center">
          <div className="desktop-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              <Home size={16} /> Home
            </button>

            <button className="btn btn-secondary" onClick={() => navigate('/about')}>
              <FileText size={16} /> About Us
            </button>

            {user ? (
              <button className="btn btn-primary" onClick={() => navigate('/profile')}>
                <User size={16} /> {user?.name || 'Profile'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate('/auth')}>
                <User size={16} /> Profile
              </button>
            )}

            <button className="icon-btn theme-toggle" onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <button className="icon-btn mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <MoreVertical size={24} color="var(--text-primary)" />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-dropdown glass-card" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 className="heading-md" style={{ margin: 0 }}>Menu</h3>
              <button className="icon-btn" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            {user ? (
              <div className="profile-section mb-4">
                <div className="flex-between">
                  <div>
                    <p className="text-body" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{user.name}</p>
                    <p className="text-small text-muted">{user.hostelBlock}</p>
                  </div>
                  <button className="icon-btn" onClick={() => { setIsMobileMenuOpen(false); openEditProfile(); }} title="Edit Profile">
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <button className="btn btn-primary w-100" onClick={() => navigate('/auth')}>
                  <LogIn size={18} /> Sign In with Google
                </button>
              </div>
            )}

            <div className="menu-actions mt-auto">
              {user ? (
                <button className="btn btn-secondary logout-btn w-100" onClick={logout}>
                  <LogOut size={18} /> Logout
                </button>
              ) : (
                <button className="btn btn-secondary w-100" onClick={() => navigate('/')}>
                  <Home size={18} /> Home Page
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
              {user ? `Welcome back, ${user?.name || 'Student'}` : 'Chitkara Hostel Rooms'}
            </h2>
            <p className="text-body">
              {user ? `Connected to ${user?.hostelBlock || 'Hostel'} Community` : 'Explore rooms or sign in for 1-click peer matching.'}
            </p>
          </div>
          {!user && (
            <button className="btn btn-primary" onClick={() => navigate('/auth')}>
              <LogIn size={18} /> Sign In
            </button>
          )}
        </header>

        {/* Random Match Banner */}
        <div className="random-match-banner flex-between">
          <div className="banner-content flex-center" style={{ justifyContent: 'flex-start', gap: '1.5rem' }}>
            <div className="banner-icon flex-center">
              <Users size={32} color="#ea580c" />
            </div>
            <div>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <h3 className="heading-md" style={{ margin: 0 }}>HostelAdda Random Match</h3>
                <span className="badge badge-purple">Instant 1-on-1</span>
              </div>
              <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
                Get matched with another Chitkara student instantly.<br />
                Peer text and video chat enabled.
              </p>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleRandomMatch}
            disabled={isSearching}
            style={{ padding: '0.85rem 1.75rem', fontWeight: '600' }}
          >
            {isSearching ? 'Searching Match...' : <><Shuffle size={18} /> Start Matching</>}
          </button>
        </div>

        {/* Search Bar & Category Filter Bar */}
        <div className="rooms-section-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="heading-md">Available Rooms</h3>
            <p className="text-small">Select a room to enter text and video discussion</p>
          </div>

          <div className="search-box-wrapper">
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search room name or block..."
              className="input-field search-box-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="category-filter-bar">
          <button 
            className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Rooms
          </button>
          <button 
            className={`filter-chip ${activeCategory === 'boys' ? 'active' : ''}`}
            onClick={() => setActiveCategory('boys')}
          >
            Boys Hostels
          </button>
          <button 
            className={`filter-chip ${activeCategory === 'girls' ? 'active' : ''}`}
            onClick={() => setActiveCategory('girls')}
          >
            Girls Hostels
          </button>
          <button 
            className={`filter-chip ${activeCategory === 'gaming' ? 'active' : ''}`}
            onClick={() => setActiveCategory('gaming')}
          >
            Gaming & Esports
          </button>
          <button 
            className={`filter-chip ${activeCategory === 'study' ? 'active' : ''}`}
            onClick={() => setActiveCategory('study')}
          >
            Study & Code
          </button>
        </div>

        <div className="rooms-grid">
          {displayRooms.length > 0 ? (
            displayRooms.map(room => (
              <div key={room._id} className="glass-card room-card">
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
            ))
          ) : (
            <div className="glass-card text-center" style={{ gridColumn: '1 / -1', padding: '3rem 1.5rem' }}>
              <p className="text-body text-muted">No rooms match your search query or selected category.</p>
              <button 
                className="btn btn-secondary mt-4"
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

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
