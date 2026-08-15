import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getIrrigationLogs, toDate } from '../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useReveal } from '../hooks/useReveal';

export default function WaterUsageDashboard() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [usageData, setUsageData] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [totalWater, setTotalWater] = useState(0);
  const [readingsCount, setReadingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useReveal();

  useEffect(() => {
    if (currentUser) fetchAnalytics();
  }, [id, currentUser]);

  const fetchAnalytics = async () => {
    try {
      const logs = await getIrrigationLogs(id);
      
      const usageDict = {};
      let adheredCount = 0;
      let total = 0;
      
      for (const log of logs) {
        const dateStr = toDate(log.logged_at).toLocaleDateString();
        usageDict[dateStr] = (usageDict[dateStr] || 0) + (log.actual_amount_mm || 0);
        total += (log.actual_amount_mm || 0);

        const r = log.recommendation;
        const a = log.action_taken;
        if ((r === 'irrigate' && a === 'irrigated') || (r === 'wait' && a === 'skipped')) {
          adheredCount++;
        }
      }
      
      setUsageData(Object.entries(usageDict).map(([date, amount]) => ({ date, actual_amount_mm: amount })));
      setAdherence(logs.length > 0 ? Math.round((adheredCount / logs.length) * 100) : 100);
      setTotalWater(Math.round(total * 10) / 10);
      setReadingsCount(logs.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;
  if (loading) return (
    <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0D0D0C', color: '#EAE8E1' }}>
      <div style={{ fontFamily: "'DM Mono', monospace" }}>Loading...</div>
    </div>
  );

  return (
    <div className="wrap" style={{ backgroundColor: '#0D0D0C', color: '#EAE8E1', fontFamily: "'Instrument Sans', sans-serif", minHeight: '100vh', padding: '40px' }}>
      <div className="band" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '60px' }} data-reveal>
          <Link to={`/field/${id}`} style={{ color: '#8A877E', textDecoration: 'none', marginBottom: '24px', display: 'inline-block', fontFamily: "'Instrument Sans', sans-serif" }}>
            ← Back to Field {id}
          </Link>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: '0', fontWeight: 'normal', color: '#EAE8E1' }}>
            Water Telemetry & Analytics
          </h1>
        </div>

        {/* STATS SECTION */}
        <div className="head" style={{ marginBottom: '32px' }} data-reveal>
          <div className="label" style={{ color: '#8A877E', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Analytics
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: '0', fontWeight: 'normal' }}>
            Water usage intelligence.
          </h2>
        </div>

        <div className="foot-ledger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '60px' }} data-reveal>
          <div>
            <div style={{ color: '#8A877E', fontSize: '0.9rem', marginBottom: '12px' }}>Total Water Applied</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.75rem', color: '#EAE8E1' }}>{totalWater} mm</div>
          </div>
          <div>
            <div style={{ color: '#8A877E', fontSize: '0.9rem', marginBottom: '12px' }}>Advisory Adherence</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.75rem', color: '#EAE8E1' }}>{adherence}%</div>
          </div>
          <div>
            <div style={{ color: '#8A877E', fontSize: '0.9rem', marginBottom: '12px' }}>Conservation Grade</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.75rem', color: '#3DA667' }}>
              {adherence >= 80 ? 'Grade A+' : 'Good'}
            </div>
          </div>
          <div>
            <div style={{ color: '#8A877E', fontSize: '0.9rem', marginBottom: '12px' }}>Readings Count</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.75rem', color: '#EAE8E1' }}>{readingsCount}</div>
          </div>
        </div>

        <div className="moire" style={{ height: '1px', background: 'var(--rule, #333)', margin: '60px 0' }} data-reveal></div>

        {/* CHART SECTION */}
        <div className="head" style={{ marginBottom: '32px' }} data-reveal>
          <div className="label" style={{ color: '#8A877E', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Trend
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: '0', fontWeight: 'normal' }}>
            Daily water consumption.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(250px, 300px)', gap: '60px', marginBottom: '60px' }} data-reveal>
          <div style={{ height: '350px' }}>
            {usageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--rule, #333)" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#8A877E', fontFamily: "'DM Mono', monospace"}} axisLine={{stroke: '#8A877E'}} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#8A877E', fontFamily: "'DM Mono', monospace"}} axisLine={{stroke: '#8A877E'}} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(234,232,225,0.05)'}} 
                    contentStyle={{backgroundColor: '#1a1a19', borderRadius: '8px', border: '1px solid #333', color: '#EAE8E1', fontFamily: "'DM Mono', monospace", fontSize: '13px'}} 
                  />
                  <Bar dataKey="actual_amount_mm" fill="#2D7A4F" radius={[4, 4, 0, 0]} name="Water (mm)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A877E', fontFamily: "'DM Mono', monospace" }}>
                No records available
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="100" cy="100" r="85" stroke="rgba(234,232,225,.1)" strokeWidth="12" fill="none" />
                <circle 
                  cx="100" cy="100" r="85" 
                  stroke="#2D7A4F" 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray={`${2 * Math.PI * 85}`}
                  strokeDashoffset={(2 * Math.PI * 85) * (1 - ((adherence || 0) / 100))}
                  strokeLinecap="round" 
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '2.5rem', color: '#EAE8E1' }}>{adherence !== null ? adherence : '--'}%</span>
              </div>
            </div>
            <div style={{ color: '#8A877E', marginTop: '24px', fontSize: '1rem', fontFamily: "'Instrument Sans', sans-serif" }}>Adherence Score</div>
          </div>
        </div>

        <div className="moire" style={{ height: '1px', background: 'var(--rule, #333)', margin: '60px 0' }} data-reveal></div>

        <div data-reveal style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '80px' }}>
          <button 
            className="btn-ghost"
            onClick={() => window.print()}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: 'transparent', 
              border: '1px solid #8A877E', 
              color: '#EAE8E1', 
              cursor: 'pointer', 
              fontFamily: "'Instrument Sans', sans-serif", 
              fontSize: '1rem',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
          >
            Export Report
          </button>
        </div>

        <footer className="site-foot" style={{ borderTop: '1px solid var(--rule, #333)', paddingTop: '32px' }} data-reveal>
          <div className="foot-tail" style={{ color: '#8A877E', fontSize: '0.9rem', fontFamily: "'Instrument Sans', sans-serif" }}>
            AgriSense · Quantum Coders
          </div>
        </footer>

      </div>
    </div>
  );
}
