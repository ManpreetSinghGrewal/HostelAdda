import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Building, ShieldCheck, Edit2, LogOut, LayoutGrid, CheckCircle2, X, Sparkles, Sun, Moon, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Navbar from '../components/Navbar';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editHostel, setEditHostel] = useState(user?.hostelBlock || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

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

            <button className="btn btn-secondary" onClick={() => setIsEditOpen(true)}>
              <Edit2 size={16} /> Edit Profile
            </button>
          </div>
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
