import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { X, AlertCircle } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signup'); // 'login' or 'signup'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to safely format Firebase errors
  const formatError = (errMessage) => {
    if (errMessage.includes('auth/user-not-found') || errMessage.includes('auth/invalid-credential')) return 'Invalid email or password.';
    if (errMessage.includes('auth/email-already-in-use')) return 'An account with this email already exists.';
    if (errMessage.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
    return errMessage.replace('Firebase: ', '').replace(/\([^)]+\)/, '').trim() || 'Authentication failed. Please try again.';
  };

  const handleUserDoc = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        role: 'farmer',
        created_at: new Date().toISOString()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await handleUserDoc(cred.user);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(formatError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await handleUserDoc(cred.user);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Google sign-in failed or was cancelled.');
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
        padding: '20px'
      }}
    >
      <div 
        className="grain" 
        style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}
      />
      
      <div 
        style={{
          position: 'relative',
          background: 'var(--proof)',
          border: '1px solid rgba(234, 232, 225, 0.1)',
          padding: '3.5rem 3rem',
          width: '100%',
          maxWidth: '440px',
          color: 'var(--sheet)',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'transparent', border: 'none', color: 'var(--graphite)',
            cursor: 'pointer', transition: 'color 0.2s', padding: '8px'
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--sheet)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--graphite)'}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.75rem', margin: '0 0 0.5rem 0', fontWeight: 'normal', letterSpacing: '-0.02em' }}>
            {mode === 'signup' ? 'Get Started' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--graphite)', fontSize: '0.95rem', margin: 0 }}>
            {mode === 'signup' 
              ? 'Create a secure account to access your dashboard.'
              : 'Sign in to access your dashboard.'}
          </p>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(255, 77, 77, 0.08)', border: '1px solid rgba(255, 77, 77, 0.3)', 
            color: '#ff4d4d', padding: '1rem', borderRadius: '6px',
            marginBottom: '2rem', fontSize: '0.85rem', fontFamily: "'DM Mono', monospace" 
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Address
            </label>
            <input 
              type="email" 
              required 
              autoFocus
              className="input-dark"
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--sheet)', padding: '1rem', fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', transition: 'border-color 0.2s' }}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="farmer@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input 
              type="password" 
              required 
              className="input-dark"
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--sheet)', padding: '1rem', fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', transition: 'border-color 0.2s' }}
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
            style={{ background: 'var(--sheet)', color: 'var(--proof)', border: 'none', padding: '1.1rem', borderRadius: '4px', fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {loading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Log In')}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '2.5rem 0', textAlign: 'center' }}>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--proof)', padding: '0 1rem', color: 'var(--graphite)', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace" }}>OR</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--sheet)', padding: '1.1rem', fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s' }}
          onMouseOver={e => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--graphite)' }}>
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button 
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--sheet)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 500 }}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button 
                onClick={() => setMode('signup')}
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
