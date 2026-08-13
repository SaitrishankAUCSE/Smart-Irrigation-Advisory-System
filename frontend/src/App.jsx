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
        <div className="relative min-h-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-amber-950 text-gray-100 flex flex-col overflow-x-hidden selection:bg-emerald-500 selection:text-white">
          
          {/* Animated Ambient Soil & Oceanic Depth Layer */}
          <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
            <GradientBackground className="w-full h-full" />
          </div>

          {/* Floating Subtle Ambient Orbs */}
          <div className="fixed top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="fixed bottom-10 -right-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

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
