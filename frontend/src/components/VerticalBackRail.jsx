import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ChevronLeft } from 'lucide-react';

export default function VerticalBackRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // If user is logged in, their home is /bhoomi. If logged out, home is /.
  const isHomePage = currentUser ? location.pathname === '/bhoomi' : location.pathname === '/';

  // Only show on subpages (e.g. /simulator, /field/:id, /plots, /analytics)
  if (isHomePage) return null;

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(currentUser ? '/bhoomi' : '/');
    }
  };

  return (
    <div
      onClick={handleBack}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Click to go back to previous page"
      style={{
        position: 'fixed',
        left: 0,
        top: '50%',
        transform: isHovered ? 'translateY(-50%) translateX(4px)' : 'translateY(-50%) translateX(0)',
        zIndex: 95,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 10px 22px 8px',
        background: isHovered 
          ? 'linear-gradient(90deg, rgba(45, 122, 79, 0.25) 0%, rgba(45, 122, 79, 0.08) 75%, rgba(0,0,0,0) 100%)' 
          : 'transparent',
        backdropFilter: isHovered ? 'blur(16px)' : 'none',
        borderTopRightRadius: '100px',
        borderBottomRightRadius: '100px',
        border: '1px solid',
        borderColor: isHovered ? 'rgba(78, 201, 122, 0.45)' : 'transparent',
        borderLeft: 'none',
        boxShadow: isHovered 
          ? '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(78, 201, 122, 0.35), inset 0 0 15px rgba(78, 201, 122, 0.15)' 
          : 'none',
        opacity: isHovered ? 1 : 0.42,
        transition: 'all 0.35s cubic-bezier(.2, .7, .2, 1)',
        userSelect: 'none'
      }}
    >
      {/* Sleek Vertical Scroller Track Indicator */}
      <div 
        style={{
          width: isHovered ? '3px' : '2px',
          height: isHovered ? '42px' : '30px',
          borderRadius: '10px',
          background: isHovered 
            ? 'linear-gradient(180deg, #4EC97A 0%, rgba(78, 201, 122, 0.3) 100%)' 
            : 'rgba(234, 232, 225, 0.35)',
          marginBottom: '10px',
          boxShadow: isHovered ? '0 0 12px #4EC97A, 0 0 20px rgba(78, 201, 122, 0.6)' : 'none',
          transition: 'all 0.35s cubic-bezier(.2, .7, .2, 1)'
        }} 
      />

      {/* Subtle Back Chevron */}
      <ChevronLeft 
        size={15} 
        color={isHovered ? '#4EC97A' : 'var(--graphite)'} 
        strokeWidth={2.4}
        style={{
          transform: isHovered ? 'translateX(-2px)' : 'translateX(0)',
          filter: isHovered ? 'drop-shadow(0 0 8px #4EC97A)' : 'none',
          transition: 'all 0.3s cubic-bezier(.2, .7, .2, 1)',
          marginBottom: '8px'
        }}
      />

      {/* Vertical Text Label */}
      <span
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontFamily: "'DM Mono', monospace",
          fontSize: '10px',
          fontWeight: isHovered ? 600 : 400,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: isHovered ? '#fff' : 'var(--graphite)',
          textShadow: isHovered ? '0 0 12px rgba(78, 201, 122, 0.8)' : 'none',
          transition: 'all 0.3s cubic-bezier(.2, .7, .2, 1)',
          paddingTop: '2px'
        }}
      >
        BACK
      </span>
    </div>
  );
}
