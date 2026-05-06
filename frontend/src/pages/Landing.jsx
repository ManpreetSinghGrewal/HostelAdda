import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Video, Users, Shield } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Background Orbs for aesthetics */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <nav className="glass-panel navbar flex-between">
        <div className="logo flex-center">
          <img src="/favicon.svg.jpeg" alt="HostelAdda Logo" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
          <span className="heading-md" style={{ marginLeft: '0.5rem' }}>HostelAdda</span>
        </div>
        <div className="nav-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/auth')}>Login</button>
          <button className="btn btn-primary" onClick={() => navigate('/auth')} style={{ marginLeft: '1rem' }}>Get Started</button>
        </div>
      </nav>

      <main className="hero-section flex-center">
        <div className="hero-content">
          <h1 className="heading-xl">
            Connect with your <br />
            <span className="text-gradient-accent">Hostel Community</span>
          </h1>
          <p className="text-body hero-subtitle">
            The exclusive text and video chat platform for Chitkara University students. 
            Join the conversation, meet your peers, and stay connected.
          </p>
          
          <div className="hero-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth')}>
              Join Now <Users size={20} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/dashboard')}>
              Explore Rooms
            </button>
          </div>

          <div className="features-grid">
            <div className="glass-card feature-card">
              <div className="feature-icon"><Video size={24} color="#ef4444" /></div>
              <h3 className="heading-md">HD Video Chat</h3>
              <p className="text-small">Crystal clear video rooms for group studies or late-night hangouts.</p>
            </div>
            <div className="glass-card feature-card">
              <div className="feature-icon"><MessageSquare size={24} color="#3b82f6" /></div>
              <h3 className="heading-md">Real-time Text</h3>
              <p className="text-small">Instant messaging with emojis, file sharing, and zero latency.</p>
            </div>
            <div className="glass-card feature-card">
              <div className="feature-icon"><Shield size={24} color="#10b981" /></div>
              <h3 className="heading-md">Safe & Secure</h3>
              <p className="text-small">Exclusive for verified Chitkara hostel students. No outsiders.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
