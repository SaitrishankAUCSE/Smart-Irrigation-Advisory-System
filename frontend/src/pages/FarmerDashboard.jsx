import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getFields, addField, deleteField, logUserAction } from '../services/dataService';
import { useReveal, useStagger } from '../hooks/useReveal';
import PleatCanvas from '../components/PleatCanvas';

export default function FarmerDashboard() {
  const { currentUser } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('All');
  const [deletingId, setDeletingId] = useState(null);

  const [newField, setNewField] = useState({
    name: '', crop_type: 'Rice', area_acres: 1.0, current_growth_stage: 'Vegetative', soil_type: 'Loamy Soil'
  });

  useReveal();
  useStagger();

  const fetchFields = async () => {
    if (!currentUser) return;
    try {
      const data = await getFields(currentUser.uid);
      setFields(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [currentUser]);

  const handleAddField = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addField({
        ...newField,
        user_id: currentUser.uid,
        username: currentUser.name,
      });
      logUserAction(currentUser.uid, 'field_registered', { field_name: newField.name, crop: newField.crop_type });
      setNewField({ name: '', crop_type: 'Rice', area_acres: 1.0, current_growth_stage: 'Vegetative', soil_type: 'Loamy Soil' });
      fetchFields();
    } catch (err) {
      console.error(err);
      alert("Failed to add field");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this field plot?")) {
      setDeletingId(id);
      try {
        await deleteField(id);
        fetchFields();
      } catch (err) {
        console.error(err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredFields = fields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrop = selectedCropFilter === 'All' || field.crop_type === selectedCropFilter;
    return matchesSearch && matchesCrop;
  });

  if (!currentUser) return null;

  if (loading) return (
    <div style={{ backgroundColor: 'var(--proof)', color: 'var(--sheet)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace" }}>
      Loading telemetry...
    </div>
  );

  const totalAcres = fields.reduce((sum, f) => sum + (f.area_acres || 0), 0);
  const cropVarieties = [...new Set(fields.map(f => f.crop_type))].length;

  return (
    <div style={{ backgroundColor: 'var(--proof)', color: 'var(--sheet)', minHeight: '100vh', fontFamily: "'Instrument Sans', sans-serif" }}>
      {/* 1. HERO SECTION — Pleat canvas with overlaid statement */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: 'var(--proof)' }}>
        {/* Animated fabric-fold canvas */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <PleatCanvas brandText="AgriSense" />
        </div>

        {/* Left-side text scrim gradient for readability */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(90deg, rgba(13,13,12,.58) 0%, rgba(13,13,12,.52) 46%, rgba(13,13,12,.30) 72%, rgba(13,13,12,0) 92%)'
        }} />

        {/* Statement text overlay */}
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

        {/* Bottom cues */}
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

      <div className="moire" />

      {/* 2. STATS SECTION */}
      <section className="band wrap" data-reveal>
        <div className="head">
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite)', display: 'block', marginBottom: '0.5rem' }}>Overview</span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>Your farm at a glance.</h2>
        </div>
        <div className="foot-ledger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', borderTop: '1px solid var(--graphite)', paddingTop: '1.5rem', marginTop: '2rem' }}>
          <div>
            <div style={{ color: 'var(--graphite)', fontSize: '0.85rem', fontFamily: "'DM Mono', monospace", marginBottom: '0.5rem' }}>Total Plots</div>
            <div style={{ fontSize: '2rem', fontFamily: "'Instrument Serif', serif" }}>{fields.length}</div>
          </div>
          <div>
            <div style={{ color: 'var(--graphite)', fontSize: '0.85rem', fontFamily: "'DM Mono', monospace", marginBottom: '0.5rem' }}>Total Acreage</div>
            <div style={{ fontSize: '2rem', fontFamily: "'Instrument Serif', serif" }}>{totalAcres.toFixed(1)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--graphite)', fontSize: '0.85rem', fontFamily: "'DM Mono', monospace", marginBottom: '0.5rem' }}>Crop Varieties</div>
            <div style={{ fontSize: '2rem', fontFamily: "'Instrument Serif', serif" }}>{cropVarieties}</div>
          </div>
          <div>
            <div style={{ color: 'var(--graphite)', fontSize: '0.85rem', fontFamily: "'DM Mono', monospace", marginBottom: '0.5rem' }}>Engine Status</div>
            <div style={{ fontSize: '1.25rem', fontFamily: "'DM Mono', monospace", color: 'var(--accent)' }}>Active</div>
          </div>
        </div>
      </section>

      <div className="moire" />

      {/* 3. FIELD PLOTS SECTION */}
      <section className="band wrap" id="plots-section" data-reveal>
        <div className="head">
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite)', display: 'block', marginBottom: '0.5rem' }}>Plots</span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>Field plots under advisory.</h2>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Search plots..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-dark"
            style={{ flex: 1, background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
          />
          <select 
            value={selectedCropFilter}
            onChange={e => setSelectedCropFilter(e.target.value)}
            className="select-dark"
            style={{ background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
          >
            <option value="All">All Crops</option>
            <option value="Rice">Rice</option>
            <option value="Maize">Maize</option>
            <option value="Chili">Chili</option>
            <option value="Wheat">Wheat</option>
            <option value="Cotton">Cotton</option>
            <option value="Sugarcane">Sugarcane</option>
          </select>
        </div>

        <div className="big-rows" data-stagger style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredFields.map(field => (
            <Link 
              key={field.id} 
              to={`/field/${field.id}`} 
              className="big-row"
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '2rem 0', 
                borderBottom: '1px solid var(--graphite)',
                textDecoration: 'none',
                color: 'var(--sheet)',
                opacity: 0.72,
                transition: 'opacity 0.3s'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.opacity = 1; 
                e.currentTarget.style.backgroundImage = 'radial-gradient(var(--accent) 1px, transparent 1px)'; 
                e.currentTarget.style.backgroundSize = '20px 20px'; 
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.opacity = 0.72; 
                e.currentTarget.style.backgroundImage = 'none'; 
              }}
            >
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem' }}>
                {field.name}
              </div>
              <div className="arrow" style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--sheet)' }}>
                <span>{field.crop_type}</span>
                <span>{field.current_growth_stage}</span>
                <span>{field.area_acres} Acres</span>
                <button 
                  onClick={(e) => handleDeleteField(field.id, e)}
                  disabled={deletingId === field.id}
                  style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontFamily: "'DM Mono', monospace", position: 'relative', zIndex: 2 }}
                >
                  [Delete]
                </button>
              </div>
            </Link>
          ))}
          {filteredFields.length === 0 && (
            <div style={{ padding: '4rem 0', textAlign: 'center', fontFamily: "'DM Mono', monospace", color: 'var(--graphite)' }}>
              No field plots found.
            </div>
          )}
        </div>
      </section>

      <div className="moire" />

      {/* 4. ADD FIELD SECTION */}
      <section className="band wrap" id="add-field-section" data-reveal>
        <div className="head">
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite)', display: 'block', marginBottom: '0.5rem' }}>Register</span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>Add a new field plot.</h2>
        </div>

        <form onSubmit={handleAddField} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Field Name</label>
            <input 
              type="text" 
              required 
              className="input-dark"
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
              value={newField.name} 
              onChange={e => setNewField({...newField, name: e.target.value})} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Crop Variety</label>
            <select 
              className="select-dark"
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
              value={newField.crop_type} 
              onChange={e => setNewField({...newField, crop_type: e.target.value})}
            >
              <option value="Rice" style={{background: 'var(--proof)'}}>Rice</option>
              <option value="Maize" style={{background: 'var(--proof)'}}>Maize</option>
              <option value="Chili" style={{background: 'var(--proof)'}}>Chili</option>
              <option value="Wheat" style={{background: 'var(--proof)'}}>Wheat</option>
              <option value="Cotton" style={{background: 'var(--proof)'}}>Cotton</option>
              <option value="Sugarcane" style={{background: 'var(--proof)'}}>Sugarcane</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Area (Acres)</label>
            <input 
              type="number" 
              step="0.1" 
              min="0.1" 
              required 
              className="input-dark"
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
              value={newField.area_acres} 
              onChange={e => setNewField({...newField, area_acres: parseFloat(e.target.value) || 0})} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Growth Stage</label>
            <select 
              className="select-dark"
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--graphite)', color: 'var(--sheet)', padding: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
              value={newField.current_growth_stage} 
              onChange={e => setNewField({...newField, current_growth_stage: e.target.value})}
            >
              <option value="Germination" style={{background: 'var(--proof)'}}>Germination</option>
              <option value="Vegetative" style={{background: 'var(--proof)'}}>Vegetative</option>
              <option value="Flowering" style={{background: 'var(--proof)'}}>Flowering</option>
              <option value="Maturity" style={{background: 'var(--proof)'}}>Maturity</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
            <button 
              type="submit" 
              disabled={saving} 
              className="btn-accent"
              style={{ background: 'var(--accent)', color: 'var(--sheet)', border: 'none', padding: '1rem 2rem', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {saving ? 'Registering...' : 'Save Field Profile'}
            </button>
          </div>
        </form>
      </section>

      {/* 6. FOOTER */}
      <footer className="site-foot wrap" style={{ padding: '4rem 0 2rem 0', borderTop: '1px solid var(--graphite)', marginTop: '4rem' }}>
        <div className="foot-tail" style={{ display: 'flex', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)' }}>
          AgriSense · Quantum Coders · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
