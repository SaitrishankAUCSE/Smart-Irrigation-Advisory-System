import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
import FarmerDashboard from './pages/FarmerDashboard';
import FieldDetail from './pages/FieldDetail';
import WaterUsageDashboard from './pages/WaterUsageDashboard';
import { GradientBackground } from './components/ui/oceanic-depths';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="relative min-h-screen bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-amber-50/50 text-slate-900 flex flex-col overflow-x-hidden selection:bg-emerald-600 selection:text-white">
          
          {/* Light Soft Mint & Organic Farm Background */}
          <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
            <GradientBackground className="w-full h-full" />
          </div>

          {/* Ambient Natural Lighting Orbs */}
          <div className="fixed -top-24 -left-24 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="fixed top-1/3 -right-24 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<FarmerDashboard />} />
                <Route path="/field/:id" element={<FieldDetail />} />
                <Route path="/field/:id/analytics" element={<WaterUsageDashboard />} />
                <Route path="*" element={<FarmerDashboard />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
