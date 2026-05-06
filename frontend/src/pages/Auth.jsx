import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Building, Sun, Moon } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', gender: '', hostelBlock: '', otp: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const maleHostels = ['FRANKLIN-A', 'FRANKLIN-B', 'ARCHIMEDIES-A', 'ARCHIMEDIES-B', 'ARMSTRONG', 'MAGELLAN', 'MARCOPOLO'];
  const femaleHostels = ['NGH-A', 'NGH-B', 'VASCO', 'COLUMBUS', 'IBN-A', 'IBN-B', 'IBN-C', 'PIE-A', 'PIE-B', 'PIE-C'];

  let availableHostels = [];
  if (formData.gender === 'Male') availableHostels = maleHostels;
  else if (formData.gender === 'Female') availableHostels = femaleHostels;
  else if (formData.gender === 'Others') availableHostels = [...maleHostels, ...femaleHostels];
  
  const navigate = useNavigate();
  const { login, register, sendOtp } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    let res;
    if (isLogin) {
      res = await login(formData.email, formData.password);
    } else {
      if (!formData.email.endsWith('@chitkara.edu.in')) {
        setError('Only @chitkara.edu.in email addresses are allowed for registration.');
        setIsLoading(false);
        return;
      }
      
      if (!showOtpInput) {
        res = await sendOtp(formData.email);
        if (res.success) {
          setShowOtpInput(true);
          setIsLoading(false);
          return; // Stop here, wait for user to enter OTP
        }
      } else {
        res = await register(formData.name, formData.email, formData.password, formData.gender, formData.hostelBlock, formData.otp);
      }
    }

    if (!res.success) {
      setError(res.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-container flex-center">
      <button className="icon-btn theme-toggle" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }} onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      
      <div className="glass-panel auth-card">
        <div className="auth-header text-center">
          <h2 className="heading-lg">{isLogin ? 'Welcome Back' : 'Join HostelAdda'}</h2>
          <p className="text-body">{isLogin ? 'Login to access your hostel rooms' : 'Register to connect with peers'}</p>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input type="text" name="name" className="input-field" placeholder="John Doe" onChange={handleChange} required />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Gender</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <select name="gender" className="input-field" value={formData.gender} onChange={handleChange} required style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
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
                    <select name="hostelBlock" className="input-field" value={formData.hostelBlock} onChange={handleChange} required style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="" disabled>Select Hostel</option>
                      {availableHostels.map(hostel => (
                        <option key={hostel} value={hostel}>{hostel}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" className="input-field" placeholder="Select Gender First" disabled style={{ opacity: 0.7 }} />
                  )}
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label">University Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input type="email" name="email" className="input-field" placeholder="student@chitkara.edu.in" onChange={handleChange} required />
            </div>
            {!isLogin && <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>Only @chitkara.edu.in emails allowed.</small>}
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input type="password" name="password" className="input-field" placeholder="••••••••" onChange={handleChange} required disabled={showOtpInput} />
            </div>
          </div>

          {!isLogin && showOtpInput && (
            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label className="input-label">Enter OTP</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input type="text" name="otp" className="input-field" placeholder="6-digit OTP" onChange={handleChange} required />
              </div>
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>OTP sent to {formData.email}</small>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100 mt-4" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : (showOtpInput ? 'Verify & Sign Up' : 'Get OTP'))}
          </button>
        </form>

        <div className="auth-footer text-center">
          <p className="text-small">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="auth-link" onClick={() => { setIsLogin(!isLogin); setShowOtpInput(false); setError(''); }}>
              {isLogin ? 'Sign up' : 'Login'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
