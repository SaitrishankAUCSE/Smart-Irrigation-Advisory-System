import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user last login if registered in Firestore
  const syncUserToFirestore = async (user) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await setDoc(userRef, {
          last_login_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore user profile sync (non-fatal):', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userObj = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'Farmer',
          photo_url: user.photoURL || null,
          role: 'farmer'
        };
        setCurrentUser(userObj);
        await syncUserToFirestore(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  const value = {
    currentUser,
    role: 'farmer',
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--proof)', color: 'var(--sheet)', fontFamily: "'DM Mono', monospace" }}>
          Authenticating...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
