import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, Video, MessageSquare, Shuffle, Lock, Home, ArrowRight, Sun, Moon, HelpCircle, ChevronDown, ChevronUp, FileText, CheckCircle2, User } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import TermsModal from '../components/TermsModal';
import './About.css';

const About = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [showTerms, setShowTerms] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'Who can access HostelAdda (Chitmeet)?',
      a: 'HostelAdda is strictly restricted to verified Chitkara University students with active @chitkara.edu.in Google Workspace accounts. Personal @gmail.com or unverified accounts are automatically blocked.'
    },
    {
      q: 'How does 1-Click Google Sign-In work?',
      a: 'Click "Sign In with Chitkara Google Account". Google opens the official Chitkara login popup. Once verified, you are immediately logged in with zero OTP wait time.'
    },
    {
      q: 'Is my video and text chat private and secure?',
      a: 'Yes! Video calls run directly peer-to-peer using WebRTC encryption. Random room chats are non-persistent and deleted when empty.'
    },
    {
      q: 'What is the policy on abusive language or harassment?',
      a: 'HostelAdda maintains a strict Zero Tolerance Policy for harassment, offensive language, or unauthorized recording. Accounts violating community standards are immediately banned.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="about-container">
      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => { setShowTerms(false); navigate('/auth'); }}
      />

      {/* Top Navbar */}
      <header className="glass-panel navbar flex-between">
        <div className="logo flex-center" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/favicon.svg.jpeg" alt="HostelAdda Logo" className="navbar-logo-img" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
          <span className="heading-md brand-name" style={{ marginLeft: '0.5rem' }}>HostelAdda</span>
          <span className="brand-badge" style={{ background: 'rgba(234,88,12,0.15)', color: '#ea580c', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, marginLeft: '0.5rem' }}>CHITKARA</span>
        </div>

        <nav className="nav-links">
          <button className="nav-link-btn" onClick={() => navigate('/')}>Home</button>
          <button className="nav-link-btn active" onClick={() => navigate('/about')}>About Us</button>
          <button className="nav-link-btn" onClick={() => navigate(user ? '/profile' : '/auth')}>Profile</button>
        </nav>

        <div className="nav-actions flex-center">
          <button className="icon-btn theme-toggle" onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {user ? (
            <button className="btn btn-primary nav-btn-compact flex-center" onClick={() => navigate('/profile')} style={{ gap: '0.4rem' }}>
              <User size={15} /> {user.name}
            </button>
          ) : (
            <button className="btn btn-primary nav-btn-compact flex-center" onClick={() => navigate('/auth')} style={{ gap: '0.4rem' }}>
              <User size={15} /> Profile
            </button>
          )}
        </div>
      </header>

      <main className="about-main">
        {/* Hero Section */}
        <section className="about-hero text-center">
          <span className="badge badge-purple mb-4">ABOUT HOSTELADDA</span>
          <h1 className="heading-xl">
            Connecting <span className="text-gradient-accent">Chitkara University</span> Hostels
          </h1>
          <p className="text-body about-subtitle">
            HostelAdda (Chitmeet) is the premier real-time communication platform designed exclusively for Chitkara University hostel students across Franklin, Archimedes, NGH, Magellan, Vasco, Columbus, IBN, and PIE blocks.
          </p>
        </section>

        {/* Mission & Core Values */}
        <section className="mission-grid mt-12">
          <div className="glass-card mission-card">
            <div className="card-icon warning"><Users size={28} /></div>
            <h3 className="heading-md mt-4">Peer Collaboration</h3>
            <p className="text-small text-muted">
              Connect with fellow hostellers for project collaboration, late-night study sessions, gaming, and campus networking.
            </p>
          </div>

          <div className="glass-card mission-card">
            <div className="card-icon success"><ShieldCheck size={28} /></div>
            <h3 className="heading-md mt-4">Verified @chitkara SSO</h3>
            <p className="text-small text-muted">
              Every user is authenticated via Google OAuth with official @chitkara.edu.in credentials, ensuring 100% student authenticity.
            </p>
          </div>

          <div className="glass-card mission-card">
            <div className="card-icon danger"><Lock size={28} /></div>
            <h3 className="heading-md mt-4">Zero Tolerance Safety</h3>
            <p className="text-small text-muted">
              Built on strict community guidelines. Zero tolerance for abusive language, bullying, or unauthorized recording.
            </p>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="faq-section mt-16">
          <div className="section-title text-center mb-8">
            <h2 className="heading-lg">Frequently Asked Questions</h2>
            <p className="text-small text-muted">Everything you need to know about HostelAdda</p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-card faq-item" onClick={() => toggleFaq(idx)}>
                <div className="faq-header flex-between">
                  <h4 className="faq-question">{faq.q}</h4>
                  <button className="icon-btn">{openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
                </div>
                {openFaq === idx && (
                  <p className="faq-answer text-small text-muted mt-3">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Footer Card */}
        <div className="glass-panel cta-banner text-center mt-16">
          <h2 className="heading-lg mb-2">Ready to join your Hostel Community?</h2>
          <p className="text-small text-muted mb-6">Start chatting or matching with verified Chitkara peers in seconds.</p>
          <div className="flex-center" style={{ gap: '1rem' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(user ? '/dashboard' : '/auth')}>
              {user ? 'Go to Dashboard' : 'Sign In with Google'} <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => setShowTerms(true)}>
              <FileText size={18} /> Community Rules
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
