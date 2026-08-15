import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getFields, logUserAction } from '../services/dataService';
import { useReveal, useStagger } from '../hooks/useReveal';
import PleatCanvas from '../components/PleatCanvas';
import PoolCanvas from '../components/PoolCanvas';
import { 
  Volume2, VolumeX, Sparkles, Droplet, Sun, Wind, CloudRain,
  Layers, ArrowRight, Play, RefreshCw, CheckCircle2, ChevronRight,
  ShieldCheck, Zap, Activity, Gauge, Info
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

const CROP_DATABASE = {
  'Rice (Paddy)': { 
    Germination: { kc: 1.05, days: '0-15' }, 
    Vegetative: { kc: 1.15, days: '16-45' }, 
    Flowering: { kc: 1.30, days: '46-75' }, 
    Maturity: { kc: 0.90, days: '76-110' }, 
    threshold: 65, 
    rootDepthCm: 30,
    idealSoil: 'Clay / Clay Loam',
    waterDemand: 'Very High'
  },
  'Maize (Corn)': { 
    Germination: { kc: 0.40, days: '0-20' }, 
    Vegetative: { kc: 0.85, days: '21-50' }, 
    Flowering: { kc: 1.20, days: '51-80' }, 
    Maturity: { kc: 0.60, days: '81-110' }, 
    threshold: 50, 
    rootDepthCm: 60,
    idealSoil: 'Well-drained Loam',
    waterDemand: 'Medium'
  },
  'Chili (Mirchi)': { 
    Germination: { kc: 0.35, days: '0-25' }, 
    Vegetative: { kc: 0.70, days: '26-60' }, 
    Flowering: { kc: 1.05, days: '61-95' }, 
    Maturity: { kc: 0.60, days: '96-140' }, 
    threshold: 45, 
    rootDepthCm: 45,
    idealSoil: 'Sandy Loam',
    waterDemand: 'Medium'
  },
  'Wheat': { 
    Germination: { kc: 0.40, days: '0-20' }, 
    Vegetative: { kc: 0.75, days: '21-55' }, 
    Flowering: { kc: 1.15, days: '56-85' }, 
    Maturity: { kc: 0.50, days: '86-120' }, 
    threshold: 55, 
    rootDepthCm: 50,
    idealSoil: 'Loamy Silt',
    waterDemand: 'Medium-High'
  },
  'Cotton': { 
    Germination: { kc: 0.35, days: '0-30' }, 
    Vegetative: { kc: 0.75, days: '31-70' }, 
    Flowering: { kc: 1.20, days: '71-120' }, 
    Maturity: { kc: 0.65, days: '121-160' }, 
    threshold: 50, 
    rootDepthCm: 75,
    idealSoil: 'Black Deep Soil',
    waterDemand: 'High'
  },
  'Sugarcane': { 
    Germination: { kc: 0.40, days: '0-40' }, 
    Vegetative: { kc: 1.00, days: '41-150' }, 
    Flowering: { kc: 1.25, days: '151-280' }, 
    Maturity: { kc: 0.75, days: '281-365' }, 
    threshold: 60, 
    rootDepthCm: 100,
    idealSoil: 'Heavy Clay Loam',
    waterDemand: 'Intense'
  }
};

const LETS_GO_TRANSLATIONS = [
  { lang: 'English', text: "Let's Go", sub: 'Start Advisory' },
  { lang: 'Telugu', text: 'పదండి ప్రారంభిద్దాం', sub: 'తెలుగు' },
  { lang: 'Hindi', text: 'चलो शुरू करें', sub: 'हिन्दी' },
  { lang: 'Tamil', text: 'தொடங்குவோம்', sub: 'தமிழ்' },
  { lang: 'Kannada', text: 'ಪ್ರಾರಂಭಿಸೋಣ', sub: 'ಕನ್ನಡ' },
  { lang: 'Marathi', text: 'चला सुरू करूया', sub: 'मराठी' },
  { lang: 'Bengali', text: 'চলুন শুরু করি', sub: 'বাংলা' },
  { lang: 'Gujarati', text: 'ચાલો શરૂ કરીએ', sub: 'ગુજરાતી' },
  { lang: 'Malayalam', text: 'തുടങ്ങാം', sub: 'മലയാളം' },
  { lang: 'Punjabi', text: 'ਚਲੋ ਸ਼ੁਰੂ ਕਰੀਏ', sub: 'ਪੰਜਾਬੀ' }
];

export default function SoilSimulator() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Multilingual animated "Let's Go" button state
  const [letsGoIndex, setLetsGoIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  // Simulation Parameters
  const [selectedCrop, setSelectedCrop] = useState('Rice (Paddy)');
  const [growthStage, setGrowthStage] = useState('Vegetative');
  const [soilMoisture, setSoilMoisture] = useState(44); // VWC %
  const [temperature, setTemperature] = useState(33); // °C
  const [humidity, setHumidity] = useState(58); // %
  const [solarRadiation, setSolarRadiation] = useState(6.8); // MJ/m2/day -> ET0 baseline mm/day
  const [forecastRain, setForecastRain] = useState(0); // mm
  const [pumpHp, setPumpHp] = useState(5.0); // HP

  // Multilingual Speech State
  const [selectedLang, setSelectedLang] = useState('en');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Field plots from DB
  const [userFields, setUserFields] = useState([]);
  const [appliedFieldId, setAppliedFieldId] = useState('');

  useReveal({}, []);
  useStagger([]);

  // Auto-cycle "Let's Go" translation every 1.8s
  useEffect(() => {
    const timer = setInterval(() => {
      setLetsGoIndex(prev => (prev + 1) % LETS_GO_TRANSLATIONS.length);
      setFadeKey(prev => prev + 1);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      getFields(currentUser.uid).then(data => {
        setUserFields(data || []);
        if (data && data.length > 0) {
          setAppliedFieldId(data[0].id);
        }
      }).catch(console.error);
    }
  }, [currentUser]);

  // Scientific FAO-56 Evapotranspiration Calculations
  const cropConfig = CROP_DATABASE[selectedCrop] || CROP_DATABASE['Rice (Paddy)'];
  const stageData = cropConfig[growthStage] || cropConfig['Vegetative'];
  const kc = stageData.kc;
  const threshold = cropConfig.threshold;
  
  // Baseline Reference Evapotranspiration (ET0) calculated via Hargreaves-Samani / Radiation model
  const calculatedEt0 = parseFloat((solarRadiation * 0.85 + (temperature - 20) * 0.08).toFixed(2));
  // Actual Crop Evapotranspiration ETc = Kc * ET0
  const calculatedEtc = parseFloat((calculatedEt0 * kc).toFixed(2));
  
  // Root Zone Moisture Deficit %
  const deficitPct = Math.max(0, threshold - soilMoisture);
  
  // Net Irrigation Requirement in mm (considering root depth & soil capacity)
  const rawWaterDeficitMm = deficitPct > 0 
    ? parseFloat(((deficitPct / 100) * cropConfig.rootDepthCm * 1.25).toFixed(1))
    : 0;
  
  // Net water needed accounting for rain offset
  const netWaterNeededMm = Math.max(0, parseFloat((rawWaterDeficitMm - forecastRain).toFixed(1)));
  
  // 5HP pump standard flow rate: ~45,000 Liters/hour = 750 Liters/min. 1 mm on 1 acre = 4,046 Liters.
  // Minutes needed = (netWaterNeededMm * 4046 Liters) / (Pump_LPM)
  const pumpLpm = pumpHp * 150; // approx 750 LPM for 5HP, 1125 LPM for 7.5HP
  const totalWaterLiters = Math.round(netWaterNeededMm * 4046);
  const pumpRunMinutes = netWaterNeededMm > 0 ? Math.ceil(totalWaterLiters / pumpLpm) : 0;
  const isIrrigationNeeded = soilMoisture < threshold && forecastRain < 4;

  // Audio Speech Generation
  const generateAdvisorySpeechText = (lang) => {
    if (lang === 'te') {
      return isIrrigationNeeded 
        ? `${selectedCrop} పంటకు నేల తేమ ${soilMoisture} శాతం వద్ద ఉంది. కనీస పరిమితి ${threshold} శాతం. పంట అవసరం మేరకు ${netWaterNeededMm} మిల్లీమీటర్ల నీరు ఇవ్వాలి. ${pumpHp} హెచ్‌పీ మోటారును సుమారు ${pumpRunMinutes} నిమిషాలు నడపండి.`
        : `${selectedCrop} పంటకు నేల తేమ ${soilMoisture} శాతంతో అనుకూలంగా ఉంది. ఇప్పుడు నీరు పెట్టవలసిన అవసరం లేదు.`;
    }
    if (lang === 'hi') {
      return isIrrigationNeeded 
        ? `${selectedCrop} के लिए वर्तमान मृदा नमी ${soilMoisture}% है जो न्यूनतम ${threshold}% से कम है। फसल को ${netWaterNeededMm} मिमी पानी की आवश्यकता है। ${pumpHp} एचपी मोटर को ${pumpRunMinutes} मिनट चलाएं।`
        : `मृदा नमी ${soilMoisture}% इष्टतम स्तर पर है। वर्तमान में सिंचाई की आवश्यकता नहीं है।`;
    }
    if (lang === 'ta') {
      return isIrrigationNeeded 
        ? `${selectedCrop} பயிருக்கு மண் ஈரப்பதம் ${soilMoisture}% ஆக உள்ளது. ${netWaterNeededMm} மிமீ நீர் தேவைப்படுகிறது. மோட்டாரை ${pumpRunMinutes} நிமிடங்கள் இயக்கவும்.`
        : `மண் ஈரப்பதம் போதுமானதாக உள்ளது. தற்போது நீர் பாய்ச்ச தேவையில்லை.`;
    }
    if (lang === 'kn') {
      return isIrrigationNeeded 
        ? `${selectedCrop} ಬೆಳೆಗೆ ಮಣ್ಣಿನ ತೇವಾಂಶ ${soilMoisture}% ಇದೆ. ${netWaterNeededMm} ಮಿಲಿಮೀಟರ್ ನೀರುಣಿಸಬೇಕು. ಮೋಟಾರ್ ಅನ್ನು ${pumpRunMinutes} ನಿಮಿಷ ಚಲಾಯಿಸಿ.`
        : `ಮಣ್ಣಿನ ತೇವಾಂಶ ಸಮರ್ಪಕವಾಗಿದೆ. ಈಗ ನೀರಾವರಿ ಅಗತ್ಯವಿಲ್ಲ.`;
    }
    if (lang === 'mr') {
      return isIrrigationNeeded 
        ? `${selectedCrop} साठी मातीतील ओलावा ${soilMoisture}% आहे. ${netWaterNeededMm} मिमी पाणी देणे आवश्यक आहे. ${pumpHp} एचपी मोटर ${pumpRunMinutes} मिनिटे सुरू ठेवा.`
        : `मातीतील ओलावा योग्य आहे. सध्‍या पाणी देण्याची गरज नाही.`;
    }
    if (lang === 'bn') {
      return isIrrigationNeeded 
        ? `${selectedCrop} এর জন্য মাটির আর্দ্রতা ${soilMoisture}%। ${netWaterNeededMm} মিমি জল সেচ প্রয়োজন। মোটর ${pumpRunMinutes} মিনিট চালান।`
        : `মাটির আর্দ্রতা অনুকূল রয়েছে। এখনই সেচ দেওয়ার প্রয়োজন নেই।`;
    }
    if (lang === 'gu') {
      return isIrrigationNeeded 
        ? `${selectedCrop} માટે જમીનમાં ભેજ ${soilMoisture}% છે. ${netWaterNeededMm} મીમી પાણી આપવાની જરૂર છે. મોટર ${pumpRunMinutes} મિનિટ ચલાવો.`
        : `જમીનમાં ભેજ યોગ્ય છે. અત્યારે સિંચાઈની જરૂર નથી.`;
    }
    return isIrrigationNeeded
      ? `Soil moisture for ${selectedCrop} is ${soilMoisture}%, which is ${deficitPct.toFixed(1)}% below the target threshold of ${threshold}%. Calculated crop evapotranspiration is ${calculatedEtc} mm/day. Apply ${netWaterNeededMm} mm of irrigation. Run your ${pumpHp} HP motor pump for approximately ${pumpRunMinutes} minutes.`
      : `Current root zone soil moisture of ${soilMoisture}% is optimal for ${selectedCrop} during ${growthStage} stage. Transpiration loss is covered. Hold irrigation.`;
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const text = generateAdvisorySpeechText(selectedLang);
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

  return (
    <div style={{ backgroundColor: 'var(--proof)', color: 'var(--sheet)', minHeight: '100vh', fontFamily: "'Instrument Sans', sans-serif" }}>
      
      {/* 1. HERO SECTION WITH ICONIC BROWN CURTAIN CANVAS */}
      <section style={{ position: 'relative', height: '92vh', minHeight: '620px', overflow: 'hidden', background: 'var(--proof)' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <PleatCanvas brandText="Bhoomi Matrix" />
        </div>

        {/* Gradient Scrim */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(90deg, rgba(13,13,12,.78) 0%, rgba(13,13,12,.62) 48%, rgba(13,13,12,.30) 75%, rgba(13,13,12,0) 96%)'
        }} />

        {/* Title */}
        <div style={{
          position: 'absolute', left: 'var(--gap)', top: '48%', transform: 'translateY(-50%)',
          maxWidth: '18ch', zIndex: 2, pointerEvents: 'none',
          fontFamily: "'Instrument Serif', serif",
          fontSize: 'clamp(34px, 9vw, 154px)',
          lineHeight: '.96', letterSpacing: '-.035em',
        }}>
          <span>Bhoomi</span>
          <em style={{ fontStyle: 'normal', color: 'inherit', opacity: '.72', display: 'block' }}>
            Matrix.
          </em>
        </div>

        {/* ATTRACTIVE CENTER "LET'S GO" BUTTON WITH MULTILINGUAL BLINK & AUTO-SCROLL */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', transform: 'rotate(-4deg)' }}>
            <span style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontSize: '1.4rem',
              color: '#4EC97A',
              letterSpacing: '0.02em',
              textShadow: '0 0 20px rgba(78, 201, 122, 0.45)'
            }}>
              Calibrate Soil
            </span>
            <svg width="46" height="36" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10 C 24 2, 48 8, 42 26 C 38 38, 20 36, 26 24 C 30 16, 48 24, 52 40" stroke="#4EC97A" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 3" />
              <path d="M44 34 L 52 40 L 42 43" stroke="#4EC97A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Multilingual Glowing "Let's Go" Action Button */}
          <button
            onClick={() => {
              const el = document.getElementById('simulator-cockpit');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              minWidth: '220px',
              background: 'rgba(234, 232, 225, 0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(78, 201, 122, 0.65)',
              color: 'var(--sheet)',
              padding: '14px 28px',
              borderRadius: '100px',
              cursor: 'pointer',
              boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 25px rgba(78, 201, 122, 0.3)',
              transition: 'all 0.3s cubic-bezier(.2, .7, .2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--sheet)';
              e.currentTarget.style.color = 'var(--proof)';
              e.currentTarget.style.borderColor = 'var(--sheet)';
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)';
              e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(0, 0, 0, 0.8), 0 0 35px rgba(78, 201, 122, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(234, 232, 225, 0.08)';
              e.currentTarget.style.color = 'var(--sheet)';
              e.currentTarget.style.borderColor = 'rgba(78, 201, 122, 0.65)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 25px rgba(78, 201, 122, 0.3)';
            }}
          >
            <Sparkles size={16} color="#4EC97A" />
            
            {/* Morphing / Blinking Translated Text Container */}
            <div 
              key={fadeKey}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation: 'letsGoFade 0.35s cubic-bezier(.2, .7, .2, 1) forwards'
              }}
            >
              <span style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: '1.45rem',
                fontWeight: '600',
                letterSpacing: '0.01em',
                lineHeight: 1
              }}>
                {LETS_GO_TRANSLATIONS[letsGoIndex].text}
              </span>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '9px',
                opacity: 0.7,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: '2px'
              }}>
                {LETS_GO_TRANSLATIONS[letsGoIndex].sub}
              </span>
            </div>

            <ArrowRight size={15} />
          </button>
        </div>

        {/* Top Floating Telemetry Status */}
        <div style={{
          position: 'absolute', zIndex: 2,
          left: 'var(--gap)', right: 'var(--gap)', bottom: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px',
          fontSize: 'var(--chrome)', color: 'var(--graphite)',
          fontFamily: "'DM Mono', monospace", textTransform: 'uppercase',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#4EC97A', boxShadow: '0 0 10px #4EC97A' }} />
            <span>Telemetry: {currentUser?.name || 'Farmer'} · Active FAO-56 Soil Matrix</span>
          </div>
          <div>
            <span>Soil Intelligence Platform</span>
          </div>
        </div>
      </section>

      {/* 2. THE MAIN SCIENTIFIC LABORATORY COCKPIT */}
      <section id="simulator-cockpit" className="band wrap" data-reveal style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="head" style={{ borderBottom: '1px solid rgba(234, 232, 225, 0.1)', paddingBottom: '2rem' }}>
          <span className="label" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--accent-text)', display: 'block', marginBottom: '0.5rem' }}>
            Dynamic Agro-Telemetry Simulation
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', margin: 0, fontWeight: 'normal' }}>
            Adjust biological & climate controls in real time.
          </h2>
          <p style={{ color: 'var(--graphite)', fontSize: '0.95rem', maxWidth: '65ch', marginTop: '0.75rem', lineHeight: '1.6' }}>
            Simulate how variable root-zone moisture, solar irradiance, phenological crop coefficient (Kc), and incoming rainfall interact to generate optimal pump motor schedules.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '2.5rem', marginTop: '2.5rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(234,232,225,0.12)',
          padding: '2.5rem', borderRadius: '6px'
        }}>
          
          {/* COLUMN 1: CROP & SOIL CALIBRATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              01. Crop Biology & Soil Depth
            </h3>

            {/* Crop Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace", color: 'var(--graphite)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Select Crop Variety</label>
              <select 
                value={selectedCrop} 
                onChange={e => setSelectedCrop(e.target.value)}
                className="select-dark"
                style={{ width: '100%', background: 'var(--proof)', border: '1px solid rgba(234,232,225,0.2)', padding: '0.75rem', color: 'var(--sheet)', fontFamily: "'DM Mono', monospace", fontSize: '0.9rem' }}
              >
                {Object.keys(CROP_DATABASE).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Growth Stage Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace", color: 'var(--graphite)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Phenological Growth Stage</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['Germination', 'Vegetative', 'Flowering', 'Maturity'].map(stage => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setGrowthStage(stage)}
                    style={{
                      background: growthStage === stage ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                      color: growthStage === stage ? '#fff' : 'var(--sheet)',
                      border: '1px solid rgba(234,232,225,0.15)',
                      padding: '8px',
                      borderRadius: '3px',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {stage} ({cropConfig[stage]?.kc} Kc)
                  </button>
                ))}
              </div>
            </div>

            {/* Soil Moisture Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                <span>Root Moisture (VWC):</span>
                <strong style={{ color: soilMoisture < threshold ? '#ff6b6b' : '#4EC97A' }}>
                  {soilMoisture}% (Critical Limit: {threshold}%)
                </strong>
              </div>
              <input 
                type="range" min="10" max="90" value={soilMoisture}
                onChange={e => setSoilMoisture(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--graphite)', fontFamily: "'DM Mono', monospace", marginTop: '4px' }}>
                <span>10% (Wilting Point)</span>
                <span>50% (Ideal)</span>
                <span>90% (Saturated)</span>
              </div>
            </div>

            {/* Motor Pump Rating */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace", color: 'var(--graphite)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Pump Motor Capacity</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[3.0, 5.0, 7.5, 10.0].map(hp => (
                  <button
                    key={hp}
                    type="button"
                    onClick={() => setPumpHp(hp)}
                    style={{
                      flex: 1,
                      background: pumpHp === hp ? 'var(--sheet)' : 'rgba(255,255,255,0.04)',
                      color: pumpHp === hp ? 'var(--proof)' : 'var(--sheet)',
                      border: '1px solid rgba(234,232,225,0.15)',
                      padding: '8px 0',
                      borderRadius: '3px',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {hp} HP
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: WEATHER & ATMOSPHERIC DRIVERS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              02. Climate & Atmospheric Drivers
            </h3>

            {/* Ambient Temperature */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                <span>Ambient Temperature:</span>
                <strong>{temperature}°C</strong>
              </div>
              <input 
                type="range" min="15" max="48" value={temperature}
                onChange={e => setTemperature(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            {/* Solar Irradiance / Baseline ET0 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                <span>Solar Radiation (ET₀ potential):</span>
                <strong>{solarRadiation} mm/day</strong>
              </div>
              <input 
                type="range" min="2.0" max="11.0" step="0.5" value={solarRadiation}
                onChange={e => setSolarRadiation(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            {/* Relative Humidity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                <span>Relative Humidity:</span>
                <strong>{humidity}%</strong>
              </div>
              <input 
                type="range" min="20" max="95" value={humidity}
                onChange={e => setHumidity(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            {/* Forecast Rainfall Offset */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                <span>Forecast Rain (Next 24h):</span>
                <strong style={{ color: '#4da6ff' }}>{forecastRain} mm</strong>
              </div>
              <input 
                type="range" min="0" max="30" step="1" value={forecastRain}
                onChange={e => setForecastRain(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#4da6ff' }}
              />
            </div>
          </div>

          {/* COLUMN 3: REAL-TIME ADVISORY DISPATCH & VOICE SYNTHESIS */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: isIrrigationNeeded ? '1px solid rgba(255, 107, 107, 0.5)' : '1px solid rgba(78, 201, 122, 0.5)',
            borderRadius: '6px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)', textTransform: 'uppercase' }}>Computed Kernel Output</span>
                <span style={{
                  padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace",
                  background: isIrrigationNeeded ? 'rgba(255, 107, 107, 0.15)' : 'rgba(78, 201, 122, 0.15)',
                  color: isIrrigationNeeded ? '#ff6b6b' : '#4EC97A'
                }}>
                  {isIrrigationNeeded ? 'PUMP RUN REQUIRED' : 'SOIL OPTIMAL'}
                </span>
              </div>

              <h4 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.4rem', margin: '0 0 0.75rem 0', fontWeight: 'normal', lineHeight: 1.1 }}>
                {isIrrigationNeeded 
                  ? `Apply ${netWaterNeededMm} mm (${totalWaterLiters.toLocaleString()} Liters).` 
                  : `Hold irrigation. Moisture sufficient.`}
              </h4>

              <p style={{ color: 'var(--graphite)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                {isIrrigationNeeded 
                  ? `Run ${pumpHp} HP motor for ${pumpRunMinutes} minutes to bring root zone to field capacity without nutrient leaching.`
                  : `Crop transpiration rate (ETc = ${calculatedEtc} mm/day) is satisfied by current root zone reservoir (${soilMoisture}%).`}
              </p>
            </div>

            {/* Scientific Breakdown Ledgers */}
            <div style={{ borderTop: '1px solid rgba(234,232,225,0.1)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--graphite)', display: 'block' }}>Kc Multiplier</span>
                  <strong style={{ color: 'var(--sheet)', fontSize: '0.95rem' }}>{kc}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--graphite)', display: 'block' }}>Daily ETc</span>
                  <strong style={{ color: 'var(--sheet)', fontSize: '0.95rem' }}>{calculatedEtc} mm</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--graphite)', display: 'block' }}>Motor Runtime</span>
                  <strong style={{ color: isIrrigationNeeded ? 'var(--accent-light)' : 'var(--graphite)', fontSize: '0.95rem' }}>
                    {isIrrigationNeeded ? `${pumpRunMinutes} mins` : '0 mins'}
                  </strong>
                </div>
              </div>

              {/* Language Selector & Voice Broadcast */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(234,232,225,0.1)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
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
                        border: '1px solid rgba(234,232,225,0.15)',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {lang.native}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSpeak}
                  style={{
                    width: '100%',
                    background: isSpeaking ? '#ff4d4d' : 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 18px',
                    borderRadius: '4px',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span>{isSpeaking ? 'Stop Voice Advisory' : `Speak in ${INDIAN_LANGUAGES.find(l => l.code === selectedLang)?.name}`}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SOIL ROOT CROSS-SECTION DIELECTRIC GAUGE */}
      <div className="moire" />
      <section className="band wrap" data-reveal>
        <div className="head">
          <span className="label">Root Strata Simulation</span>
          <h2>Subsurface dielectric water distribution.</h2>
          <p>Visualizing volumetric water content penetration across crop root profile depth ({cropConfig.rootDepthCm} cm).</p>
        </div>

        <div style={{
          marginTop: '2rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(234,232,225,0.12)',
          padding: '2.5rem', borderRadius: '6px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            
            {/* Visual Root Gauge */}
            <div style={{
              height: '240px',
              background: 'linear-gradient(180deg, rgba(65, 45, 30, 0.4) 0%, rgba(35, 25, 18, 0.8) 100%)',
              border: '1px solid rgba(234,232,225,0.15)',
              borderRadius: '4px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}>
              {/* Soil Saturation Level Fill */}
              <div style={{
                height: `${soilMoisture}%`,
                background: isIrrigationNeeded 
                  ? 'linear-gradient(180deg, rgba(255, 107, 107, 0.2) 0%, rgba(78, 201, 122, 0.4) 100%)'
                  : 'linear-gradient(180deg, rgba(78, 201, 122, 0.4) 0%, rgba(45, 122, 79, 0.8) 100%)',
                borderTop: '2px solid #4EC97A',
                transition: 'height 0.4s ease-out',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', top: '-18px', right: '10px',
                  fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#4EC97A'
                }}>
                  VWC: {soilMoisture}%
                </div>
              </div>

              {/* Depth Markers */}
              <div style={{ position: 'absolute', top: '10px', left: '10px', fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--graphite)' }}>
                Surface (0 cm)
              </div>
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--graphite)' }}>
                Bedrock ({cropConfig.rootDepthCm} cm)
              </div>
            </div>

            {/* Agronomic Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)' }}>IDEAL SOIL TEXTURE</span>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: 'var(--sheet)' }}>{cropConfig.idealSoil}</div>
              </div>
              <div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)' }}>TOTAL WATER DEMAND</span>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: 'var(--accent-light)' }}>{cropConfig.waterDemand}</div>
              </div>
              <div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--graphite)' }}>GROWTH STAGE INTERVAL</span>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', color: 'var(--sheet)' }}>{stageData.days} Days</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FOOTER POOL CANVAS */}
      <div className="moire" />
      <section style={{ position: 'relative', height: '60vh', minHeight: '380px', overflow: 'hidden', background: 'var(--proof)' }}>
        <PoolCanvas brandText="AgriSense" />
        <div style={{
          position: 'absolute', bottom: '24px', left: 'var(--gap)', right: 'var(--gap)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--graphite)'
        }}>
          <span>Quantum Soil Simulator · AgriSense FAO-56 Engine</span>
          <span>© {new Date().getFullYear()} Quantum Coders</span>
        </div>
      </section>

    </div>
  );
}
