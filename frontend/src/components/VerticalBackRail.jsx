import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ChevronLeft } from 'lucide-react';

export default function VerticalBackRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

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
    <>
      <style>{`
        .vertical-back-rail {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%) translateX(0);
          z-index: 95;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 18px 8px 20px 6px;
          background: transparent;
          backdrop-filter: none;
          border-top-right-radius: 100px;
          border-bottom-right-radius: 100px;
          border: 1px solid transparent;
          border-left: none;
          box-shadow: none;
          opacity: 0.2;
          transition: all 0.3s cubic-bezier(.2, .7, .2, 1);
          user-select: none;
        }

        .vertical-back-rail:hover {
          opacity: 1;
          transform: translateY(-50%) translateX(3px);
          background: linear-gradient(90deg, rgba(45, 122, 79, 0.28) 0%, rgba(45, 122, 79, 0.08) 80%, transparent 100%);
          backdrop-filter: blur(12px);
          border-color: rgba(78, 201, 122, 0.5);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(78, 201, 122, 0.35), inset 0 0 12px rgba(78, 201, 122, 0.15);
        }

        .vertical-back-rail .rail-track {
          width: 2px;
          height: 28px;
          border-radius: 10px;
          background: rgba(234, 232, 225, 0.25);
          margin-bottom: 8px;
          box-shadow: none;
          transition: all 0.3s cubic-bezier(.2, .7, .2, 1);
        }

        .vertical-back-rail:hover .rail-track {
          width: 3px;
          height: 38px;
          background: linear-gradient(180deg, #4EC97A 0%, rgba(78, 201, 122, 0.3) 100%);
          box-shadow: 0 0 10px #4EC97A, 0 0 18px rgba(78, 201, 122, 0.6);
        }

        .vertical-back-rail .rail-chevron {
          color: var(--graphite);
          transform: translateX(0);
          transition: all 0.3s cubic-bezier(.2, .7, .2, 1);
          margin-bottom: 6px;
        }

        .vertical-back-rail:hover .rail-chevron {
          color: #4EC97A;
          transform: translateX(-2px);
          filter: drop-shadow(0 0 6px #4EC97A);
        }

        .vertical-back-rail .rail-text {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--graphite);
          transition: all 0.3s cubic-bezier(.2, .7, .2, 1);
        }

        .vertical-back-rail:hover .rail-text {
          color: #ffffff;
          font-weight: 600;
          text-shadow: 0 0 10px rgba(78, 201, 122, 0.8);
        }
      `}</style>

      <div
        className="vertical-back-rail"
        onClick={handleBack}
        title="Click to go back to previous page"
      >
        {/* Sleek Vertical Scroller Track Indicator */}
        <div className="rail-track" />

        {/* Subtle Back Chevron */}
        <ChevronLeft size={14} className="rail-chevron" strokeWidth={2.4} />

        {/* Vertical Text Label */}
        <span className="rail-text">BACK</span>
      </div>
    </>
  );
}
