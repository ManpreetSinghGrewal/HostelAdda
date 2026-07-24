// Chitmeet Authentication Component
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Building, Sun, Moon, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import './Auth.css';

const Auth = () => {
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  
  // Google New User Setup State
  const [googleSetupState, setGoogleSetupState] = useState(null);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const maleHostels = ['FRANKLIN-A', 'FRANKLIN-B', 'ARCHIMEDIES-A', 'ARCHIMEDIES-B', 'ARMSTRONG', 'MAGELLAN', 'MARCOPOLO'];
  const femaleHostels = ['NGH-A', 'NGH-B', 'VASCO', 'COLUMBUS', 'IBN-A', 'IBN-B', 'IBN-C', 'PIE-A', 'PIE-B', 'PIE-C'];

  const { login, googleAuth } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle 1-Click Google OAuth Success
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await googleAuth(credentialResponse.credential);
      if (res.requiresProfileDetails) {
        setGoogleSetupState({
          credential: credentialResponse.credential,
          email: res.email,
          name: res.name,
          picture: res.picture,
          gender: '',
          hostelBlock: '',
          password: ''
        });
      } else if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Google Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit First-Time Profile Setup (Gender, Hostel Block, Optional Password)
  const handleCompleteSetup = async (e) => {
    e.preventDefault();
    if (!googleSetupState.gender) {
      setError('Please select your gender.');
      return;
    }
    if (!googleSetupState.hostelBlock) {
      setError('Please select your hostel block.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await googleAuth(
        googleSetupState.credential,
        googleSetupState.gender,
        googleSetupState.hostelBlock,
        googleSetupState.password
      );
      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Profile setup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Login Submit Handler
  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(formData.email, formData.password);
      if (!res.success) setError(res.message);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container flex-center">
      <button
        className="icon-btn theme-toggle"
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
        onClick={toggleTheme}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="glass-panel auth-card">
        <div className="auth-header text-center">
          <h2 className="heading-lg">
            {googleSetupState
              ? 'Complete Setup'
              : showPasswordLogin
              ? 'Login with Password'
              : 'Join HostelAdda'}
          </h2>
          <p className="text-body">
            {googleSetupState
              ? 'Set your Hostel, Gender, and Password for next time'
              : showPasswordLogin
              ? 'Enter your Chitkara email & password'
              : '1-Click Login with your Chitkara Google Account'}
          </p>
        </div>

        {error && (
          <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* GOOGLE NEW USER SETUP FORM */}
        {googleSetupState ? (
          <form onSubmit={handleCompleteSetup} className="auth-form">
            <div className="google-profile-card">
              {googleSetupState.picture ? (
                <img src={googleSetupState.picture} alt="Profile" className="google-avatar" />
              ) : (
                <User size={32} className="google-avatar" />
              )}
              <div>
                <div className="google-user-name">{googleSetupState.name}</div>
                <div className="google-user-email">{googleSetupState.email}</div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Gender</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <select
                  name="gender"
                  className="input-field"
                  value={googleSetupState.gender}
                  onChange={(e) => setGoogleSetupState({ ...googleSetupState, gender: e.target.value, hostelBlock: '' })}
                  required
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Hostel Name & Block</label>
              <div className="input-with-icon">
                <Building size={18} className="input-icon" />
                {googleSetupState.gender ? (
                  <select
                    name="hostelBlock"
                    className="input-field"
                    value={googleSetupState.hostelBlock}
                    onChange={(e) => setGoogleSetupState({ ...googleSetupState, hostelBlock: e.target.value })}
                    required
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    <option value="" disabled>Select Hostel</option>
                    {(googleSetupState.gender === 'Male' ? maleHostels : googleSetupState.gender === 'Female' ? femaleHostels : [...maleHostels, ...femaleHostels]).map((hostel) => (
                      <option key={hostel} value={hostel}>
                        {hostel}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Select Gender First"
                    disabled
                    style={{ opacity: 0.7 }}
                  />
                )}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Set Password for Next Time (Optional)</label>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon" />
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  placeholder="Create a password (Optional)"
                  value={googleSetupState.password}
                  onChange={(e) => setGoogleSetupState({ ...googleSetupState, password: e.target.value })}
                />
              </div>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Optional: Allows logging in directly using email & password next time.
              </small>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={isLoading}>
              {isLoading ? 'Completing Setup...' : 'Complete Setup & Enter HostelAdda'}
            </button>
          </form>
        ) : showPasswordLogin ? (
          /* TRADITIONAL PASSWORD LOGIN FORM */
          <form onSubmit={handlePasswordLoginSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">University Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  placeholder="student@chitkara.edu.in"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          /* PURE 1-CLICK GOOGLE SSO VIEW (DEFAULT) */
          <div className="google-sso-wrapper" style={{ padding: '1rem 0' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In was cancelled or failed.')}
                shape="pill"
                size="large"
                width="340"
                theme={isDark ? 'filled_black' : 'outline'}
                text="continue_with"
                logo_alignment="left"
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
              <ShieldCheck size={16} /> Official @chitkara.edu.in accounts only
            </div>
          </div>
        )}

        <div className="auth-footer text-center">
          {!googleSetupState && (
            <p className="text-small">
              {showPasswordLogin ? (
                <span className="auth-link" onClick={() => { setShowPasswordLogin(false); setError(''); }}>
                  <ArrowRight size={12} style={{ display: 'inline', transform: 'rotate(180deg)' }} /> Back to 1-Click Google Sign-In
                </span>
              ) : (
                <span className="auth-link" onClick={() => { setShowPasswordLogin(true); setError(''); }}>
                  Log in with Email & Password
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
