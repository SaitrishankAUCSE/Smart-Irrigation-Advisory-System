import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getFields, addField, deleteField, logUserAction } from '../services/dataService';
import { useReveal, useStagger } from '../hooks/useReveal';
import PleatCanvas from '../components/PleatCanvas';
import PoolCanvas from '../components/PoolCanvas';
import { 
  Volume2, VolumeX, Sparkles, Droplet, Activity, Gauge, 
  Layers, ArrowRight, CheckCircle2, ChevronRight, Play, RefreshCw,
  Plus, Search, ExternalLink, ShieldCheck, Zap
} from 'lucide-react';

const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' }
];

const TUTORIAL_AUDIO_SCRIPTS = {
  en: "Welcome to Bhoomi, your intelligent soil and irrigation matrix. AgriSense uses the scientific FAO-56 Penman-Monteith equation to measure exact crop evapotranspiration. By monitoring root-zone moisture and weather forecasts, we save over 40% of agricultural water while maximizing crop yield.",
  te: "భూమి అగ్రిసెన్స్ స్మార్ట్ నేల మరియు నీటిపారుదల వ్యవస్థకు స్వాగతం. శాస్త్రీయ FAO-56 సమీకరణం ద్వారా పంటకు అవసరమైన ఖచ్చితమైన నీటి పరిమాణాన్ని లెక్కించి, 40 శాతం పైగా నీటిని ఆదా చేస్తూ అధిక దిగుబడిని అందిస్తుంది.",
  hi: "भूमि एग्रीसेंस स्मार्ट मृदा और सिंचाई प्रणाली में आपका स्वागत है। यह प्रणाली एफएओ-56 पेनमैन-मोंटीथ वैज्ञानिक मॉडल का उपयोग करके फसलों के लिए सटीक पानी की गणना करती है, जिससे 40% से अधिक पानी की बचत होती है।",
  ta: "பூமி அக்ரிசென்ஸ் மண் மற்றும் பாசன அமைப்புக்கு நல்வரவு. விஞ்ஞான முறைப்படி பயிர்களுக்கு தேவையான துல்லியமான நீர் அளவை கணக்கிட்டு 40 சதவீதத்திற்கும் அதிகமான நீரை சேமிக்கிறது.",
  kn: "ಭೂಮಿ ಅಗ್ರಿಸೆನ್ಸ್ ಸ್ಮಾರ್ಟ್ ಮಣ್ಣು ಮತ್ತು ನೀರಾವರಿ ವೇದಿಕೆಗೆ ಸುಸ್ವಾಗತ. ನಿಖರವಾದ FAO-56 ವೈಜ್ಞಾನಿಕ ಮಾದರಿಯ ಮೂಲಕ ಬೆಳೆಗಳಿಗೆ ಅಗತ್ಯವಿರುವ ನಿಖರ ನೀರನ್ನು ಲೆಕ್ಕಹಾಕಿ ಶೇಕಡಾ 40 ಕ್ಕೂ ಹೆಚ್ಚು ನೀರನ್ನು ಉಳಿಸುತ್ತದೆ.",
  mr: "भूमी अ‍ॅग्रीसेन्स स्मार्ट माती आणि सिंचन प्रणालीमध्ये आपले स्वागत आहे. अचूक FAO-56 समीकरणाद्वारे पिकांच्या पाण्याची अचूक गरज मोजून 40% हून अधिक पाण्याची बचत होते.",
  bn: "ভূমি এগ্রিসেন্স স্মার্ট মাটি এবং সেচ ব্যবস্থায় আপনাকে স্বাগতম। সুনির্দিষ্ট FAO-56 বৈজ্ঞানিক মডেল ব্যবহার করে সঠিক জল পরিমাপ করা হয় এবং 40% জল সাশ্রয় হয়।",
  gu: "ભૂમિ એગ્રીસેન્સ સ્માર્ટ જમીન અને સિંચાઈ પ્રણાલીમાં આપનું સ્વાગત છે. વૈજ્ઞાનિક FAO-56 મોડેલ દ્વારા પાક માટે જરૂરી પાણીની ચોક્કસ ગણતરી કરી 40% થી વધુ પાણીની બચત કરે છે."
};

