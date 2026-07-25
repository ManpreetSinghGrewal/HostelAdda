import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Lock, Users, AlertTriangle, X } from 'lucide-react';
import './TermsModal.css';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
  const [hasAgreed, setHasAgreed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (hasAgreed) {
      onAccept();
    }
  };

  return (
    <div className="terms-modal-overlay flex-center">
      <div className="glass-panel terms-modal-card">
        <button className="terms-close-btn" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        <div className="terms-header text-center">
          <div className="terms-icon-badge">
            <ShieldAlert size={28} style={{ color: '#ea580c' }} />
          </div>
          <h2 className="heading-md" style={{ marginTop: '0.5rem' }}>
            Community Guidelines & Terms
          </h2>
          <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
            Code of Conduct for Chitkara University HostelAdda
          </p>
        </div>

        <div className="terms-body">
          <div className="rule-item">
            <div className="rule-icon danger">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="rule-title">1. Zero Tolerance for Abusive Language</h4>
              <p className="rule-desc">
                Harassment, hate speech, profanity, slurs, or cyberbullying in text or video chat rooms is strictly forbidden. Violations result in instant account ban.
              </p>
            </div>
          </div>

          <div className="rule-item">
            <div className="rule-icon success">
              <CheckCircle size={20} />
            </div>
            <div>
              <h4 className="rule-title">2. Chitkara Account Only</h4>
              <p className="rule-desc">
                Only verified students with valid <code>@chitkara.edu.in</code> Google Workspace accounts are permitted. Do not attempt to share or fake identity details.
              </p>
            </div>
          </div>

          <div className="rule-item">
            <div className="rule-icon warning">
              <Lock size={20} />
            </div>
            <div>
              <h4 className="rule-title">3. Privacy & Recording Prohibition</h4>
              <p className="rule-desc">
                Recording, screenshotting, or sharing private video calls, student chats, or personal details without explicit consent is strictly prohibited.
              </p>
            </div>
          </div>

          <div className="rule-item">
            <div className="rule-icon primary">
              <Users size={20} />
            </div>
            <div>
              <h4 className="rule-title">4. Respectful Peer Interaction</h4>
              <p className="rule-desc">
                Maintain friendly, academic, and constructive discussions across all hostel blocks (Franklin, Archimedes, NGH, Vasco, Columbus, etc.).
              </p>
            </div>
          </div>
        </div>

        <div className="terms-footer">
          <label className="terms-checkbox-label">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="terms-checkbox"
            />
            <span>I have read and agree to follow the <strong>Chitkara HostelAdda Code of Conduct</strong>.</span>
          </label>

          <button
            className="btn btn-primary w-100 mt-3"
            disabled={!hasAgreed}
            onClick={handleConfirm}
            style={{ padding: '0.85rem 1.5rem', fontWeight: '600' }}
          >
            I Agree & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
