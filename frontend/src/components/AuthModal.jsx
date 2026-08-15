import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { X } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [mode, setMode] = useState('signup'); // 'login' or 'signup'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      login(name);
      onClose();
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
              ? 'Enter your name to create your farm profile.'
              : 'Enter your name to access your dashboard.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>
              Full Name
            </label>
            <input 
              type="text" 
              required 
              autoFocus
              className="input-dark"
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. John Doe"
            />
          </div>

          <button 
            type="submit" 
            className="btn-accent"
            style={{ background: 'var(--accent)', color: 'var(--sheet)', border: 'none', padding: '1rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            {mode === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        </form>

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
