import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, LogOut, AlertTriangle, Sparkles, Globe } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AuthModal from './AuthModal';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userName = currentUser?.name;
  const [isScrimVisible, setIsScrimVisible] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  let language = 'en';
  let setLanguage = () => {};
  try {
    const langCtx = useLanguage();
    if (langCtx) {
      language = langCtx.language || 'en';
      setLanguage = langCtx.setLanguage || (() => {});
    }
  } catch (e) {
    // fallback
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.6) {
        setIsScrimVisible(true);
      } else {
        setIsScrimVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      localStorage.removeItem('agrisense_username');
      setShowConfirmSignOut(false);
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <nav 
        className={`nav-bar ${isScrimVisible ? 'nav-scrim' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 26px',
          color: '#EAE8E1',
          fontFamily: "'Instrument Sans', sans-serif",
          fontSize: '13px',
          transition: 'all 0.4s cubic-bezier(.2, .7, .2, 1)'
        }}
      >
        <Link 
          to={currentUser ? "/bhoomi" : "/"} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <Leaf size={15} color="#2D7A4F" strokeWidth={2} />
          <span style={{ fontWeight: 500, letterSpacing: '-0.02em' }}>AgriSense</span>
        </Link>

        {/* LANGUAGE DROPDOWN */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: '12px',
              opacity: 0.8
            }}
          >
            <Globe size={16} />
            <span style={{ textTransform: 'uppercase' }}>{language}</span>
          </button>
          
          {showLangDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
              background: 'var(--proof)',
              border: '1px solid rgba(234,232,225,0.12)',
              borderRadius: '6px',
              padding: '8px 0',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              minWidth: '120px'
            }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangDropdown(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: language === lang.code ? 'var(--accent-text)' : 'var(--sheet)',
                    padding: '8px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                    width: '100%'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(234,232,225,0.06)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{lang.native}</span>
                  <span style={{ fontSize: '10px', opacity: 0.5, fontFamily: "'DM Mono', monospace" }}>{lang.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {currentUser ? (
            <>
              <span style={{ color: '#8A877E', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>{userName}</span>
              
              <button 
                onClick={() => setShowConfirmSignOut(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'inherit',
                  opacity: 0.62,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'opacity 0.3s cubic-bezier(.2, .7, .2, 1)'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.62}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setShowAuth(true)}
              className="btn-accent"
              style={{
                background: 'var(--sheet)',
                color: 'var(--proof)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: '12px',
                textTransform: 'uppercase',
                transition: 'background 0.2s',
                fontWeight: 600
              }}
            >
              Get Started
            </button>
          )}
        </div>
      </nav>

      {showAuth && !currentUser && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* SIGN OUT CONFIRMATION MODAL */}
      {showConfirmSignOut && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(13,13,12,0.85)',
            backdropFilter: 'blur(12px)',
            fontFamily: "'Instrument Sans', sans-serif",
            padding: '16px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirmSignOut(false); }}
        >
          <div 
            className="grain" 
            style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}
          />

          <div 
            style={{
              position: 'relative',
              background: 'var(--proof)',
              border: '1px solid rgba(234, 232, 225, 0.12)',
              padding: '2.25rem 2rem',
              width: '100%',
              maxWidth: '380px',
              color: 'var(--sheet)',
              borderRadius: '6px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              textAlign: 'center'
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 77, 77, 0.1)',
              color: '#ff6b6b',
              marginBottom: '1.25rem'
            }}>
              <AlertTriangle size={22} />
            </div>

            <h3 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '1.85rem',
              margin: '0 0 0.5rem 0',
              fontWeight: 'normal',
              letterSpacing: '-0.02em'
            }}>
              Sign Out?
            </h3>

            <p style={{
              color: 'var(--graphite)',
              fontSize: '0.85rem',
              margin: '0 0 1.75rem 0',
              lineHeight: 1.45
            }}>
              Are you sure you want to sign out of <strong style={{ color: 'var(--sheet)' }}>{userName || 'your account'}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmSignOut(false)}
                disabled={isSigningOut}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid rgba(234, 232, 225, 0.16)',
                  color: 'var(--sheet)',
                  padding: '0.75rem',
                  borderRadius: '3px',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.82rem',
                  cursor: isSigningOut ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmSignOut}
                disabled={isSigningOut}
                style={{
                  flex: 1,
                  background: '#ff4d4d',
                  border: 'none',
                  color: '#fff',
                  padding: '0.75rem',
                  borderRadius: '3px',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isSigningOut ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: isSigningOut ? 0.7 : 1
                }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {isSigningOut ? 'Signing out...' : 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
