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

  // We can show the back rail on all subpages (e.g. /simulator, /field/:id, /plots, /analytics)
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
      title="Click to go back"
      style={{
        position: 'fixed',
        left: 0,
        top: '50%',
        transform: isHovered ? 'translateY(-50%) translateX(3px)' : 'translateY(-50%) translateX(0)',
        zIndex: 90,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 8px 18px 6px',
        background: isHovered ? 'rgba(45, 122, 79, 0.22)' : 'rgba(234, 232, 225, 0.04)',
        backdropFilter: 'blur(12px)',
        borderTopRightRadius: '100px',
        borderBottomRightRadius: '100px',
        border: '1px solid',
        borderColor: isHovered ? 'var(--accent)' : 'rgba(234, 232, 225, 0.14)',
        borderLeft: 'none',
        boxShadow: isHovered 
          ? '0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(78, 201, 122, 0.35)' 
          : '0 8px 24px rgba(0,0,0,0.4)',
        transition: 'all 0.3s cubic-bezier(.2, .7, .2, 1)',
        userSelect: 'none'
      }}
    >
      {/* Sleek Vertical Scroller Track Indicator */}
      <div style={{
        width: '3px',
        height: isHovered ? '40px' : '28px',
        borderRadius: '10px',
        background: isHovered 
          ? 'linear-gradient(180deg, #4EC97A 0%, rgba(78, 201, 122, 0.2) 100%)' 
          : 'rgba(234, 232, 225, 0.25)',
        marginBottom: '10px',
        transition: 'all 0.3s cubic-bezier(.2, .7, .2, 1)',
        boxShadow: isHovered ? '0 0 8px #4EC97A' : 'none'
      }} />

      {/* Subtle Back Chevron */}
      <ChevronLeft 
        size={14} 
        color={isHovered ? '#4EC97A' : 'var(--graphite)'} 
        strokeWidth={2.4}
        style={{
          transform: isHovered ? 'translateX(-2px)' : 'translateX(0)',
          transition: 'transform 0.2s',
          marginBottom: '6px'
        }}
      />

      {/* Vertical Text Label */}
      <span
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontFamily: "'DM Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: isHovered ? '#fff' : 'var(--graphite)',
          transition: 'color 0.2s',
          paddingTop: '4px'
        }}
      >
        BACK
      </span>
    </div>
  );
}
