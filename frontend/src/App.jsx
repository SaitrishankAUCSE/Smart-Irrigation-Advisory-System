import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
import Bhoomi from './pages/Bhoomi';
import FarmerDashboard from './pages/FarmerDashboard';
import LandingPage from './pages/LandingPage';
import FieldDetail from './pages/FieldDetail';
import WaterUsageDashboard from './pages/WaterUsageDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Film grain overlay — sits above everything visually but passes clicks through */}
        <div className="grain" aria-hidden="true" />

        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/bhoomi" element={<Bhoomi />} />
            <Route path="/dashboard" element={<Navigate to="/bhoomi" replace />} />
            <Route path="/plots" element={<FarmerDashboard />} />
            <Route path="/field/:id" element={<FieldDetail />} />
            <Route path="/field/:id/analytics" element={<WaterUsageDashboard />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
