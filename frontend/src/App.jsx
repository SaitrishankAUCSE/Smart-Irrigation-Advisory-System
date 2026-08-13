import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
import FarmerDashboard from './pages/FarmerDashboard';
import FieldDetail from './pages/FieldDetail';
import WaterUsageDashboard from './pages/WaterUsageDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<FarmerDashboard />} />
              <Route path="/field/:id" element={<FieldDetail />} />
              <Route path="/field/:id/analytics" element={<WaterUsageDashboard />} />
              {/* Catch-all: send everything to dashboard */}
              <Route path="*" element={<FarmerDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
