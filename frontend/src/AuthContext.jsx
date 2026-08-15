import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem('agrisense_username');
    if (name) {
      const name_slug = name.toLowerCase().trim().replace(/\s+/g, '_');
      setCurrentUser({
        uid: 'farmer_' + name_slug,
        name: name,
      });
    }
    setLoading(false);
  }, []);

  const login = (name) => {
    const trimmed = name.trim() || 'Demo Farmer';
    localStorage.setItem('agrisense_username', trimmed);
    const name_slug = trimmed.toLowerCase().replace(/\s+/g, '_');
    setCurrentUser({
      uid: 'farmer_' + name_slug,
      name: trimmed,
    });
  };

  const value = {
    currentUser,
    role: 'farmer',
    loading,
    login
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-700 font-semibold">
          Loading farmer profile...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
