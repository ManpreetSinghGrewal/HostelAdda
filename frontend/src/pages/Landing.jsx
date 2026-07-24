import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Video, Users, Shield, Sun, Moon, FileText, Shuffle, Building2, CheckCircle2, ArrowRight, User, LogOut } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import TermsModal from '../components/TermsModal';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const [showTerms, setShowTerms] = useState(false);

  const maleHostels = [
    { name: 'Franklin Block A & B', tag: 'Boys Hostel', desc: 'Engineering & Tech Hub' },
    { name: 'Archimedes Block A & B', tag: 'Boys Hostel', desc: 'CSE & Coding Community' },
    { name: 'Armstrong & Magellan', tag: 'Boys Hostel', desc: 'Robotics & Gaming Lounge' },
    { name: 'Marco Polo', tag: 'Boys Hostel', desc: 'Freshers & General Hangout' }
  ];

  const femaleHostels = [
    { name: 'NGH Block A & B', tag: 'Girls Hostel', desc: 'Academic & Creative Lounge' },
    { name: 'Vasco & Columbus', tag: 'Girls Hostel', desc: 'Peer Networking & Discussion' },
    { name: 'IBN Block A, B & C', tag: 'Girls Hostel', desc: 'Group Study & Projects' },
    { name: 'PIE Block A, B & C', tag: 'Girls Hostel', desc: 'Cultural & Event Hub' }
  ];

  const handleGetStartedClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setShowTerms(true);
    }
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

      {/* Global Professional Header Navbar */}
      <header className="glass-panel navbar flex-between">
        <div className="logo flex-center" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/favicon.svg.jpeg" alt="HostelAdda Logo" className="navbar-logo-img" />
          <span className="heading-md brand-name">HostelAdda</span>
          <span className="brand-badge">CHITKARA</span>
        </div>

        <nav className="nav-links">
          <button className="nav-link-btn" onClick={() => navigate('/dashboard')}>Explore Rooms</button>
          <button className="nav-link-btn" onClick={() => navigate('/dashboard')}>Random Match</button>
          <button className="nav-link-btn" onClick={() => setShowTerms(true)}>Guidelines</button>
        </nav>

        <div className="nav-actions flex-center">
          <button className="icon-btn theme-toggle" onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {user ? (
            <>
              <button className="btn btn-secondary nav-btn-compact flex-center" onClick={() => navigate('/dashboard')} style={{ gap: '0.4rem' }}>
                <User size={15} /> {user.name}
              </button>
              <button className="btn btn-primary nav-btn-compact flex-center" onClick={() => navigate('/dashboard')} style={{ gap: '0.4rem' }}>
                Dashboard <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary nav-btn-compact" onClick={() => navigate('/auth')}>
                Login
              </button>
              <button className="btn btn-primary nav-btn-compact flex-center" onClick={handleGetStartedClick} style={{ gap: '0.4rem' }}>
                Get Started <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-section flex-center">
        <div className="hero-content">
          <h1 className="heading-xl hero-title">
            Connect with your <br />
            <span className="text-gradient-accent">Hostel Community</span>
          </h1>

          <p className="text-body hero-subtitle">
            The exclusive text, video, and random matchmaking portal built specifically for Chitkara University hostel students. 
            Connect with peers in your block safely & instantly.
          </p>

          <div className="hero-buttons">
            {user ? (
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRight size={20} />
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleGetStartedClick}>
                Join HostelAdda <Users size={20} />
              </button>
            )}
            
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/dashboard')}>
              <Shuffle size={18} /> Random Match
            </button>
          </div>

          {/* Live Hostel Ticker Marquee */}
          <div className="hostel-ticker-container glass-card">
            <div className="ticker-label">
              <span className="ticker-dot"></span> LIVE HOSTEL BLOCKS
            </div>
            <div className="ticker-track">
              <span>🏢 Franklin A & B</span>
              <span>•</span>
              <span>🏢 Archimedes A & B</span>
              <span>•</span>
              <span>🏢 NGH Girls Block</span>
              <span>•</span>
              <span>🏢 Magellan & Armstrong</span>
              <span>•</span>
              <span>🏢 Vasco & Columbus</span>
              <span>•</span>
              <span>🏢 IBN Block A, B & C</span>
              <span>•</span>
              <span>🏢 PIE Block A, B & C</span>
            </div>
          </div>

          {/* Features Showcase Grid */}
          <div className="section-title text-center mt-12 mb-6">
            <h2 className="heading-lg">Built for Chitkara Students</h2>
            <p className="text-small text-muted">Everything you need for seamless peer collaboration and hostel hangouts</p>
          </div>

          <div className="features-grid">
            <div className="glass-card feature-card">
              <div className="feature-icon danger"><Video size={24} /></div>
              <h3 className="heading-md">HD Video Rooms</h3>
              <p className="text-small">Crystal clear video and WebRTC audio for late-night study sessions or group discussions.</p>
            </div>

            <div className="glass-card feature-card">
              <div className="feature-icon warning"><MessageSquare size={24} /></div>
              <h3 className="heading-md">Real-Time Chat</h3>
              <p className="text-small">Zero-latency text messaging, file sharing, and room discussions for all hostel blocks.</p>
            </div>

            <div className="glass-card feature-card">
              <div className="feature-icon primary"><Shuffle size={24} /></div>
              <h3 className="heading-md">1-Click Random Match</h3>
              <p className="text-small">Get matched instantly with another Chitkara student for peer study or casual conversation.</p>
            </div>

            <div className="glass-card feature-card">
              <div className="feature-icon success"><Shield size={24} /></div>
              <h3 className="heading-md">Verified & Moderated</h3>
              <p className="text-small">Strictly restricted to @chitkara.edu.in accounts. Zero tolerance for abusive language.</p>
            </div>
          </div>

          {/* Hostel Blocks Directory Section */}
          <div className="section-title text-center mt-16 mb-8">
            <h2 className="heading-lg">Hostel Directory</h2>
            <p className="text-small text-muted">Connect directly with students in your specific hostel block</p>
          </div>

          <div className="hostel-directory-grid">
            <div className="directory-column">
              <h3 className="directory-title"><Building2 size={20} color="#ea580c" /> Boys Hostel Blocks</h3>
              <div className="directory-list">
                {maleHostels.map((hostel, idx) => (
                  <div key={idx} className="glass-card directory-item" onClick={() => navigate(user ? '/dashboard' : '/auth')}>
                    <div>
                      <div className="directory-name">{hostel.name}</div>
                      <div className="directory-desc">{hostel.desc}</div>
                    </div>
                    <span className="directory-tag boys">{hostel.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="directory-column">
              <h3 className="directory-title"><Building2 size={20} color="#ec4899" /> Girls Hostel Blocks</h3>
              <div className="directory-list">
                {femaleHostels.map((hostel, idx) => (
                  <div key={idx} className="glass-card directory-item" onClick={() => navigate(user ? '/dashboard' : '/auth')}>
                    <div>
                      <div className="directory-name">{hostel.name}</div>
                      <div className="directory-desc">{hostel.desc}</div>
                    </div>
                    <span className="directory-tag girls">{hostel.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Call to Action & Disclaimer */}
          <footer className="landing-footer glass-panel mt-16">
            <div className="footer-content flex-between">
              <div className="footer-brand">
                <div className="flex-center" style={{ justifyContent: 'flex-start' }}>
                  <img src="/favicon.svg.jpeg" alt="Logo" className="navbar-logo-img" />
                  <span className="heading-md" style={{ marginLeft: '0.5rem' }}>HostelAdda</span>
                </div>
                <p className="text-small text-muted mt-2">
                  The Official Student Portal for Chitkara University Hostel Community.
                </p>
              </div>

              <div className="footer-links">
                <button className="footer-btn" onClick={() => setShowTerms(true)}>
                  <FileText size={14} /> Community Guidelines & Rules
                </button>
                <button className="footer-btn" onClick={() => navigate('/dashboard')}>
                  <Users size={14} /> Room Hub
                </button>
              </div>
            </div>

            <div className="footer-bottom text-center">
              <p className="text-small text-muted">
                © {new Date().getFullYear()} HostelAdda. Built exclusively for Chitkara University Students.
              </p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Landing;
