import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Building, Sun, Moon, ShieldCheck, CheckCircle2, FileText, LogIn, UserPlus, KeyRound, ArrowLeft, Send } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import TermsModal from '../components/TermsModal';
import './Auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const { user, googleAuth, emailLogin, sendOTP, verifyOTP } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  // Mode: 'login' or 'signup'
  const [authMode, setAuthMode] = useState('login');

  // OTP Verification Step State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupGender, setSignupGender] = useState('Male');
  const [signupHostel, setSignupHostel] = useState('FRANKLIN-A');

  // Google Setup State for first-time Google users
  const [googleSetupState, setGoogleSetupState] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const [error, setError] = useState('');
  const [userAlreadyExists, setUserAlreadyExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const maleHostels = ['FRANKLIN-A', 'FRANKLIN-B', 'ARCHIMEDIES-A', 'ARCHIMEDIES-B', 'ARMSTRONG', 'MAGELLAN', 'MARCOPOLO'];
  const femaleHostels = ['NGH-A', 'NGH-B', 'VASCO', 'COLUMBUS', 'IBN-A', 'IBN-B', 'IBN-C', 'PIE-A', 'PIE-B', 'PIE-C'];

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Email + Password Sign In
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUserAlreadyExists(false);
    setIsLoading(true);

    try {
      const res = await emailLogin(loginEmail, loginPassword);
      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send OTP to Email via Brevo API
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setUserAlreadyExists(false);
    setIsLoading(true);

    try {
      const res = await sendOTP(signupEmail);
      if (res.success) {
        setOtpSentMsg(res.message || '6-digit OTP code sent via Brevo!');
        setIsOtpStep(true);
        setResendCooldown(60);
      } else {
        setError(res.message);
        if (res.message && res.message.toLowerCase().includes('already exists')) {
          setUserAlreadyExists(true);
          setLoginEmail(signupEmail);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Register User
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await verifyOTP(
        signupEmail,
        otpCode.trim(),
        signupName,
        signupPassword,
        signupGender,
        signupHostel
      );

      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await sendOTP(signupEmail);
      if (res.success) {
        setOtpSentMsg('New 6-digit OTP code sent via Brevo!');
        setResendCooldown(60);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 1-Click Google OAuth Success
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setUserAlreadyExists(false);
    setIsLoading(true);

    try {
      const res = await googleAuth(credentialResponse.credential);
      if (res.requiresProfileDetails) {
        setGoogleSetupState({
          credential: credentialResponse.credential,
          email: res.email,
          name: res.name,
          picture: res.picture,
          gender: 'Male',
          hostelBlock: 'FRANKLIN-A'
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

  // Submit First-Time Profile Setup for Google User
  const handleCompleteGoogleSetup = async (e) => {
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

  const switchMode = (mode) => {
    setAuthMode(mode);
    setIsOtpStep(false);
    setError('');
    setUserAlreadyExists(false);
  };

  return (
    <div className="auth-container flex-center">
      {/* Terms & Community Guidelines Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setShowTermsModal(false)}
      />

      <button
        className="icon-btn theme-toggle"
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
        onClick={toggleTheme}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="glass-panel auth-card">
        {/* Header */}
        <div className="auth-header text-center">
          <h2 className="heading-lg">
            {googleSetupState 
              ? 'Complete Profile' 
              : isOtpStep
                ? 'Verify Email OTP'
                : authMode === 'login' 
                  ? 'Welcome Back to HostelAdda' 
                  : 'Join HostelAdda'}
          </h2>
          <p className="text-body">
            {googleSetupState
              ? 'Select your Gender & Hostel Block to complete setup'
              : isOtpStep
                ? `Enter the 6-digit code sent to ${signupEmail}`
                : authMode === 'login'
                  ? 'Sign in to access hostel rooms and peer chat'
                  : 'Create an account with Brevo Email OTP verification'}
          </p>
        </div>

        {/* Tab Switcher (Sign In vs Sign Up) */}
        {!googleSetupState && !isOtpStep && (
          <div className="auth-tabs mb-4">
            <button
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              <LogIn size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Sign In
            </button>
            <button
              className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              <UserPlus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Sign Up
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <div>{error}</div>
            {userAlreadyExists && (
              <button
                type="button"
                className="btn btn-primary w-100 mt-2"
                style={{ fontSize: '0.825rem', padding: '0.45rem' }}
                onClick={() => switchMode('login')}
              >
                Log In Now with Email & Password
              </button>
            )}
          </div>
        )}

        {/* Success Alert for OTP Sent */}
        {otpSentMsg && isOtpStep && !error && (
          <div style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {otpSentMsg}
          </div>
        )}

        {/* GOOGLE FIRST-TIME SETUP FORM */}
        {googleSetupState ? (
          <form onSubmit={handleCompleteGoogleSetup} className="auth-form">
            <div className="google-profile-card">
              {googleSetupState.picture ? (
                <img src={googleSetupState.picture} alt="Profile" className="google-avatar" />
              ) : (
                <User size={32} className="google-avatar" />
              )}
              <div>
                <div className="google-user-name">{googleSetupState.name}</div>
                <div className="google-user-email">{googleSetupState.email}</div>
                <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600, marginTop: 2 }}>
                  ✓ Email Verified via Google
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Gender</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <select
                  name="gender"
                  className="input-field w-100"
                  value={googleSetupState.gender}
                  onChange={(e) => setGoogleSetupState({ ...googleSetupState, gender: e.target.value, hostelBlock: e.target.value === 'Male' ? maleHostels[0] : femaleHostels[0] })}
                  required
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
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
                <select
                  name="hostelBlock"
                  className="input-field w-100"
                  value={googleSetupState.hostelBlock}
                  onChange={(e) => setGoogleSetupState({ ...googleSetupState, hostelBlock: e.target.value })}
                  required
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {(googleSetupState.gender === 'Male' ? maleHostels : googleSetupState.gender === 'Female' ? femaleHostels : [...maleHostels, ...femaleHostels]).map((hostel) => (
                    <option key={hostel} value={hostel}>
                      {hostel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={isLoading}>
              {isLoading ? 'Completing Setup...' : 'Enter HostelAdda'}
            </button>
          </form>
        ) : isOtpStep ? (
          /* STEP 2: BREVO EMAIL OTP VERIFICATION FORM */
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <div className="back-link mb-2" onClick={() => setIsOtpStep(false)}>
              <ArrowLeft size={16} /> Edit Signup Details
            </div>

            <div className="input-group">
              <label className="input-label">6-Digit Verification OTP Code</label>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon" />
                <input
                  type="text"
                  className="input-field w-100"
                  placeholder="e.g. 584920"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  style={{ letterSpacing: '4px', fontWeight: 'bold', fontSize: '1.1rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-3" disabled={isLoading || otpCode.length !== 6}>
              {isLoading ? 'Verifying OTP...' : 'Verify & Complete Sign Up'}
            </button>

            <div className="flex-between mt-3 text-small">
              <span style={{ color: 'var(--text-secondary)' }}>Didn't receive email?</span>
              <button
                type="button"
                className="btn-resend"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP via Brevo'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* 1-CLICK GOOGLE SSO BUTTON */}
            <div className="google-sso-wrapper">
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign-In was cancelled or failed.')}
                  shape="pill"
                  size="large"
                  width="340"
                  theme={isDark ? 'filled_black' : 'outline'}
                  text={authMode === 'signup' ? 'signup_with' : 'continue_with'}
                  logo_alignment="left"
                />
              </div>

              <div style={{ fontSize: '0.775rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'center', justifyContent: 'center', marginTop: '0.25rem' }}>
                <ShieldCheck size={15} /> 1-Click Instant Sign In via Google
              </div>
            </div>

            {/* DIVIDER */}
            <div className="auth-divider">
              <span>OR USE EMAIL</span>
            </div>

            {/* SIGN IN FORM (EMAIL + PASSWORD) */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="auth-form mt-3">
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      className="input-field w-100"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
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
                      className="input-field w-100"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 mt-4" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In with Email'}
                </button>

                <div className="auth-footer text-center">
                  <p className="text-small text-muted">
                    Don't have an account yet?{' '}
                    <span className="auth-link" onClick={() => switchMode('signup')}>
                      Sign Up
                    </span>
                  </p>
                </div>
              </form>
            ) : (
              /* STEP 1: SIGN UP FORM WITH BREVO EMAIL OTP VERIFICATION */
              <form onSubmit={handleRequestOTP} className="auth-form mt-3">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      className="input-field w-100"
                      placeholder="Manpreet Singh"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      className="input-field w-100"
                      placeholder="name@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
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
                      className="input-field w-100"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={4}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Gender</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <select
                      className="input-field w-100"
                      value={signupGender}
                      onChange={(e) => {
                        const newGender = e.target.value;
                        setSignupGender(newGender);
                        setSignupHostel(newGender === 'Male' ? maleHostels[0] : femaleHostels[0]);
                      }}
                      required
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
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
                    <select
                      className="input-field w-100"
                      value={signupHostel}
                      onChange={(e) => setSignupHostel(e.target.value)}
                      required
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      {(signupGender === 'Male' ? maleHostels : signupGender === 'Female' ? femaleHostels : [...maleHostels, ...femaleHostels]).map((hostel) => (
                        <option key={hostel} value={hostel}>
                          {hostel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 mt-4" disabled={isLoading}>
                  {isLoading ? 'Sending Brevo OTP...' : <><Send size={16} /> Send Email Verification OTP</>}
                </button>

                <div className="auth-footer text-center">
                  <p className="text-small text-muted">
                    Already have an account?{' '}
                    <span className="auth-link" onClick={() => switchMode('login')}>
                      Log In
                    </span>
                  </p>
                </div>
              </form>
            )}

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <FileText size={12} /> Read Community Guidelines & Terms
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
