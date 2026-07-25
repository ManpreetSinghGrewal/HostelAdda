import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Video, MessageSquare, Users, Sparkles, Building, ChevronDown, ChevronUp, Lock, ArrowRight, Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import './About.css';

const About = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const maleHostels = ['FRANKLIN-A', 'FRANKLIN-B', 'ARCHIMEDIES-A', 'ARCHIMEDIES-B', 'ARMSTRONG', 'MAGELLAN', 'MARCOPOLO'];
  const femaleHostels = ['NGH-A', 'NGH-B', 'VASCO', 'COLUMBUS', 'IBN-A', 'IBN-B', 'IBN-C', 'PIE-A', 'PIE-B', 'PIE-C'];

  const faqs = [
    {
      q: 'Who can join HostelAdda?',
      a: 'HostelAdda is exclusively reserved for Chitkara University hostel students. Registration requires a verified @chitkara.edu.in Google Workspace account.'
    },
    {
      q: 'Is my privacy and security protected?',
      a: 'Yes! All video calls use encrypted WebRTC connections. We enforce a zero-tolerance policy for abusive language or unauthorized recording.'
    },
    {
      q: 'How does Random Matchmaking work?',
      a: 'Click "Start Matching" on your dashboard to instantly connect 1-on-1 with a fellow Chitkara student for text and video chat.'
    },
    {
      q: 'Which hostel blocks are supported?',
      a: 'All official Chitkara University hostels including Franklin, Archimedes, Armstrong, Magellan, NGH, Vasco, Columbus, IBN, and Pie.'
    }
  ];

  return (
    <div className="about-page-container">
      <Navbar />

      <main className="about-main-content">
        {/* About Hero Section */}
        <section className="about-hero text-center">
          <div className="about-badge mb-3">
            <Sparkles size={16} /> Official Student Ecosystem
          </div>
          <h1 className="heading-xl mb-3">
            Connecting Chitkara's <br />
            <span className="text-gradient-accent">Hostel Community</span>
          </h1>
          <p className="text-body about-subtitle">
            HostelAdda is a high-performance text and video platform built exclusively for Chitkara University students to hang out, collaborate, study, and make lifelong friends across hostel blocks.
          </p>

          <div className="about-hero-actions flex-center mt-4">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth')}>
              Get Started <ArrowRight size={20} />
            </button>
            <button className="btn btn-secondary btn-lg ms-3" onClick={() => navigate('/dashboard')}>
              Explore Rooms
            </button>
          </div>
        </section>

        {/* Core Features Grid */}
        <section className="about-section">
          <h2 className="heading-lg text-center mb-5">Why Chitkara Students Love HostelAdda</h2>
          <div className="about-features-grid">
            <div className="glass-card about-feature-card">
              <div className="feature-icon-box orange">
                <ShieldCheck size={26} />
              </div>
              <h3 className="heading-md">Strictly Verified</h3>
              <p className="text-small">
                Single Sign-On strictly validates <code>@chitkara.edu.in</code> Google accounts so you only interact with real Chitkara peers.
              </p>
            </div>

            <div className="glass-card about-feature-card">
              <div className="feature-icon-box red">
                <Video size={26} />
              </div>
              <h3 className="heading-md">HD Video & WebRTC</h3>
              <p className="text-small">
                Crystal clear group study rooms and low-latency peer video chat designed for late-night exam prep and gaming sessions.
              </p>
            </div>

            <div className="glass-card about-feature-card">
              <div className="feature-icon-box green">
                <MessageSquare size={26} />
              </div>
              <h3 className="heading-md">Zero Tolerance Safety</h3>
              <p className="text-small">
                Moderated community guidelines ensuring respectful peer interaction with zero tolerance for abusive language or harassment.
              </p>
            </div>
          </div>
        </section>

        {/* Supported Hostels Grid */}
        <section className="about-section">
          <div className="glass-panel hostels-card text-center">
            <div className="flex-center mb-3" style={{ gap: '0.5rem' }}>
              <Building size={24} color="#ea580c" />
              <h2 className="heading-md" style={{ margin: 0 }}>Supported Chitkara Hostel Blocks</h2>
            </div>
            <p className="text-small text-muted mb-4">
              Connected across all Men's & Women's Hostel Residences
            </p>

            <div className="hostels-grid">
              <div className="hostel-column">
                <h4 className="hostel-category-title">👨 Men's Residences</h4>
                <div className="hostel-chips">
                  {maleHostels.map(h => (
                    <span key={h} className="hostel-chip">{h}</span>
                  ))}
                </div>
              </div>

              <div className="hostel-column">
                <h4 className="hostel-category-title">👩 Women's Residences</h4>
                <div className="hostel-chips">
                  {femaleHostels.map(h => (
                    <span key={h} className="hostel-chip female">{h}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="about-section">
          <h2 className="heading-lg text-center mb-4">Frequently Asked Questions</h2>
          <div className="faq-container">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`glass-card faq-item ${openFaq === idx ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="faq-header flex-between">
                  <h4 className="faq-question">{faq.q}</h4>
                  {openFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {openFaq === idx && (
                  <p className="faq-answer text-body mt-2">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="about-footer text-center">
        <p className="text-small">
          Built with <Heart size={14} color="#ef4444" style={{ display: 'inline', verticalAlign: 'middle' }} /> for Chitkara University Students
        </p>
      </footer>
    </div>
  );
};

export default About;
