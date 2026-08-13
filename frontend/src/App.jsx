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
        <div className="relative min-h-screen bg-slate-900 text-gray-900 flex flex-col overflow-hidden">
          {/* Oceanic Depths Main Background */}
          <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
            <GradientBackground className="w-full h-full" />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
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
