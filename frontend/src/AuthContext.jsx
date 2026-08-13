import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // HACKATHON: No login required. Always logged in as demo farmer.
  const [currentUser] = useState({ uid: 'demo_user_123', email: 'demo@agrisense.app' });
  const [role] = useState('farmer');

  const value = {
    currentUser,
    role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
