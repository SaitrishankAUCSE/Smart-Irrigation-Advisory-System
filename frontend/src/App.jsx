import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import VerticalBackRail from './components/VerticalBackRail';
import Bhoomi from './pages/Bhoomi';
import FarmerDashboard from './pages/FarmerDashboard';
import LandingPage from './pages/LandingPage';
import FieldDetail from './pages/FieldDetail';
import WaterUsageDashboard from './pages/WaterUsageDashboard';

// Swipe-to-go-back gesture handler
function SwipeNavigationHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Detect left-to-right swipe (standard back gesture)
      if (deltaX > 75 && Math.abs(deltaY) < 60) {
        if (currentUser && (location.pathname === '/bhoomi' || location.pathname === '/')) {
          return;
        }
        if (window.history.length > 1) {
          navigate(-1);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate, location, currentUser]);

  return null;
}

// Protected Routing Structure based on User Authentication State
function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* If user is logged in, landing page and login are completely disabled & redirect to Bhoomi */}
      <Route 
        path="/" 
        element={currentUser ? <Navigate to="/bhoomi" replace /> : <LandingPage />} 
      />

      <Route 
        path="/bhoomi" 
        element={currentUser ? <Bhoomi /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/simulator" 
        element={currentUser ? <Navigate to="/bhoomi" replace /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/soil-simulator" 
        element={<Navigate to="/bhoomi" replace />} 
      />

      <Route 
        path="/dashboard" 
        element={<Navigate to="/bhoomi" replace />} 
      />

      <Route 
        path="/plots" 
        element={currentUser ? <FarmerDashboard /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/field/:id" 
        element={currentUser ? <FieldDetail /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/field/:id/analytics" 
        element={currentUser ? <WaterUsageDashboard /> : <Navigate to="/" replace />} 
      />

      {/* Fallback route */}
      <Route 
        path="*" 
        element={<Navigate to={currentUser ? "/bhoomi" : "/"} replace />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <Router>
        {/* Film grain overlay */}
        <div className="grain" aria-hidden="true" />

        {/* Global Swipe to Go Back Gesture Listener */}
        <SwipeNavigationHandler />

        {/* Sleek Vertical Scroller Back Rail (Left Side) */}
        <VerticalBackRail />

        <Navbar />
        <main>
          <AppRoutes />
        </main>
      </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
