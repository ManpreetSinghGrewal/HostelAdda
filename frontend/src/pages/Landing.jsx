import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Video, Users, Shield, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import TermsModal from '../components/TermsModal';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);

  const handleGetStartedClick = () => {
    setShowTerms(true);
  };

  const handleTermsAccept = () => {
    setShowTerms(false);
    navigate('/auth');
  };

  return (
    <div className="landing-container">
      {/* Terms & Community Guidelines Modal */}
      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={handleTermsAccept}
      />

      {/* Unified Global Navbar */}
      <Navbar />

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
            <button className="btn btn-primary btn-lg" onClick={handleGetStartedClick}>
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
              <div className="feature-icon"><MessageSquare size={24} color="#ea580c" /></div>
              <h3 className="heading-md">Real-time Text</h3>
              <p className="text-small">Instant messaging with emojis, file sharing, and zero latency.</p>
            </div>
            <div className="glass-card feature-card">
              <div className="feature-icon"><Shield size={24} color="#10b981" /></div>
              <h3 className="heading-md">Safe & Moderated</h3>
              <p className="text-small">Exclusive for verified Chitkara hostel students. No abusive language tolerated.</p>
            </div>
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <button
              onClick={() => setShowTerms(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FileText size={14} /> Read Community Guidelines & Terms of Service
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
