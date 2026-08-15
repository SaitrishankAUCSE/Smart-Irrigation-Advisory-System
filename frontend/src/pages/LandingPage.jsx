import React, { useState } from 'react';
import { useReveal, useStagger } from '../hooks/useReveal';
import PleatCanvas from '../components/PleatCanvas';
import PoolCanvas from '../components/PoolCanvas';

export default function LandingPage() {
  const [openIncluded, setOpenIncluded] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

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
          background: 'linear-gradient(90deg, rgba(13,13,12,.58) 0%, rgba(13,13,12,.52) 46%, rgba(13,13,12,.30) 72%, rgba(13,13,12,0) 92%)'
        }} />

        <div style={{
          position: 'absolute', left: 'var(--gap)', top: '46%', transform: 'translateY(-50%)',
          maxWidth: '15ch', zIndex: 2, pointerEvents: 'none',
          fontFamily: "'Instrument Serif', serif",
          fontSize: 'clamp(34px, 11vw, 186px)',
          lineHeight: '.96', letterSpacing: '-.04em',
        }}>
          <span>Precision irrigation</span>
          <em style={{ fontStyle: 'normal', color: 'inherit', opacity: '.72', display: 'block' }}>
            for every acre.
          </em>
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
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#ff4d4d', display: 'block', marginBottom: '0.5rem' }}>Included</span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal', color: '#ff4d4d' }}>Included in AgriSense</h2>
        </div>
        <div className="panels" style={{ marginTop: '3rem' }}>
          {['Precision FAO-56 Modeling', 'Multi-language Voice Synthesis', 'Real-time Plot Tracking', 'Offline-first Storage', 'Water Conservation Analytics'].map((panel, idx) => (
            <div key={idx} className="panel" style={{ borderBottom: '1px solid #ff4d4d' }}>
              <button 
                onClick={() => setOpenIncluded(openIncluded === idx ? null : idx)} 
                style={{ background: 'transparent', border: 'none', color: '#ff4d4d', width: '100%', textAlign: 'left', padding: '1.5rem 0', fontFamily: "'DM Mono', monospace", fontSize: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              >
                <span>{idx + 1}. {panel}</span>
                <span>{openIncluded === idx ? '−' : '+'}</span>
              </button>
              {openIncluded === idx && (
                <div style={{ padding: '0 0 1.5rem 0', color: '#ff4d4d', opacity: 0.8, fontFamily: "'Instrument Sans', sans-serif" }}>
                  Seamless integration of {panel.toLowerCase()} to optimize your farming yield.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. PROCESS SECTION */}
      <div className="moire" />
      <section className="work wrap" data-reveal style={{ background: 'var(--sheet)', color: 'var(--proof)', padding: '4rem var(--gap)', margin: '4rem 0' }}>
        <div className="head">
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite)', display: 'block', marginBottom: '0.5rem' }}>Process</span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>Five steps, and you decide at the third.</h2>
        </div>
        <div className="rows" style={{ marginTop: '3rem' }}>
          {['Register your plot', 'Log moisture readings', 'Receive AI advisory', 'Take action', 'Track usage'].map((step, idx) => (
            <div key={idx} className="row" style={{ padding: '2rem 0', borderBottom: '1px solid var(--graphite)', display: 'flex', gap: '3rem', alignItems: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.25rem', color: 'var(--graphite)' }}>0{idx + 1}</span>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem' }}>{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="band wrap" data-reveal style={{ marginBottom: '4rem' }}>
        <div className="head">
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite)', display: 'block', marginBottom: '0.5rem' }}>Questions</span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>Before you plant.</h2>
        </div>
        <div className="panels" style={{ marginTop: '3rem' }}>
          {[
            { q: "What crops are supported?", a: "We support a wide variety of crops including Rice, Maize, Wheat, Cotton, and Sugarcane." },
            { q: "How is evapotranspiration calculated?", a: "We use the FAO-56 Penman-Monteith method combined with real-time local climate data." },
            { q: "Can I use it offline?", a: "Yes, our offline-first storage ensures you can log readings even without internet access." }
          ].map((faq, idx) => (
            <div key={idx} className="panel" style={{ borderBottom: '1px solid var(--graphite)' }}>
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--sheet)', width: '100%', textAlign: 'left', padding: '1.5rem 0', fontFamily: "'DM Mono', monospace", fontSize: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              >
                <span>{faq.q}</span>
                <span>{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div style={{ padding: '0 0 1.5rem 0', color: 'var(--sheet)', opacity: 0.8, fontFamily: "'Instrument Sans', sans-serif" }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. FOOTER / POOL */}
      <div className="pool-wrap" style={{ position: 'relative', height: '60vh', overflow: 'hidden' }}>
        <PoolCanvas brandText="AgriSense" />
        <footer style={{ position: 'absolute', bottom: '2rem', left: '0', right: '0', display: 'flex', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', zIndex: 10 }}>
          AgriSense · Quantum Coders · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
