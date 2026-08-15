import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { X } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signup'); // 'login' or 'signup'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      console.error(err);
      // Clean up firebase error messages a bit
      const msg = err.message.replace('Firebase: ', '').replace(/\\([^)]+\\)/, '').trim();
      setError(msg || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(13,13,12,0.8)', backdropFilter: 'blur(8px)',
        fontFamily: "'Instrument Sans', sans-serif"
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
          border: '1px solid var(--graphite)',
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: '420px',
          color: 'var(--sheet)',
          borderRadius: '4px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'transparent', border: 'none', color: 'var(--graphite)',
            cursor: 'pointer', transition: 'color 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--sheet)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--graphite)'}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: 0, fontWeight: 'normal' }}>
            {mode === 'signup' ? 'Get Started' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--graphite)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {mode === 'signup' 
              ? 'Create a secure account to access your dashboard.'
              : 'Sign in to access your dashboard.'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.85rem', fontFamily: "'DM Mono', monospace" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>
              Email Address
            </label>
            <input 
              type="email" 
              required 
              autoFocus
              className="input-dark"
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="farmer@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>
              Password
            </label>
            <input 
              type="password" 
              required 
              className="input-dark"
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
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
            style={{ background: 'var(--accent)', color: 'var(--sheet)', border: 'none', padding: '1rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Log In')}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '2rem 0', textAlign: 'center' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--graphite)', margin: 0 }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--proof)', padding: '0 1rem', color: 'var(--graphite)', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace" }}>OR</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{ width: '100%', background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '1rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s' }}
          onMouseOver={e => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--graphite)' }}>
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button 
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--sheet)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button 
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: 'var(--sheet)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
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
