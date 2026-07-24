// Chitmeet Authentication Component
import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Building, Sun, Moon, ArrowLeft, CheckCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1); // 1: Details form, 2: OTP Verification
  const [formData, setFormData] = useState({ name: '', email: '', password: '', gender: '', hostelBlock: '' });
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  
  // Google Profile Completion State (if new user logs in via Google)
  const [googleProfileState, setGoogleProfileState] = useState(null);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Resend OTP Countdown Timer (60s)
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  const otpInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const maleHostels = ['FRANKLIN-A', 'FRANKLIN-B', 'ARCHIMEDIES-A', 'ARCHIMEDIES-B', 'ARMSTRONG', 'MAGELLAN', 'MARCOPOLO'];
  const femaleHostels = ['NGH-A', 'NGH-B', 'VASCO', 'COLUMBUS', 'IBN-A', 'IBN-B', 'IBN-C', 'PIE-A', 'PIE-B', 'PIE-C'];

  let availableHostels = [];
  if (formData.gender === 'Male') availableHostels = maleHostels;
  else if (formData.gender === 'Female') availableHostels = femaleHostels;
  else if (formData.gender === 'Others') availableHostels = [...maleHostels, ...femaleHostels];

  const navigate = useNavigate();
  const { login, register, sendOtp, googleAuth } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  // Timer logic for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendTimer]);

  const startResendTimer = () => {
    setResendTimer(60);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle Google OAuth Success
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await googleAuth(credentialResponse.credential);
      if (res.requiresProfileDetails) {
        setGoogleProfileState({
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

  // Submit Google Profile Completion (Gender + Hostel Block)
  const handleCompleteGoogleProfile = async (e) => {
    e.preventDefault();
    if (!googleProfileState.gender) {
      setError('Please select your gender.');
      return;
    }
    if (!googleProfileState.hostelBlock) {
      setError('Please select your hostel block.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await googleAuth(
        googleProfileState.credential,
        googleProfileState.gender,
        googleProfileState.hostelBlock
      );
      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Profile registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle single digit OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.slice(-1);
    setOtpDigits(newOtpDigits);

    if (value && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setOtpDigits(digits);
    otpInputRefs[5].current?.focus();
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setSignupStep(1);
    setGoogleProfileState(null);
    setError('');
    setSuccessMsg('');
    setDevOtp('');
    setOtpDigits(['', '', '', '', '', '']);
  };

  const triggerSendOtp = async (emailToUse) => {
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await sendOtp(emailToUse || formData.email);
      if (res.success) {
        setSignupStep(2);
        setSuccessMsg(res.message);
        if (res.devOtp) setDevOtp(res.devOtp);
        startResendTimer();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isLogin) {
      setIsLoading(true);
      try {
        const res = await login(formData.email, formData.password);
        if (!res.success) setError(res.message);
      } catch (err) {
        setError(err.message || 'Login failed.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (signupStep === 1) {
      if (!formData.email.endsWith('@chitkara.edu.in')) {
        setError('Only @chitkara.edu.in email addresses are allowed for registration.');
        return;
      }
      if (!formData.gender) {
        setError('Please select your gender.');
        return;
      }
      if (!formData.hostelBlock) {
        setError('Please select your hostel block.');
        return;
      }

      await triggerSendOtp(formData.email);
    } else if (signupStep === 2) {
      const fullOtp = otpDigits.join('');
      if (fullOtp.length !== 6) {
        setError('Please enter all 6 digits of the OTP code.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.gender,
          formData.hostelBlock,
          fullOtp
        );
        if (!res.success) {
          setError(res.message);
        }
      } catch (err) {
        setError(err.message || 'Registration failed.');
      } finally {
        setIsLoading(false);
      }
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
            {googleProfileState
              ? 'Complete Profile'
              : isLogin
              ? 'Welcome Back'
              : signupStep === 1
              ? 'Join HostelAdda'
              : 'Verify Email'}
          </h2>
          <p className="text-body">
            {googleProfileState
              ? 'Select your Hostel & Gender to complete sign up'
              : isLogin
              ? 'Login with your Chitkara account'
              : signupStep === 1
              ? '1-Click Google Sign-In or Email Verification'
              : `We sent a 6-digit OTP to ${formData.email}`}
          </p>
        </div>

        {error && (
          <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* 1-CLICK GOOGLE SSO BUTTON */}
        {!googleProfileState && signupStep === 1 && (
          <div className="google-sso-wrapper">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
            <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Official @chitkara.edu.in accounts only
            </div>

            <div className="auth-divider w-100">
              <span>OR USE EMAIL</span>
            </div>
          </div>
        )}

        {/* GOOGLE NEW USER PROFILE COMPLETION FORM */}
        {googleProfileState ? (
          <form onSubmit={handleCompleteGoogleProfile} className="auth-form">
            <div className="google-profile-card">
              {googleProfileState.picture ? (
                <img src={googleProfileState.picture} alt="Profile" className="google-avatar" />
              ) : (
                <User size={32} className="google-avatar" />
              )}
              <div>
                <div className="google-user-name">{googleProfileState.name}</div>
                <div className="google-user-email">{googleProfileState.email}</div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Gender</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <select
                  name="gender"
                  className="input-field"
                  value={googleProfileState.gender}
                  onChange={(e) => setGoogleProfileState({ ...googleProfileState, gender: e.target.value, hostelBlock: '' })}
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
                {googleProfileState.gender ? (
                  <select
                    name="hostelBlock"
                    className="input-field"
                    value={googleProfileState.hostelBlock}
                    onChange={(e) => setGoogleProfileState({ ...googleProfileState, hostelBlock: e.target.value })}
                    required
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    <option value="" disabled>Select Hostel</option>
                    {(googleProfileState.gender === 'Male' ? maleHostels : googleProfileState.gender === 'Female' ? femaleHostels : [...maleHostels, ...femaleHostels]).map((hostel) => (
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
              {isLoading ? 'Completing Registration...' : 'Complete Sign Up'}
            </button>
          </form>
        ) : (
          /* STANDARD LOGIN / SIGNUP FORM */
          <form onSubmit={handleSubmit} className="auth-form">
            {(isLogin || signupStep === 1) && (
              <>
                {!isLogin && (
                  <>
                    <div className="input-group">
                      <label className="input-label">Full Name</label>
                      <div className="input-with-icon">
                        <User size={18} className="input-icon" />
                        <input
                          type="text"
                          name="name"
                          className="input-field"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Gender</label>
                      <div className="input-with-icon">
                        <User size={18} className="input-icon" />
                        <select
                          name="gender"
                          className="input-field"
                          value={formData.gender}
                          onChange={handleChange}
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
                        {formData.gender ? (
                          <select
                            name="hostelBlock"
                            className="input-field"
                            value={formData.hostelBlock}
                            onChange={handleChange}
                            required
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                          >
                            <option value="" disabled>Select Hostel</option>
                            {availableHostels.map((hostel) => (
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
                  </>
                )}

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
                  {!isLogin && (
                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                      Only @chitkara.edu.in emails allowed.
                    </small>
                  )}
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
              </>
            )}

            {!isLogin && signupStep === 2 && (
              <div className="otp-container">
                <div className="otp-inputs" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-digit-box"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <div className="otp-resend-row">
                  <span className="back-link" onClick={() => { setSignupStep(1); setError(''); setSuccessMsg(''); }}>
                    <ArrowLeft size={14} /> Change Email
                  </span>

                  {resendTimer > 0 ? (
                    <span>Resend code in <strong>{resendTimer}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      className="btn-resend"
                      onClick={() => triggerSendOtp(formData.email)}
                      disabled={isLoading}
                    >
                      <RefreshCw size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={isLoading}>
              {isLoading
                ? 'Processing...'
                : isLogin
                ? 'Login'
                : signupStep === 1
                ? 'Send Verification Code'
                : 'Verify & Sign Up'}
            </button>
          </form>
        )}

        <div className="auth-footer text-center">
          <p className="text-small">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span className="auth-link" onClick={toggleAuthMode}>
              {isLogin ? 'Sign up' : 'Login'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
