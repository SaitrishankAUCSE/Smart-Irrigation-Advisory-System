import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, LogOut } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { currentUser } = useAuth();
  const userName = currentUser?.name || 'Farmer';
  const [isScrimVisible, setIsScrimVisible] = useState(false);

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

  const handleSignOut = () => {
    // Basic sign out fallback since AuthContext may not have a dedicated signOut
    localStorage.removeItem('agrisense_username');
    window.location.reload();
  };

  return (
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
        to="/" 
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
        <span style={{ color: '#8A877E' }}>{userName}</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
          <Link 
            to="/dashboard"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              opacity: 0.62,
              transition: 'opacity 0.3s cubic-bezier(.2, .7, .2, 1)'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = 1}
            onMouseOut={(e) => e.currentTarget.style.opacity = 0.62}
          >
            Dashboard
          </Link>
          
          <button 
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
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
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}
