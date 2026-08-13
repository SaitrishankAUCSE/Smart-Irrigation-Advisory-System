import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let name = localStorage.getItem('demo_username');
    if (!name) {
      name = prompt("Welcome to AgriSense! What is your name?") || "Anonymous Farmer";
      localStorage.setItem('demo_username', name);
    }
    setCurrentUser({ uid: 'demo_user_' + name.replace(/\s+/g, '_').toLowerCase(), name: name });
  }, []);

  const value = {
    currentUser,
    role: 'farmer'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
