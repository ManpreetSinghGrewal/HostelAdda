import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Building } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', hostelBlock: '' });
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login, register } = useContext(AuthContext);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    let res;
    if (isLogin) {
      res = await login(formData.email, formData.password);
    } else {
      res = await register(formData.name, formData.email, formData.password, formData.hostelBlock);
    }

    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="auth-container flex-center">
      <div className="glass-panel auth-card">
        <div className="auth-header text-center">
          <h2 className="heading-lg">{isLogin ? 'Welcome Back' : 'Join ChitMeet'}</h2>
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
                <label className="input-label">Hostel Name & Block</label>
                <div className="input-with-icon">
                  <Building size={18} className="input-icon" />
                  <input type="text" name="hostelBlock" className="input-field" placeholder="e.g. Tagore Block A" onChange={handleChange} required />
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input type="email" name="email" className="input-field" placeholder="your@email.com" onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input type="password" name="password" className="input-field" placeholder="••••••••" onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-4">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer text-center">
          <p className="text-small">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="auth-link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign up' : 'Login'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
