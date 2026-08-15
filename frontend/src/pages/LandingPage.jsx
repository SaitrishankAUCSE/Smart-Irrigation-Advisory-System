import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useReveal, useStagger } from '../hooks/useReveal';
import PleatCanvas from '../components/PleatCanvas';
import PoolCanvas from '../components/PoolCanvas';
import AuthModal from '../components/AuthModal';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { currentUser } = useAuth();
  const [openIncluded, setOpenIncluded] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useReveal({}, []);
  useStagger([]);

  return (
    <div style={{ backgroundColor: 'var(--proof)', color: 'var(--sheet)', minHeight: '100vh', fontFamily: "'Instrument Sans', sans-serif" }}>
      {/* 1. HERO SECTION */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: 'var(--proof)' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <PleatCanvas brandText="AgriSense" />
        </div>

        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(90deg, rgba(13,13,12,.68) 0%, rgba(13,13,12,.55) 46%, rgba(13,13,12,.30) 72%, rgba(13,13,12,0) 95%)'
        }} />

        <div style={{
          position: 'absolute', left: 'var(--gap)', top: '46%', transform: 'translateY(-50%)',
          maxWidth: '15ch', zIndex: 2, pointerEvents: 'none',
          fontFamily: "'Instrument Serif', serif",
          fontSize: 'clamp(34px, 10vw, 172px)',
          lineHeight: '.96', letterSpacing: '-.04em',
        }}>
          <span>Precision irrigation</span>
          <em style={{ fontStyle: 'normal', color: 'inherit', opacity: '.72', display: 'block' }}>
            for every acre.
          </em>
        </div>

        {/* ATTRACTIVE CENTER BHOOMI MATRIX ACTION BUTTON WITH CURLY ARROW */}
        <div style={{
          position: 'absolute',
          right: 'clamp(20px, 10vw, 140px)',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Curly Arrow Indicator & Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', transform: 'rotate(-5deg)' }}>
            <span style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontSize: '1.45rem',
              color: '#4EC97A',
              letterSpacing: '0.02em',
              textShadow: '0 0 20px rgba(78, 201, 122, 0.45)'
            }}>
              Get Started
            </span>
            <svg width="48" height="38" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10 C 24 2, 48 8, 42 26 C 38 38, 20 36, 26 24 C 30 16, 48 24, 52 40" stroke="#4EC97A" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 3" />
              <path d="M44 34 L 52 40 L 42 43" stroke="#4EC97A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Main Glowing Button */}
          {currentUser ? (
            <Link
              to="/bhoomi"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(234, 232, 225, 0.08)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(78, 201, 122, 0.6)',
                color: 'var(--sheet)',
                padding: '16px 28px',
                borderRadius: '100px',
                textDecoration: 'none',
                fontFamily: "'DM Mono', monospace",
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 25px rgba(78, 201, 122, 0.25)',
                transition: 'all 0.3s cubic-bezier(.2, .7, .2, 1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--sheet)';
                e.currentTarget.style.color = 'var(--proof)';
                e.currentTarget.style.borderColor = 'var(--sheet)';
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(0, 0, 0, 0.8), 0 0 35px rgba(78, 201, 122, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(234, 232, 225, 0.08)';
                e.currentTarget.style.color = 'var(--sheet)';
                e.currentTarget.style.borderColor = 'rgba(78, 201, 122, 0.6)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 25px rgba(78, 201, 122, 0.25)';
              }}
            >
              <Sparkles size={16} color="#4EC97A" />
              <span>Enter Bhoomi Matrix</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(234, 232, 225, 0.08)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(78, 201, 122, 0.6)',
                color: 'var(--sheet)',
                padding: '16px 28px',
                borderRadius: '100px',
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 25px rgba(78, 201, 122, 0.25)',
                transition: 'all 0.3s cubic-bezier(.2, .7, .2, 1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--sheet)';
                e.currentTarget.style.color = 'var(--proof)';
                e.currentTarget.style.borderColor = 'var(--sheet)';
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(0, 0, 0, 0.8), 0 0 35px rgba(78, 201, 122, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(234, 232, 225, 0.08)';
                e.currentTarget.style.color = 'var(--sheet)';
                e.currentTarget.style.borderColor = 'rgba(78, 201, 122, 0.6)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 25px rgba(78, 201, 122, 0.25)';
              }}
            >
              <Sparkles size={16} color="#4EC97A" />
              <span>Enter Bhoomi Matrix</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>

        <div style={{
          position: 'absolute', zIndex: 2,
          left: 'var(--gap)', right: 'var(--gap)', bottom: '22px',
          display: 'flex', justifyContent: 'space-between', gap: '20px',
          fontSize: 'var(--chrome)', color: 'var(--graphite)', pointerEvents: 'none',
          fontFamily: "'DM Mono', monospace", textTransform: 'uppercase',
        }}>
          <span>AgriSense · Quantum Coders</span>
          <span>{new Date().getFullYear()} Season</span>
        </div>
      </section>

      {/* 2. ADVISORY METRICS SECTION */}
      <div className="moire" />
      <section className="voice wrap" data-reveal>
        <div className="head">
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite)', display: 'block', marginBottom: '0.5rem' }}>Metrics</span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>Key advisory datapoints.</h2>
        </div>
        <div className="face-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
          {['Soil Moisture', 'Evapotranspiration', 'Crop Growth Stage', 'Climate Data'].map((metric, idx) => (
            <div key={idx} className="face" style={{ borderTop: '1px solid var(--graphite)', paddingTop: '1.5rem', fontFamily: "'DM Mono', monospace", fontSize: '1.25rem' }}>
              {metric}
            </div>
          ))}
        </div>
      </section>

      {/* 3. INCLUDED FEATURES SECTION */}
      <div className="moire" />
      <section className="band wrap" data-reveal>
        <div className="head">
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite)', display: 'block', marginBottom: '0.5rem' }}>Included</span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>Included in AgriSense</h2>
        </div>
        <div className="panels" style={{ marginTop: '2rem', borderTop: '1px solid rgba(234, 232, 225, 0.16)' }}>
          {[
            {
              num: '1', title: 'Precision FAO-56 Modeling',
              desc: 'Dual-crop coefficient calculations integrating real-time weather data and growth stages to calculate exact millimeter water requirements.'
            },
            {
              num: '2', title: 'Multi-language Voice Synthesis',
              desc: 'Audio speech advisories in 8 Indian regional languages including Telugu, Hindi, Tamil, Kannada, Marathi, Bengali, and Gujarati.'
            },
            {
              num: '3', title: 'Real-time Plot Tracking',
              desc: 'Track soil volumetric water content against critical moisture depletion thresholds per crop and phenological growth cycle.'
            },
            {
              num: '4', title: 'Cloud Data Platform',
              desc: 'Seamless real-time synchronization with Firebase Authentication and Firestore security rules.'
            },
            {
              num: '5', title: 'Water Conservation Analytics',
              desc: 'Comprehensive historical reporting with adherence scoring, conservation grading, and downloadable intelligence logs.'
            }
          ].map((panel, idx) => (
            <div key={idx} className={`panel ${openIncluded === idx ? 'panel-open' : ''}`} style={{ borderBottom: '1px solid rgba(234, 232, 225, 0.16)', padding: '1.5rem 0' }}>
              <div 
                className="p-head" 
                onClick={() => setOpenIncluded(openIncluded === idx ? null : idx)}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
              >
                <span className="p-num" style={{ fontFamily: "'DM Mono', monospace", color: 'var(--graphite)', width: '40px' }}>{panel.num}</span>
                <span className="p-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', flex: 1 }}>{panel.title}</span>
                <span className="p-toggle" style={{ fontFamily: "'DM Mono', monospace", color: 'var(--graphite)', fontSize: '1.25rem' }}>{openIncluded === idx ? '−' : '+'}</span>
              </div>
              {openIncluded === idx && (
                <div className="p-body" style={{ marginTop: '1rem', paddingLeft: '40px', color: 'var(--graphite)', lineHeight: 1.6 }}>
                  <p>{panel.desc}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. PROCESS SECTION */}
      <div className="moire" />
      <section className="work" data-reveal style={{ backgroundColor: 'var(--sheet)', color: 'var(--proof)', padding: '6rem 0' }}>
        <div className="wrap">
          <div className="head" style={{ borderBottom: '1px solid rgba(13, 13, 12, 0.15)', paddingBottom: '2rem' }}>
            <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite-ink)', display: 'block', marginBottom: '0.5rem' }}>Process</span>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>Five steps to precision.</h2>
          </div>
          <div className="work-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
            {[
              { num: '01', title: 'Register your plot', desc: 'Define your crop variety, land area, and growth stage.' },
              { num: '02', title: 'Log readings', desc: 'Input soil moisture telemetry from IoT or manual tests.' },
              { num: '03', title: 'Receive AI advisory', desc: 'FAO-56 engine computes exact irrigation run-time in mm and minutes.' },
              { num: '04', title: 'Take action', desc: 'Execute recommended pump operations with one click.' },
              { num: '05', title: 'Track usage', desc: 'Monitor seasonal water conservation and adherence scores.' }
            ].map((step, idx) => (
              <div key={idx} className="work-step">
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite-ink)', marginBottom: '1rem' }}>{step.num}</div>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', marginBottom: '0.5rem' }}>{step.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--graphite-ink)', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <div className="moire" />
      <section className="band wrap" data-reveal>
        <div className="head">
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite)', display: 'block', marginBottom: '0.5rem' }}>Questions</span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>Before you plant.</h2>
        </div>
        <div className="panels" style={{ marginTop: '2rem', borderTop: '1px solid rgba(234, 232, 225, 0.16)' }}>
          {[
            {
              q: 'What crops are currently supported?',
              a: 'AgriSense supports rice, maize, chili, wheat, cotton, and sugarcane with specialized crop coefficients (Kc) for germination, vegetative, flowering, and maturity stages.'
            },
            {
              q: 'How is evapotranspiration calculated?',
              a: 'We use the standardized FAO-56 Penman-Monteith equation combining temperature, solar radiation, humidity, and wind speed.'
            },
            {
              q: 'Does it work offline?',
              a: 'Yes, AgriSense utilizes an offline-first storage model with local fallback caching when internet connectivity is intermittent.'
            }
          ].map((faq, idx) => (
            <div key={idx} className={`panel ${openFaq === idx ? 'panel-open' : ''}`} style={{ borderBottom: '1px solid rgba(234, 232, 225, 0.16)', padding: '1.5rem 0' }}>
              <div 
                className="p-head" 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
              >
                <span className="p-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', flex: 1 }}>{faq.q}</span>
                <span className="p-toggle" style={{ fontFamily: "'DM Mono', monospace", color: 'var(--graphite)', fontSize: '1.25rem' }}>{openFaq === idx ? '−' : '+'}</span>
              </div>
              {openFaq === idx && (
                <div className="p-body" style={{ marginTop: '1rem', color: 'var(--graphite)', lineHeight: 1.6 }}>
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. FOOTER POOL CANVAS */}
      <div className="moire" />
      <section style={{ position: 'relative', height: '80vh', minHeight: '500px', overflow: 'hidden', background: 'var(--proof)' }}>
        <PoolCanvas brandText="AgriSense" />
        <div style={{
          position: 'absolute', bottom: '24px', left: 'var(--gap)', right: 'var(--gap)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--graphite)'
        }}>
          <span>AgriSense · Precision Irrigation Advisory</span>
          <span>© {new Date().getFullYear()} Quantum Coders</span>
        </div>
      </section>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
