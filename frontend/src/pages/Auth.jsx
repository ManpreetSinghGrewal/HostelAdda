// Chitmeet Authentication Component - Pure Google SSO
import React, { useState, useContext } from 'react';
import { User, Building, Sun, Moon, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import './Auth.css';

const Auth = () => {
  // Google New User Setup State
  const [googleSetupState, setGoogleSetupState] = useState(null);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const maleHostels = ['FRANKLIN-A', 'FRANKLIN-B', 'ARCHIMEDIES-A', 'ARCHIMEDIES-B', 'ARMSTRONG', 'MAGELLAN', 'MARCOPOLO'];
  const femaleHostels = ['NGH-A', 'NGH-B', 'VASCO', 'COLUMBUS', 'IBN-A', 'IBN-B', 'IBN-C', 'PIE-A', 'PIE-B', 'PIE-C'];

  const { googleAuth } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

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
          hostelBlock: ''
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

  // Submit First-Time Profile Setup (Gender & Hostel Block)
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
        googleSetupState.hostelBlock
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
            {googleSetupState ? 'Complete Profile' : 'Welcome to HostelAdda'}
          </h2>
          <p className="text-body">
            {googleSetupState
              ? 'Select your Gender & Hostel Block to complete setup'
              : 'Official Chitkara University Student Portal'}
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

            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={isLoading}>
              {isLoading ? 'Completing Setup...' : 'Enter HostelAdda'}
            </button>
          </form>
        ) : (
          /* PURE 1-CLICK GOOGLE SSO VIEW */
          <div className="google-sso-wrapper" style={{ padding: '1rem 0' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
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

            <div style={{ fontSize: '0.8rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} /> Official @chitkara.edu.in accounts only
            </div>

            <div style={{ marginTop: '1.5rem', padding: '0.85rem', background: 'rgba(99, 102, 241, 0.06)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: '1.4' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary, #f8fafc)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} style={{ color: '#10b981' }} /> Instant & Verified Access
              </div>
              Sign in with your Chitkara University Google account for 1-click verified access to hostel rooms and peer chat.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
