import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Home, LayoutGrid, Info, User, LogOut, LogIn, Sun, Moon, Menu, X, ShieldCheck, ChevronDown } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import { ThemeContext } from '../contexts/ThemeContext';
import './Navbar.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [onlineCount, setOnlineCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Fetch online count
  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/online-count`, { timeout: 4000 });
        if (res.data && res.data.count !== undefined) {
          setOnlineCount(res.data.count);
        }
      } catch (err) {
        // Silent fallback
      }
    };

    fetchOnlineCount();

    if (socket) {
      socket.on('online-count-updated', (data) => {
        if (data && data.count !== undefined) {
          setOnlineCount(data.count);
        }
      });
      return () => socket.off('online-count-updated');
    }
  }, [socket]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel main-navbar">
      <div className="navbar-container">
        {/* Brand Logo & Name */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <img src="/favicon.svg.jpeg" alt="HostelAdda Logo" className="navbar-logo-img" />
          <span className="navbar-title">HostelAdda</span>
          <span className="navbar-badge">CHITKARA</span>
        </div>

        {/* Live Online Badge */}
        <div className="navbar-online-pill">
          <span className="online-pulse-dot" />
          <span>{onlineCount > 0 ? `${onlineCount} Live` : 'Live Portal'}</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="navbar-links-desktop">
          <button
            className={`nav-link-btn ${isActive('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <Home size={17} /> Home
          </button>

          <button
            className={`nav-link-btn ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <LayoutGrid size={17} /> Explore Rooms
          </button>

          <button
            className={`nav-link-btn ${isActive('/about') ? 'active' : ''}`}
            onClick={() => navigate('/about')}
          >
            <Info size={17} /> About Us
          </button>
        </div>

        {/* Right Actions (Theme, User / Auth) */}
        <div className="navbar-actions-desktop">
          <button
            className="icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {user ? (
            <div className="user-menu-wrapper">
              <button
                className="user-profile-trigger"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              >
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="user-avatar-img" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="user-display-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>

              {isUserDropdownOpen && (
                <div className="user-dropdown-card glass-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user.name}</div>
                    <div className="user-dropdown-email">{user.email}</div>
                    <div className="user-dropdown-hostel">{user.hostelBlock || 'Chitkara Student'}</div>
                  </div>

                  <div className="user-dropdown-divider" />

                  <button
                    className="user-dropdown-item"
                    onClick={() => { setIsUserDropdownOpen(false); navigate('/profile'); }}
                  >
                    <User size={16} /> My Profile
                  </button>

                  <button
                    className="user-dropdown-item danger"
                    onClick={() => { setIsUserDropdownOpen(false); logout(); }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary nav-signin-btn" onClick={() => navigate('/auth')}>
              <LogIn size={17} /> Sign In
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="icon-btn navbar-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-drawer-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header flex-between mb-3">
              <div className="flex-center">
                <img src="/favicon.svg.jpeg" alt="Logo" className="navbar-logo-img" />
                <span className="navbar-title ms-2">HostelAdda</span>
              </div>
              <button className="icon-btn" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="mobile-user-card mb-3">
                <div className="user-display-name">{user.name}</div>
                <div className="user-dropdown-email">{user.email}</div>
                <div className="user-dropdown-hostel mt-1">{user.hostelBlock}</div>
              </div>
            )}

            <div className="mobile-nav-list">
              <button
                className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
                onClick={() => { setIsMobileMenuOpen(false); navigate('/'); }}
              >
                <Home size={18} /> Home
              </button>

              <button
                className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
              >
                <LayoutGrid size={18} /> Explore Rooms
              </button>

              <button
                className={`mobile-nav-item ${isActive('/about') ? 'active' : ''}`}
                onClick={() => { setIsMobileMenuOpen(false); navigate('/about'); }}
              >
                <Info size={18} /> About Us
              </button>

              {user ? (
                <button
                  className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}
                >
                  <User size={18} /> My Profile
                </button>
              ) : (
                <button
                  className="btn btn-primary w-100 mt-2"
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/auth'); }}
                >
                  <LogIn size={18} /> Sign In
                </button>
              )}
            </div>

            <div className="mobile-drawer-footer mt-auto pt-3 flex-between">
              <button className="icon-btn theme-toggle-btn" onClick={toggleTheme}>
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                <span className="ms-2 text-small">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {user && (
                <button className="btn btn-secondary text-danger" onClick={() => { setIsMobileMenuOpen(false); logout(); }}>
                  <LogOut size={16} /> Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
