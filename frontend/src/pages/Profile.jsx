import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, KeyRound, Save, LogOut, CheckCircle2, Image as ImageIcon, Camera, Building2, Mail, Sparkles, Sun, Moon, Edit3, Lock, AlertCircle } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import './Profile.css';

const avatarPresets = [
  { id: 'avatar-1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ChitkaraDev', label: 'Tech Bot' },
  { id: 'avatar-2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FranklinHero', label: 'Franklin Scholar' },
  { id: 'avatar-3', url: 'https://api.dicebear.com/7.x/micah/svg?seed=ArchimedesCoder', label: 'Archimedes Coder' },
  { id: 'avatar-4', url: 'https://api.dicebear.com/7.x/persona/svg?seed=NGHStar', label: 'NGH Star' },
  { id: 'avatar-5', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=GamingHostel', label: 'Esports Gamer' },
  { id: 'avatar-6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VascoLead', label: 'Campus Leader' }
];

const Profile = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user, logout, updateProfile } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [hostelBlock, setHostelBlock] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setName(user.name || '');
    setHostelBlock(user.hostelBlock || '');
    setBio(user.bio || 'Chitkara Student');
    setSelectedAvatar(user.avatarUrl || avatarPresets[0].url);
  }, [user, navigate]);

  if (!user) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword && newPassword.length < 5) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 5 characters long.' });
      return;
    }

    setIsSubmitting(true);
    const finalAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : selectedAvatar;

    const res = await updateProfile({
      name,
      hostelBlock,
      bio,
      avatarUrl: finalAvatar,
      newPassword: newPassword.trim() ? newPassword : undefined
    });

    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message || 'Profile updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Failed to update profile.' });
    }
  };

  return (
    <div className="profile-container">
      {/* Top Navbar */}
      <header className="glass-panel navbar flex-between">
        <div className="logo flex-center" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/favicon.svg.jpeg" alt="HostelAdda Logo" className="navbar-logo-img" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
          <span className="heading-md brand-name" style={{ marginLeft: '0.5rem' }}>HostelAdda</span>
          <span className="brand-badge" style={{ background: 'rgba(234,88,12,0.15)', color: '#ea580c', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, marginLeft: '0.5rem' }}>CHITKARA</span>
        </div>

        <nav className="nav-links">
          <button className="nav-link-btn" onClick={() => navigate('/')}>Home</button>
          <button className="nav-link-btn" onClick={() => navigate('/about')}>About Us</button>
          <button className="nav-link-btn active" onClick={() => navigate('/profile')}>Profile</button>
        </nav>

        <div className="nav-actions flex-center">
          <button className="icon-btn theme-toggle" onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button className="btn btn-secondary nav-btn-compact flex-center" onClick={() => navigate('/dashboard')} style={{ gap: '0.4rem' }}>
            <Home size={15} /> Dashboard
          </button>
        </div>
      </header>

      <main className="profile-main">
        {/* Profile Header Card */}
        <div className="glass-panel profile-header-card flex-between">
          <div className="flex-center" style={{ gap: '1.5rem', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <div className="avatar-wrapper">
              <img 
                src={selectedAvatar || avatarPresets[0].url} 
                alt="Profile Avatar" 
                className="profile-avatar-img" 
                onError={(e) => { e.target.src = avatarPresets[0].url; }}
              />
              <span className="verified-icon-badge" title="Verified Chitkara Student">
                <ShieldCheck size={16} color="#ffffff" />
              </span>
            </div>

            <div>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem' }}>
                <h1 className="heading-lg" style={{ margin: 0 }}>{user.name}</h1>
                <span className="badge badge-purple">{user.gender || 'Student'}</span>
              </div>
              <p className="text-small text-muted flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginTop: '0.35rem' }}>
                <Mail size={14} color="#ea580c" /> {user.email}
              </p>
              <p className="text-small flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginTop: '0.2rem', color: '#10b981', fontWeight: 500 }}>
                <Building2 size={14} /> Hostel: {user.hostelBlock || 'Chitkara Hostel'}
              </p>
            </div>
          </div>

          <button className="btn btn-secondary logout-btn-profile" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="profile-form-grid mt-8">
          {statusMessage && (
            <div className={`status-banner ${statusMessage.type} flex-between`} style={{ gridColumn: '1 / -1' }}>
              <div className="flex-center" style={{ gap: '0.5rem' }}>
                {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{statusMessage.text}</span>
              </div>
            </div>
          )}

          {/* Avatar / PFP Customization */}
          <div className="glass-card form-section-card" style={{ gridColumn: '1 / -1' }}>
            <h3 className="heading-md flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
              <Camera size={20} color="#ea580c" /> Choose Profile Avatar (PFP)
            </h3>
            
            <div className="avatar-preset-grid">
              {avatarPresets.map((preset) => (
                <div 
                  key={preset.id} 
                  className={`preset-item ${selectedAvatar === preset.url ? 'selected' : ''}`}
                  onClick={() => { setSelectedAvatar(preset.url); setCustomAvatarUrl(''); }}
                >
                  <img src={preset.url} alt={preset.label} className="preset-img" />
                  <span className="text-small mt-2">{preset.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-small text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Or enter custom image URL</label>
              <input 
                type="url" 
                className="input-field w-100" 
                placeholder="https://example.com/my-photo.png"
                value={customAvatarUrl}
                onChange={(e) => {
                  setCustomAvatarUrl(e.target.value);
                  if (e.target.value.trim()) setSelectedAvatar(e.target.value.trim());
                }}
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="glass-card form-section-card">
            <h3 className="heading-md flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
              <User size={20} color="#ea580c" /> Student Profile Details
            </h3>

            <div className="form-group mb-4">
              <label className="text-small text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Display Name</label>
              <input 
                type="text" 
                className="input-field w-100" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-4">
              <label className="text-small text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Hostel Block & Room</label>
              <input 
                type="text" 
                className="input-field w-100" 
                placeholder="e.g. FRANKLIN-A, NGH-B"
                value={hostelBlock}
                onChange={(e) => setHostelBlock(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="text-small text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Tagline / Bio</label>
              <textarea 
                className="input-field w-100" 
                rows="3"
                placeholder="e.g. 2nd Year CSE | WebDev & Gaming"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>

          {/* Security & Password Settings */}
          <div className="glass-card form-section-card">
            <h3 className="heading-md flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
              <KeyRound size={20} color="#ea580c" /> Security & Login Password
            </h3>
            <p className="text-small text-muted mb-4">
              Set or update your password to enable direct login next time alongside Google SSO.
            </p>

            <div className="form-group mb-4">
              <label className="text-small text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
              <input 
                type="password" 
                className="input-field w-100" 
                placeholder="Leave blank to keep current password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="text-small text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm New Password</label>
              <input 
                type="password" 
                className="input-field w-100" 
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : <><Save size={18} /> Save Profile Changes</>}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Profile;
