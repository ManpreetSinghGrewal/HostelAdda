import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090d16',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#ea580c' }}>HostelAdda</h1>
          <p style={{ marginBottom: '1.5rem', color: '#cbd5e1', maxWidth: '400px' }}>
            A temporary session issue occurred. Resetting your session will restore page access.
          </p>
          <button 
            onClick={() => {
              try {
                localStorage.clear();
              } catch (e) {}
              window.location.href = '/';
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
            }}
          >
            Reset Session & Return Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
