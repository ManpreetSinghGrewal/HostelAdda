import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Building, ShieldCheck, Edit2, LogOut, CheckCircle2, X, Sun, Moon, ArrowLeft, UserPlus, Check, MessageSquare, Users, UserCheck } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Navbar from '../components/Navbar';
import './Profile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editHostel, setEditHostel] = useState(user?.hostelBlock || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  // Friends & Requests State
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [addFriendEmail, setAddFriendEmail] = useState('');
  const [friendActionMsg, setFriendActionMsg] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  // Fetch Friends and Requests
  const fetchFriendsData = async () => {
    if (!user || !user._id) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/users/${user._id}/friends`, { timeout: 6000 });
      setFriends(data.friends || []);
      setFriendRequests(data.friendRequests || []);
    } catch (err) {
      console.log('Error loading friends data:', err);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, [user]);

  if (!user) {
    return (
      <div className="profile-page-container">
        <Navbar />
        <div className="profile-main-content text-center py-5">
          <div className="glass-panel profile-card p-5" style={{ maxWidth: '440px', margin: '3rem auto' }}>
            <User size={48} color="#ea580c" className="mb-3" />
            <h2 className="heading-md mb-2">Sign In Required</h2>
            <p className="text-body mb-4">Please sign in with your Chitkara Google account to view your student profile.</p>
            <button className="btn btn-primary w-100" onClick={() => navigate('/auth')}>
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMsg('');

    try {
      const res = await updateProfile(editName, editHostel);
      if (res.success) {
        setUpdateMsg('Profile updated successfully!');
        setIsEditOpen(false);
      } else {
        setUpdateMsg(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setUpdateMsg('An error occurred during update.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Send Friend Request by Email
  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    if (!addFriendEmail.trim()) return;

    setIsSendingRequest(true);
    setFriendActionMsg('');

    try {
      const { data } = await axios.post(`${API_URL}/api/users/friend-request`, {
        fromUserId: user._id,
        toEmail: addFriendEmail.trim()
      });
      setFriendActionMsg(data.message || 'Friend request sent!');
      setAddFriendEmail('');
      setIsAddFriendOpen(false);
      fetchFriendsData();
    } catch (err) {
      setFriendActionMsg(err.response?.data?.message || 'Failed to send friend request.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = async (fromUserId) => {
    try {
      await axios.post(`${API_URL}/api/users/friend-request/accept`, {
        userId: user._id,
        fromUserId
      });
      setFriendActionMsg('Friend request accepted!');
      fetchFriendsData();
    } catch (err) {
      setFriendActionMsg('Failed to accept request.');
    }
  };

  // Decline Friend Request
  const handleDeclineRequest = async (fromUserId) => {
    try {
      await axios.post(`${API_URL}/api/users/friend-request/decline`, {
        userId: user._id,
        fromUserId
      });
      setFriendActionMsg('Friend request declined.');
      fetchFriendsData();
    } catch (err) {
      setFriendActionMsg('Failed to decline request.');
    }
  };

  return (
    <div className="profile-page-container">
      <Navbar />

      <main className="profile-main-content">
        <div className="back-link mb-3" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </div>

        {updateMsg && (
          <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {updateMsg}
          </div>
        )}

        {friendActionMsg && (
          <div style={{ color: '#ea580c', background: 'rgba(234, 88, 12, 0.1)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {friendActionMsg}
          </div>
        )}

        {/* STUDENT ID CARD */}
        <div className="glass-panel profile-id-card mb-4">
          <div className="profile-header flex-between">
            <div className="flex-center" style={{ gap: '1.25rem' }}>
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="profile-photo-lg" />
              ) : (
                <div className="profile-avatar-large flex-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.6rem' }}>
                  <h1 className="heading-lg" style={{ margin: 0 }}>{user.name}</h1>
                  <span className="profile-verified-badge">
                    <ShieldCheck size={14} /> Verified Student
                  </span>
                </div>
                <p className="text-body text-muted mt-1">{user.email}</p>
                <div className="profile-hostel-tag mt-2">
                  <Building size={14} /> {user.hostelBlock || 'Chitkara Hostel Resident'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => setIsAddFriendOpen(true)}>
                <UserPlus size={16} /> Add Friend
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditOpen(true)}>
                <Edit2 size={16} /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* PENDING FRIEND REQUESTS NOTIFICATION BANNER */}
        {friendRequests.length > 0 && (
          <div className="glass-panel requests-banner mb-4 p-4" style={{ borderLeft: '4px solid #ea580c' }}>
            <h3 className="heading-md mb-3 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
              <UserCheck size={20} color="#ea580c" /> Pending Friend Requests ({friendRequests.length})
            </h3>
            <div className="requests-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {friendRequests.map((reqUser) => (
                <div key={reqUser._id} className="request-card flex-between p-3 glass-card">
                  <div className="flex-center" style={{ gap: '0.75rem' }}>
                    {reqUser.picture ? (
                      <img src={reqUser.picture} alt={reqUser.name} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    ) : (
                      <div className="user-avatar-placeholder" style={{ width: 36, height: 36 }}>
                        {reqUser.name ? reqUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{reqUser.name}</div>
                      <div className="text-small text-muted">{reqUser.hostelBlock || 'Chitkara Student'} • {reqUser.email}</div>
                    </div>
                  </div>
                  <div className="flex-center" style={{ gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }} onClick={() => handleAcceptRequest(reqUser._id)}>
                      <Check size={16} /> Accept
                    </button>
                    <button className="btn btn-secondary text-danger" style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }} onClick={() => handleDeclineRequest(reqUser._id)}>
                      <X size={16} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FRIENDS & CONNECTIONS SECTION */}
        <div className="glass-panel friends-section mb-4 p-4">
          <div className="flex-between mb-4">
            <div>
              <h3 className="heading-md flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                <Users size={22} color="#ea580c" /> Friends & Connections ({friends.length})
              </h3>
              <p className="text-small text-muted">Your verified Chitkara hostel peers</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setIsAddFriendOpen(true)}>
              <UserPlus size={16} /> Find Peer by Email
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="text-center py-4 glass-card" style={{ padding: '2.5rem 1rem' }}>
              <Users size={40} color="#94a3b8" className="mb-2" />
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>You don't have any friends added yet.</p>
              <p className="text-small text-muted mb-3">Add peers by email or meet them in Chitkara chat rooms.</p>
              <button className="btn btn-primary" onClick={() => setIsAddFriendOpen(true)}>
                <UserPlus size={16} /> Add Your First Friend
              </button>
            </div>
          ) : (
            <div className="friends-grid">
              {friends.map((friend) => (
                <div key={friend._id} className="glass-card friend-card p-3 flex-between">
                  <div className="flex-center" style={{ gap: '0.85rem' }}>
                    {friend.picture ? (
                      <img src={friend.picture} alt={friend.name} className="friend-avatar" />
                    ) : (
                      <div className="user-avatar-placeholder" style={{ width: 42, height: 42 }}>
                        {friend.name ? friend.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{friend.name}</span>
                        <span className={`status-indicator-dot ${friend.isOnline ? 'online' : 'offline'}`} title={friend.isOnline ? 'Online' : 'Offline'} />
                      </div>
                      <div className="text-small text-muted">{friend.hostelBlock || 'Hostel Resident'}</div>
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard')}>
                    <MessageSquare size={14} /> Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS & STATS GRID */}
        <div className="profile-grid">
          <div className="glass-card profile-info-box">
            <h3 className="heading-md mb-3">Student Details</h3>

            <div className="info-row">
              <span className="info-label"><User size={16} /> Full Name</span>
              <span className="info-value">{user.name}</span>
            </div>

            <div className="info-row">
              <span className="info-label"><Mail size={16} /> University Email</span>
              <span className="info-value">{user.email}</span>
            </div>

            <div className="info-row">
              <span className="info-label"><Building size={16} /> Hostel Block</span>
              <span className="info-value">{user.hostelBlock || 'Unspecified'}</span>
            </div>

            <div className="info-row">
              <span className="info-label"><User size={16} /> Gender</span>
              <span className="info-value">{user.gender || 'Not specified'}</span>
            </div>
          </div>

          <div className="glass-card profile-info-box">
            <h3 className="heading-md mb-3">Security & Actions</h3>

            <div className="security-item mb-3">
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.6rem' }}>
                <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                <span className="text-body" style={{ fontWeight: '600' }}>Google Workspace Verified</span>
              </div>
              <p className="text-small text-muted mt-1">
                Your account is authenticated via Chitkara University SSO.
              </p>
            </div>

            <div className="profile-action-buttons">
              <button className="btn btn-secondary w-100 mb-2" onClick={toggleTheme}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                <span className="ms-2">Switch Theme ({isDark ? 'Dark' : 'Light'})</span>
              </button>

              <button className="btn btn-secondary text-danger w-100" onClick={logout}>
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* ADD FRIEND MODAL */}
        {isAddFriendOpen && (
          <div className="modal-overlay flex-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000 }}>
            <div className="glass-panel profile-edit-modal p-4" style={{ width: '420px', position: 'relative' }}>
              <button className="icon-btn" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setIsAddFriendOpen(false)}>
                <X size={20} />
              </button>
              <h2 className="heading-md mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                <UserPlus size={20} color="#ea580c" /> Add Friend by Email
              </h2>
              <p className="text-small text-muted mb-4">Enter your peer's official @chitkara.edu.in email address.</p>

              <form onSubmit={handleSendFriendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="text-small text-muted mb-1" style={{ display: 'block' }}>Student Email</label>
                  <input
                    type="email"
                    className="input-field w-100"
                    placeholder="student@chitkara.edu.in"
                    value={addFriendEmail}
                    onChange={(e) => setAddFriendEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 mt-2" disabled={isSendingRequest}>
                  {isSendingRequest ? 'Sending Request...' : 'Send Friend Request'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* EDIT PROFILE MODAL */}
        {isEditOpen && (
          <div className="modal-overlay flex-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000 }}>
            <div className="glass-panel profile-edit-modal p-4" style={{ width: '420px', position: 'relative' }}>
              <button className="icon-btn" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setIsEditOpen(false)}>
                <X size={20} />
              </button>
              <h2 className="heading-md mb-3">Edit Profile</h2>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="text-small text-muted mb-1" style={{ display: 'block' }}>Display Name</label>
                  <input
                    type="text"
                    className="input-field w-100"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-small text-muted mb-1" style={{ display: 'block' }}>Hostel Block</label>
                  <input
                    type="text"
                    className="input-field w-100"
                    value={editHostel}
                    onChange={(e) => setEditHostel(e.target.value)}
                    required
                    placeholder="e.g. FRANKLIN-A, NGH-B"
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 mt-3" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
