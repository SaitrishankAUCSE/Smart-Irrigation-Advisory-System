import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { X, AlertCircle } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatError = (err) => {
    if (!err) return 'Authentication failed. Please try again.';
    const code = err.code || '';
    const msg = err.message || '';
    
    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      return 'Domain not authorized. Add "smart-irrigation-advisory.vercel.app" in Firebase Console > Authentication > Settings > Authorized domains.';
    }
    if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
      return 'Sign-in popup was closed before completing.';
    }
    if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    }
    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return 'This sign-in provider is not enabled in Firebase Console (Authentication > Sign-in method).';
    }
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || msg.includes('invalid-credential') || msg.includes('user-not-found')) {
      return mode === 'login' 
        ? 'No registered account found with these credentials. Please sign up first.' 
        : 'Invalid credentials. Please check and try again.';
    }
    if (code === 'auth/wrong-password' || msg.includes('wrong-password')) {
      return 'Incorrect password. Please try again.';
    }
    if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
      return 'An account with this email already exists. Please switch to Log In.';
    }
    if (code === 'auth/weak-password' || msg.includes('weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (code === 'permission-denied' || msg.includes('permission-denied')) {
      return 'Database permission error. Check Firestore security rules.';
    }
    
    return code ? `[${code}] ${msg}` : msg || 'Authentication failed. Please try again.';
  };

  const recordUserInFirestore = async (user, actionType, provider, isSignup) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      
      const profileData = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'Farmer',
        photo_url: user.photoURL || null,
        email_verified: user.emailVerified || false,
        auth_provider: provider,
        last_login_at: new Date().toISOString(),
        role: 'farmer'
      };

      if (!snap.exists() || isSignup) {
        profileData.created_at = snap.exists() ? (snap.data().created_at || new Date().toISOString()) : new Date().toISOString();
      }

      await setDoc(userRef, profileData, { merge: true });

      // Record audit log
      await addDoc(collection(db, 'user_actions'), {
        user_id: user.uid,
        action: actionType,
        details: {
          email: user.email,
          provider: provider,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });
    } catch (dbErr) {
      console.warn('Firestore user record error (non-fatal):', dbErr);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Explicit registration
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await recordUserInFirestore(cred.user, 'signup_email', 'password', true);
        onClose();
        navigate('/bhoomi');
      } else {
        // Explicit login: Must verify account exists
        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        // Verify user profile exists in Firestore database
        const userRef = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
          // Unregistered user attempting to login
          await signOut(auth);
          setError('No registered account found with this email. Please sign up first.');
          return;
        }

        await recordUserInFirestore(cred.user, 'login_email', 'password', false);
        onClose();
        navigate('/bhoomi');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userRef);

      if (mode === 'login') {
        // In login mode, ONLY allow users who have previously signed up
        if (!snap.exists()) {
          await signOut(auth);
          setError('No registered account found with this Google account. Please switch to "Sign up" first to register.');
          return;
        }

        await recordUserInFirestore(cred.user, 'login_google', 'google.com', false);
        onClose();
        navigate('/bhoomi');
      } else {
        // In signup mode, register new account
        await recordUserInFirestore(cred.user, 'signup_google', 'google.com', true);
        onClose();
        navigate('/bhoomi');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(13,13,12,0.85)', backdropFilter: 'blur(12px)',
        fontFamily: "'Instrument Sans', sans-serif",
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="grain" 
        style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}
      />
      
      <div 
        style={{
          position: 'relative',
          background: 'var(--proof)',
          border: '1px solid rgba(234, 232, 225, 0.12)',
          padding: '2.5rem 2.25rem',
          width: '100%',
          maxWidth: '420px',
          color: 'var(--sheet)',
          borderRadius: '6px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          margin: 'auto'
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            background: 'transparent', border: 'none', color: 'var(--graphite)',
            cursor: 'pointer', transition: 'color 0.2s', padding: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--sheet)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--graphite)'}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.4rem', margin: '0 0 0.35rem 0', fontWeight: 'normal', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {mode === 'signup' ? 'Get Started' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--graphite)', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
            {mode === 'signup' 
              ? 'Create a secure account to access your dashboard.'
              : 'Log in to your registered account.'}
          </p>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            background: 'rgba(255, 77, 77, 0.08)', border: '1px solid rgba(255, 77, 77, 0.3)', 
            color: '#ff6b6b', padding: '0.85rem 1rem', borderRadius: '4px',
            marginBottom: '1.25rem', fontSize: '0.82rem', fontFamily: "'DM Mono', monospace",
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--graphite)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Address
            </label>
            <input 
              type="email" 
              required 
              autoFocus
              className="input-dark"
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px', color: 'var(--sheet)', padding: '0.75rem 0.85rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', outline: 'none' }}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="farmer@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--graphite)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input 
              type="password" 
              required 
              className="input-dark"
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px', color: 'var(--sheet)', padding: '0.75rem 0.85rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', outline: 'none' }}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-accent"
            style={{ background: 'var(--sheet)', color: 'var(--proof)', border: 'none', padding: '0.85rem', borderRadius: '3px', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.25rem', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {loading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Log In')}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--proof)', padding: '0 0.75rem', color: 'var(--graphite)', fontSize: '0.72rem', fontFamily: "'DM Mono', monospace" }}>OR</span>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px', color: 'var(--sheet)', padding: '0.85rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', transition: 'all 0.2s' }}
          onMouseOver={e => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--graphite)' }}>
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button 
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--sheet)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 500 }}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--sheet)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 500 }}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