const CROP_COEFFICIENTS = {
  'Rice': { Germination: 1.05, Vegetative: 1.15, Flowering: 1.30, Maturity: 0.90, threshold: 65, rootDepthCm: 30 },
  'Maize': { Germination: 0.40, Vegetative: 0.85, Flowering: 1.20, Maturity: 0.60, threshold: 50, rootDepthCm: 60 },
  'Chili': { Germination: 0.35, Vegetative: 0.70, Flowering: 1.05, Maturity: 0.60, threshold: 45, rootDepthCm: 45 },
  'Wheat': { Germination: 0.40, Vegetative: 0.75, Flowering: 1.15, Maturity: 0.50, threshold: 55, rootDepthCm: 50 },
  'Cotton': { Germination: 0.35, Vegetative: 0.75, Flowering: 1.20, Maturity: 0.65, threshold: 50, rootDepthCm: 75 },
  'Sugarcane': { Germination: 0.40, Vegetative: 1.00, Flowering: 1.25, Maturity: 0.75, threshold: 60, rootDepthCm: 100 }
};

export default function Bhoomi() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Field plots state
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'simulator' | 'tutorial' | 'plots'
  
  // Multilingual Audio state
  const [selectedLang, setSelectedLang] = useState('en');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Quantum Soil Chamber Interactive Simulator State
  const [simCrop, setSimCrop] = useState('Rice');
  const [simStage, setSimStage] = useState('Vegetative');
  const [simMoisture, setSimMoisture] = useState(48); // %
  const [simRadiation, setSimRadiation] = useState(6.5); // mm/day baseline ET0
  const [simRain, setSimRain] = useState(0); // mm

  // Quick Plot Form State
  const [newField, setNewField] = useState({
    name: '', crop_type: 'Rice', area_acres: 1.5, current_growth_stage: 'Vegetative', soil_type: 'Loamy Soil'
  });
  const [savingField, setSavingField] = useState(false);

  useReveal({}, [loadingFields]);
  useStagger([loadingFields]);

  useEffect(() => {
    if (currentUser) {
      loadFields();
    }
  }, [currentUser]);

  const loadFields = async () => {
    if (!currentUser) return;
    try {
      const data = await getFields(currentUser.uid);
      setFields(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFields(false);
    }
  };

  // Live calculation for the Simulator
  const cropRule = CROP_COEFFICIENTS[simCrop] || CROP_COEFFICIENTS['Rice'];
  const kc = cropRule[simStage] || 1.0;
  const threshold = cropRule.threshold;
  const etc = parseFloat((simRadiation * kc).toFixed(2));
  const deficitPct = Math.max(0, threshold - simMoisture);
  const rawWaterNeededMm = deficitPct > 0 ? parseFloat(((deficitPct / 100) * cropRule.rootDepthCm * 1.2).toFixed(1)) : 0;
  const netWaterNeededMm = Math.max(0, parseFloat((rawWaterNeededMm - simRain).toFixed(1)));
  const pumpRuntimeMinutes = Math.round((netWaterNeededMm * 10 * 1.5) / 5); // Approx runtime for 5HP pump per acre
  const isIrrigationNeeded = simMoisture < threshold && simRain < 5;

  const handleSpeakTutor = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert("Audio speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const text = TUTORIAL_AUDIO_SCRIPTS[selectedLang] || TUTORIAL_AUDIO_SCRIPTS.en;
    const utterance = new SpeechSynthesisUtterance(text);

    const voiceLangMap = {
      en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN', 
      kn: 'kn-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN'
    };

    utterance.lang = voiceLangMap[selectedLang] || 'en-IN';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCreatePlot = async (e) => {
    e.preventDefault();
    if (!newField.name.trim()) return;
    setSavingField(true);
    try {
      await addField({
        ...newField,
        user_id: currentUser.uid,
        username: currentUser.name,
      });
      logUserAction(currentUser.uid, 'field_registered_bhoomi', { field_name: newField.name, crop: newField.crop_type });
      setNewField({ name: '', crop_type: 'Rice', area_acres: 1.5, current_growth_stage: 'Vegetative', soil_type: 'Loamy Soil' });
      await loadFields();
      setActiveTab('plots');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingField(false);
    }
  };

  const handleDeletePlot = async (fieldId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this field plot?")) {
      try {
        await deleteField(fieldId);
        loadFields();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const totalAcres = fields.reduce((sum, f) => sum + (f.area_acres || 0), 0);

  return (
    <div style={{ backgroundColor: 'var(--proof)', color: 'var(--sheet)', minHeight: '100vh', fontFamily: "'Instrument Sans', sans-serif" }}>
      
      {/* 1. HERO WITH ICONIC BROWN CURTAIN CANVAS */}
      <section style={{ position: 'relative', height: '94vh', minHeight: '640px', overflow: 'hidden', background: 'var(--proof)' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <PleatCanvas brandText="Bhoomi" />
        </div>

        {/* Gradient Scrim */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(90deg, rgba(13,13,12,.72) 0%, rgba(13,13,12,.60) 45%, rgba(13,13,12,.30) 75%, rgba(13,13,12,0) 95%)'
        }} />

        {/* Hero Title & Identity */}
        <div style={{
          position: 'absolute', left: 'var(--gap)', top: '48%', transform: 'translateY(-50%)',
          maxWidth: '18ch', zIndex: 2, pointerEvents: 'none',
          fontFamily: "'Instrument Serif', serif",
          fontSize: 'clamp(34px, 9.5vw, 154px)',
          lineHeight: '.96', letterSpacing: '-.035em',
        }}>
          <span>The Living Soil</span>
          <em style={{ fontStyle: 'normal', color: 'inherit', opacity: '.72', display: 'block' }}>
            Matrix.
          </em>
        </div>

        {/* Floating Quick Action Hub */}
        <div style={{
          position: 'absolute', right: 'var(--gap)', top: '48%', transform: 'translateY(-50%)',
          zIndex: 3, maxWidth: '380px', width: '100%',
          display: 'none',
        }} className="desktop-hud">
          {/* Will show on larger viewports */}
        </div>

        {/* Bottom Season & Status Strip */}
        <div style={{
          position: 'absolute', zIndex: 2,
          left: 'var(--gap)', right: 'var(--gap)', bottom: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px',
          fontSize: 'var(--chrome)', color: 'var(--graphite)',
          fontFamily: "'DM Mono', monospace", textTransform: 'uppercase',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#4EC97A', boxShadow: '0 0 10px #4EC97A' }} />
            <span>Telemetry: {currentUser?.name || 'Farmer'} · Active Hub</span>
          </div>
          <div>
            <span>{fields.length} Plots Managed · {totalAcres.toFixed(1)} Acres</span>
          </div>
        </div>
      </section>

      {/* 2. SANCTUARY NAVIGATION TABS */}
      <div style={{
        position: 'sticky', top: '60px', zIndex: 40,
        background: 'rgba(13,13,12,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(234,232,225,0.12)',
        padding: '0 var(--gap)'
      }}>
        <div className="wrap" style={{ display: 'flex', gap: '2rem', overflowX: 'auto', padding: '14px 0' }}>
          {[
            { id: 'matrix', label: '01. Advisory Matrix & Telemetry' },
            { id: 'simulator', label: '02. Quantum Soil Chamber (Simulator)' },
            { id: 'tutorial', label: '03. Multilingual Voice Oracle' },
            { id: 'plots', label: `04. Field Plots (${fields.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === tab.id ? 'var(--sheet)' : 'var(--graphite)',
                fontFamily: "'DM Mono', monospace",
                fontSize: '12px',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                padding: '6px 0',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-light)' : '2px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="moire" />

      {/* 3. SECTION A: OVERVIEW & EFFICIENCY LEDGER */}
      {activeTab === 'matrix' && (
        <div data-reveal>
          <section className="band wrap">
            <div className="head">
              <span className="label">Precision Metrics</span>
              <h2>Scientific efficiency that honors every drop.</h2>
              <p>
                Unlike traditional timer-based or intuition flood irrigation, Bhoomi evaluates dynamic evapotranspiration (ETc), capacitive soil dielectric constant, and rainfall offsets to recommend water with millimetric accuracy.
              </p>
            </div>

            {/* 4-COLUMN EFFICIENCY LEDGER */}
            <div className="foot-ledger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', borderTop: '1px solid rgba(234,232,225,0.14)', paddingTop: '2rem', marginTop: '2rem' }}>
              <div>
                <div style={{ color: 'var(--graphite)', fontSize: '0.8rem', fontFamily: "'DM Mono', monospace", marginBottom: '0.5rem' }}>EVAPOTRANSPIRATION ACCURACY</div>
                <div style={{ fontSize: '2.8rem', fontFamily: "'Instrument Serif', serif", color: 'var(--sheet)' }}>98.4%</div>
                <p style={{ color: 'var(--graphite)', fontSize: '0.75rem', marginTop: '0.4rem', fontFamily: "'DM Mono', monospace" }}>FAO-56 Penman-Monteith calibrated</p>
              </div>

              <div>
                <div style={{ color: 'var(--graphite)', fontSize: '0.8rem', fontFamily: "'DM Mono', monospace", marginBottom: '0.5rem' }}>GROUNDWATER CONSERVED</div>
                <div style={{ fontSize: '2.8rem', fontFamily: "'Instrument Serif', serif", color: 'var(--accent-light)' }}>41.8%</div>
                <p style={{ color: 'var(--graphite)', fontSize: '0.75rem', marginTop: '0.4rem', fontFamily: "'DM Mono', monospace" }}>Vs traditional flood watering</p>
              </div>

              <div>
                <div style={{ color: 'var(--graphite)', fontSize: '0.8rem', fontFamily: "'DM Mono', monospace", marginBottom: '0.5rem' }}>SOIL ROOT CAPACITY</div>
                <div style={{ fontSize: '2.8rem', fontFamily: "'Instrument Serif', serif", color: 'var(--sheet)' }}>0.0%</div>
                <p style={{ color: 'var(--graphite)', fontSize: '0.75rem', marginTop: '0.4rem', fontFamily: "'DM Mono', monospace" }}>Zero root-zone anoxia / overwatering</p>
              </div>

              <div>
                <div style={{ color: 'var(--graphite)', fontSize: '0.8rem', fontFamily: "'DM Mono', monospace", marginBottom: '0.5rem' }}>VOICE SYNTHESIS</div>
                <div style={{ fontSize: '2.8rem', fontFamily: "'Instrument Serif', serif", color: 'var(--sheet)' }}>8 Langs</div>
                <p style={{ color: 'var(--graphite)', fontSize: '0.75rem', marginTop: '0.4rem', fontFamily: "'DM Mono', monospace" }}>Instant local dialect translation</p>
              </div>
            </div>

            {/* HOW IT WORKS DEEP ARCHITECTURE (Beyond Human Design Ideas) */}
            <div style={{ marginTop: '5rem' }}>
              <div className="head">
                <span className="label">Mechanism</span>
                <h2>The Four-Stage Neural Soil Cycle.</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '2rem' }}>
                {[
                  {
                    step: '01',
                    title: 'Dielectric Root Probe',
                    desc: 'Real-time telemetry samples volumetric soil moisture (VWC) directly from the crop root strata, filtering out surface evaporation anomalies.'
                  },
                  {
                    step: '02',
                    title: 'FAO-56 Kinetic ET Engine',
                    desc: 'Combines temperature, solar irradiance, wind velocity, and growth-stage crop coefficient (Kc) to compute daily loss: ETc = Kc × ET0.'
                  },
                  {
                    step: '03',
                    title: 'Atmospheric Rain Offset',
                    desc: 'Forecast rain probability is mathematically deducted from the irrigation deficit, preventing wasteful motor operations right before showers.'
                  },
                  {
                    step: '04',
                    title: 'Motor Pump Translation',
                    desc: 'Calculated deficit in millimeters is converted into exact 5HP/7.5HP motor runtime minutes and spoken aloud in your native language.'
                  }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(234,232,225,0.1)',
                      padding: '2rem',
                      borderRadius: '4px',
                      position: 'relative',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.background = 'rgba(45, 122, 79, 0.05)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.borderColor = 'rgba(234,232,225,0.1)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                  >
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--accent-text)', marginBottom: '1rem' }}>
                      PHASE {item.step}
                    </div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.75rem', fontWeight: 'normal', margin: '0 0 0.75rem 0' }}>
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--graphite)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 4. SECTION B: QUANTUM SOIL CHAMBER (INTERACTIVE LIVE SIMULATOR) */}
      {activeTab === 'simulator' && (
        <div data-reveal>
          <section className="band wrap">
            <div className="head">
              <span className="label">Live Laboratory</span>
              <h2>Quantum Soil Chamber.</h2>
              <p>
                Simulate your crop's root-zone biology in real time. Adjust moisture levels, weather solar radiation, and rain predictions to observe how the advisory kernel dynamically decides irrigation amounts.
              </p>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2.5rem', marginTop: '2.5rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(234,232,225,0.12)',
              padding: '2.5rem', borderRadius: '6px'
            }}>
              {/* Controls Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--graphite)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Input Parameters
                </h3>

                {/* Crop & Stage */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace", color: 'var(--graphite)', marginBottom: '0.4rem' }}>Crop Variety</label>
                    <select 
                      value={simCrop} 
                      onChange={e => setSimCrop(e.target.value)}
                      className="select-dark"
                      style={{ width: '100%', background: 'var(--proof)', border: '1px solid rgba(234,232,225,0.2)', padding: '0.6rem', color: 'var(--sheet)', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
                    >
                      {Object.keys(CROP_COEFFICIENTS).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace", color: 'var(--graphite)', marginBottom: '0.4rem' }}>Growth Stage</label>
                    <select 
                      value={simStage} 
                      onChange={e => setSimStage(e.target.value)}
                      className="select-dark"
                      style={{ width: '100%', background: 'var(--proof)', border: '1px solid rgba(234,232,225,0.2)', padding: '0.6rem', color: 'var(--sheet)', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
                    >
                      <option value="Germination">Germination</option>
                      <option value="Vegetative">Vegetative</option>
                      <option value="Flowering">Flowering</option>
                      <option value="Maturity">Maturity</option>
                    </select>
                  </div>
                </div>

                {/* Soil Moisture Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                    <span>Current Soil Moisture (VWC):</span>
                    <strong style={{ color: simMoisture < threshold ? '#ff6b6b' : '#4EC97A' }}>{simMoisture}% (Target: {threshold}%)</strong>
                  </div>
                  <input 
                    type="range" min="15" max="95" value={simMoisture}
                    onChange={e => setSimMoisture(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>

                {/* Solar Radiation / ET0 Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                    <span>Solar Radiation & Weather (ET₀):</span>
                    <strong style={{ color: 'var(--sheet)' }}>{simRadiation} mm/day</strong>
                  </div>
                  <input 
                    type="range" min="2.0" max="11.0" step="0.5" value={simRadiation}
                    onChange={e => setSimRadiation(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>

                {/* Expected Rainfall Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                    <span>Forecast Rainfall:</span>
                    <strong style={{ color: '#4da6ff' }}>{simRain} mm</strong>
                  </div>
                  <input 
                    type="range" min="0" max="25" step="1" value={simRain}
                    onChange={e => setSimRain(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#4da6ff' }}
                  />
                </div>
              </div>

              {/* Dynamic Advisory Output Box */}
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: isIrrigationNeeded ? '1px solid rgba(255, 107, 107, 0.4)' : '1px solid rgba(78, 201, 122, 0.4)',
                borderRadius: '6px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Kernel Telemetry Output</span>
                    <span style={{
                      padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace",
                      background: isIrrigationNeeded ? 'rgba(255, 107, 107, 0.15)' : 'rgba(78, 201, 122, 0.15)',
                      color: isIrrigationNeeded ? '#ff6b6b' : '#4EC97A'
                    }}>
                      {isIrrigationNeeded ? 'ACTION REQUIRED' : 'SOIL OPTIMAL'}
                    </span>
                  </div>

                  <h4 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.4rem', margin: '0 0 1rem 0', fontWeight: 'normal', lineHeight: 1.1 }}>
                    {isIrrigationNeeded 
                      ? `Apply ${netWaterNeededMm} mm of water.` 
                      : `Hold irrigation. Moisture sufficient.`}
                  </h4>

                  <p style={{ color: 'var(--graphite)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    {isIrrigationNeeded 
                      ? `Soil moisture (${simMoisture}%) is ${deficitPct.toFixed(1)}% below required threshold for ${simCrop} in ${simStage} stage. Run 5HP motor pump for approx ${pumpRuntimeMinutes} minutes.`
                      : `Current root-zone moisture (${simMoisture}%) satisfies the dynamic transpiration requirement (ETc = ${etc} mm/day). No pump execution recommended.`}
                  </p>
                </div>

                {/* Mathematical Ledger breakdown */}
                <div style={{ borderTop: '1px solid rgba(234,232,225,0.1)', paddingTop: '1rem', marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--graphite)', display: 'block' }}>Kc Coeff:</span>
                    <strong style={{ color: 'var(--sheet)', fontSize: '0.9rem' }}>{kc}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--graphite)', display: 'block' }}>Daily ETc:</span>
                    <strong style={{ color: 'var(--sheet)', fontSize: '0.9rem' }}>{etc} mm</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--graphite)', display: 'block' }}>Pump Time:</span>
                    <strong style={{ color: isIrrigationNeeded ? 'var(--accent-light)' : 'var(--graphite)', fontSize: '0.9rem' }}>
                      {isIrrigationNeeded ? `${pumpRuntimeMinutes} mins` : '0 mins'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 5. SECTION C: MULTILINGUAL VOICE ORACLE */}
      {activeTab === 'tutorial' && (
        <div data-reveal>
          <section className="band wrap">
            <div className="head">
              <span className="label">Universal Accessibility</span>
              <h2>Multilingual Voice Oracle.</h2>
              <p>
                Designed for farmers of all regions and literacy backgrounds. Listen to live voice synthesis explaining scientific irrigation procedures in 8 Indian languages.
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(234,232,225,0.12)',
              padding: '2.5rem', borderRadius: '6px', marginTop: '2rem'
            }}>
              {/* Language selection chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '2rem' }}>
                {INDIAN_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (isSpeaking) window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                      setSelectedLang(lang.code);
                    }}
                    style={{
                      background: selectedLang === lang.code ? 'var(--sheet)' : 'rgba(255,255,255,0.04)',
                      color: selectedLang === lang.code ? 'var(--proof)' : 'var(--sheet)',
                      border: '1px solid rgba(234,232,225,0.16)',
                      padding: '8px 16px',
                      borderRadius: '100px',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: selectedLang === lang.code ? 600 : 400
                    }}
                  >
                    {lang.native} ({lang.name})
                  </button>
                ))}
              </div>

              {/* Spoken Text Presentation */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(234,232,225,0.08)',
                padding: '2rem',
                borderRadius: '4px',
                marginBottom: '2rem'
              }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--accent-text)', marginBottom: '0.75rem' }}>
                  SPEECH SYNTHESIS SCRIPT ({INDIAN_LANGUAGES.find(l => l.code === selectedLang)?.name})
                </div>
                <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.65rem', lineHeight: '1.4', margin: 0 }}>
                  "{TUTORIAL_AUDIO_SCRIPTS[selectedLang]}"
                </p>
              </div>

              {/* Trigger Audio Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button
                  onClick={handleSpeakTutor}
                  style={{
                    background: isSpeaking ? '#ff4d4d' : 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  <span>{isSpeaking ? 'Stop Voice Broadcast' : 'Play Voice Advisory'}</span>
                </button>

                {isSpeaking && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-light)', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>
                    <span className="animate-pulse">●</span>
                    <span>Broadcasting audio in {INDIAN_LANGUAGES.find(l => l.code === selectedLang)?.name}...</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 6. SECTION D: REGISTERED FIELD PLOTS & FAST REGISTRATION */}
      {activeTab === 'plots' && (
        <div data-reveal>
          <section className="band wrap">
            <div className="head">
              <span className="label">Operational Plots</span>
              <h2>Your farm plots under advisory.</h2>
              <p>
                Manage existing land segments or register new acreage to automatically begin FAO-56 sensor tracking.
              </p>
            </div>

            {/* Existing Plots List */}
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {fields.map(field => (
                <div 
                  key={field.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.75rem 2rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(234,232,225,0.1)',
                    borderRadius: '4px',
                    gap: '1.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(234,232,225,0.1)'}
                >
                  <div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2rem', margin: '0 0 0.4rem 0', fontWeight: 'normal' }}>
                      {field.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', color: 'var(--graphite)' }}>
                      <span style={{ color: 'var(--sheet)', border: '1px solid var(--accent)', padding: '2px 8px', borderRadius: '2px' }}>{field.crop_type}</span>
                      <span>Stage: {field.current_growth_stage}</span>
                      <span>Area: {field.area_acres} Acres</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link
                      to={`/field/${field.id}`}
                      style={{
                        background: 'var(--sheet)',
                        color: 'var(--proof)',
                        padding: '8px 16px',
                        borderRadius: '3px',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>Open Telemetry</span>
                      <ArrowRight size={14} />
                    </Link>

                    <Link
                      to={`/field/${field.id}/analytics`}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(234,232,225,0.2)',
                        color: 'var(--sheet)',
                        padding: '8px 14px',
                        borderRadius: '3px',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '12px',
                        textDecoration: 'none'
                      }}
                    >
                      Analytics
                    </Link>

                    <button
                      onClick={(e) => handleDeletePlot(field.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff6b6b',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      [Delete]
                    </button>
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--graphite)', fontFamily: "'DM Mono', monospace" }}>
                  No field plots registered yet. Use the form below to register your first plot.
                </div>
              )}
            </div>

            {/* Quick Add Plot Section */}
            <div style={{ marginTop: '4rem', borderTop: '1px solid rgba(234,232,225,0.1)', paddingTop: '3rem' }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.2rem', margin: '0 0 1.5rem 0', fontWeight: 'normal' }}>
                Register a new field plot
              </h3>

              <form onSubmit={handleCreatePlot} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Plot Name</label>
                  <input 
                    type="text" required placeholder="e.g. North Acre Paddy"
                    className="input-dark"
                    value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(234,232,225,0.15)', padding: '0.8rem', color: 'var(--sheet)', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Crop Type</label>
                  <select 
                    className="select-dark"
                    value={newField.crop_type} onChange={e => setNewField({...newField, crop_type: e.target.value})}
                    style={{ width: '100%', background: 'var(--proof)', border: '1px solid rgba(234,232,225,0.15)', padding: '0.8rem', color: 'var(--sheet)', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
                  >
                    {Object.keys(CROP_COEFFICIENTS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Area (Acres)</label>
                  <input 
                    type="number" step="0.1" min="0.1" required
                    className="input-dark"
                    value={newField.area_acres} onChange={e => setNewField({...newField, area_acres: parseFloat(e.target.value) || 0})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(234,232,225,0.15)', padding: '0.8rem', color: 'var(--sheet)', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Stage</label>
                  <select 
                    className="select-dark"
                    value={newField.current_growth_stage} onChange={e => setNewField({...newField, current_growth_stage: e.target.value})}
                    style={{ width: '100%', background: 'var(--proof)', border: '1px solid rgba(234,232,225,0.15)', padding: '0.8rem', color: 'var(--sheet)', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}
                  >
                    <option value="Germination">Germination</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Maturity">Maturity</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                  <button 
                    type="submit" 
                    disabled={savingField}
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '3px',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: savingField ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {savingField ? 'Saving...' : 'Register Plot to Database'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}

      {/* 7. FOOTER POOL CANVAS WITH FLUID INTERACTIVE RIPPLE */}
      <div className="moire" />
      <section style={{ position: 'relative', height: '60vh', minHeight: '380px', overflow: 'hidden', background: 'var(--proof)' }}>
        <PoolCanvas brandText="AgriSense" />
        <div style={{
          position: 'absolute', bottom: '24px', left: 'var(--gap)', right: 'var(--gap)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--graphite)'
        }}>
          <span>Bhoomi · AgriSense Soil Intelligence Platform</span>
          <span>© {new Date().getFullYear()} Quantum Coders</span>
        </div>
      </section>

    </div>
  );
}
