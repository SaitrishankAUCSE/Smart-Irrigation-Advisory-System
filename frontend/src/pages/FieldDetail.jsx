import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getField, getMoistureReadings, getIrrigationLogs, addMoistureReading, addIrrigationLog, logUserAction, toDate } from '../services/dataService';
import { Droplet, CloudRain, Activity, CheckCircle, Clock, ArrowLeft, BarChart3, Thermometer, Wind, AlertTriangle, Sparkles, Layers, Volume2, VolumeX, Languages, Timer, Gauge, HelpCircle } from 'lucide-react';
import SoilVisualizer from '../components/SoilVisualizer';
import { useReveal } from '../hooks/useReveal';

const CROP_RULES = {
  "Rice": {
    "Germination": { moisture_threshold_percent: 65, water_requirement_mm_per_day: 6.0, kc: 1.05 },
    "Vegetative": { moisture_threshold_percent: 60, water_requirement_mm_per_day: 8.0, kc: 1.15 },
    "Flowering": { moisture_threshold_percent: 70, water_requirement_mm_per_day: 10.0, kc: 1.30 },
    "Maturity": { moisture_threshold_percent: 50, water_requirement_mm_per_day: 5.0, kc: 0.90 }
  },
  "Maize": {
    "Germination": { moisture_threshold_percent: 55, water_requirement_mm_per_day: 4.0, kc: 0.40 },
    "Vegetative": { moisture_threshold_percent: 50, water_requirement_mm_per_day: 6.0, kc: 0.85 },
    "Flowering": { moisture_threshold_percent: 60, water_requirement_mm_per_day: 8.0, kc: 1.20 },
    "Maturity": { moisture_threshold_percent: 40, water_requirement_mm_per_day: 4.0, kc: 0.60 }
  },
  "Chili": {
    "Germination": { moisture_threshold_percent: 50, water_requirement_mm_per_day: 3.5, kc: 0.35 },
    "Vegetative": { moisture_threshold_percent: 45, water_requirement_mm_per_day: 5.0, kc: 0.70 },
    "Flowering": { moisture_threshold_percent: 55, water_requirement_mm_per_day: 7.0, kc: 1.05 },
    "Maturity": { moisture_threshold_percent: 40, water_requirement_mm_per_day: 3.5, kc: 0.60 }
  },
  "Wheat": {
    "Germination": { moisture_threshold_percent: 50, water_requirement_mm_per_day: 3.5, kc: 0.40 },
    "Vegetative": { moisture_threshold_percent: 55, water_requirement_mm_per_day: 5.5, kc: 0.75 },
    "Flowering": { moisture_threshold_percent: 65, water_requirement_mm_per_day: 7.5, kc: 1.15 },
    "Maturity": { moisture_threshold_percent: 40, water_requirement_mm_per_day: 3.0, kc: 0.50 }
  },
  "Cotton": {
    "Germination": { moisture_threshold_percent: 45, water_requirement_mm_per_day: 3.5, kc: 0.35 },
    "Vegetative": { moisture_threshold_percent: 50, water_requirement_mm_per_day: 6.0, kc: 0.75 },
    "Flowering": { moisture_threshold_percent: 60, water_requirement_mm_per_day: 8.5, kc: 1.20 },
    "Maturity": { moisture_threshold_percent: 35, water_requirement_mm_per_day: 4.0, kc: 0.65 }
  },
  "Sugarcane": {
    "Germination": { moisture_threshold_percent: 55, water_requirement_mm_per_day: 4.5, kc: 0.40 },
    "Vegetative": { moisture_threshold_percent: 65, water_requirement_mm_per_day: 8.0, kc: 1.00 },
    "Flowering": { moisture_threshold_percent: 70, water_requirement_mm_per_day: 9.5, kc: 1.25 },
    "Maturity": { moisture_threshold_percent: 45, water_requirement_mm_per_day: 4.5, kc: 0.75 }
  }
};

const DEFAULT_RULE = { moisture_threshold_percent: 50, water_requirement_mm_per_day: 5.0, kc: 0.8 };

const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' }
];

export default function FieldDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [field, setField] = useState(null);
  const [activeTab, setActiveTab] = useState('log');
  const [loading, setLoading] = useState(true);
  const [moisture, setMoisture] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState({ readings: [], logs: [] });
  const [submitting, setSubmitting] = useState(false);

  // Multi-Language & AI Voice State
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Action Outcome Success State
  const [lastLoggedAction, setLastLoggedAction] = useState(null);
  
  useReveal();

  const fetchField = async () => {
    try {
      const data = await getField(id);
      setField(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = () => {
    const mockWeather = {
      temperature_c: Math.round(25 + Math.random() * 8),
      rain_probability_percent: Math.round(Math.random() * 50),
      expected_rainfall_mm: Math.round(Math.random() * 5 * 10) / 10,
      humidity_percent: Math.round(55 + Math.random() * 30),
      wind_speed_kmh: Math.round(5 + Math.random() * 15),
      source: 'AgriSense FAO-56 Station'
    };
    setWeatherData(mockWeather);
  };

  const fetchHistory = async () => {
    try {
      const readings = await getMoistureReadings(id);
      const logs = await getIrrigationLogs(id);
      setHistory({ readings, logs });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id && currentUser) {
      fetchField();
      fetchWeather();
      fetchHistory();
    }
  }, [id, currentUser]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const loadRecommendation = () => {
    if (!field) return;
    setRecommendation(null);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const latestMoisture = history.readings.length > 0 ? history.readings[0].moisture_percent : 0;
    const rainProb = weatherData ? weatherData.rain_probability_percent : 20;
    const expRain = weatherData ? weatherData.expected_rainfall_mm : 0;
    const tempC = weatherData ? weatherData.temperature_c : 28;
    
    const crop = field.crop_type;
    const stage = field.current_growth_stage;
    const rule = (CROP_RULES[crop] && CROP_RULES[crop][stage]) ? CROP_RULES[crop][stage] : DEFAULT_RULE;
    
    const threshold = rule.moisture_threshold_percent;
    const dailyBaseNeed = rule.water_requirement_mm_per_day;
    const kc = rule.kc || 1.0;

    const effectiveRainMm = rainProb >= 60 ? Math.round((expRain * 0.8) * 10) / 10 : 0.0;
    const tempFactor = 1.0 + Math.max(0.0, (tempC - 25.0) / 50.0);
    const etcMm = Math.round((dailyBaseNeed * kc * tempFactor) * 10) / 10;
    const moistureDeficitPct = Math.max(0, threshold - latestMoisture);

    let result;
    if (latestMoisture >= threshold) {
      result = {
        recommendation: "wait",
        amount_mm: 0.0,
        pump_runtime_mins: 0,
        urgency: "Optimal",
        moistureDeficitPct,
        threshold,
        dailyNeed: dailyBaseNeed,
        moisture: latestMoisture,
        etcMm,
        effectiveRainMm,
        kc,
        translations: {
          en: `Soil moisture (${latestMoisture}%) is above the optimal ${threshold}% target for ${crop} during the ${stage} stage. No irrigation needed.`,
          te: `మట్టి తేమ (${latestMoisture}%) ప్రస్తుతం సరైన స్థాయిలో ఉంది (${threshold}%). పంట: ${crop} (${stage} దశ). ఇప్పుడు నీరు పట్టడం అవసరం లేదు.`,
          hi: `मिट्टी की नमी (${latestMoisture}%) वर्तमान में अनुकूलतम स्तर (${threshold}%) पर है। फसल: ${crop} (${stage} चरण)। अभी सिंचाई की आवश्यकता नहीं है।`,
          ta: `மண் ஈரப்பதம் (${latestMoisture}%) உகந்த அளவில் உள்ளது (${threshold}%). பயிர்: ${crop} (${stage} நிலை). இப்போது பாசனம் தேவையில்லை.`,
          kn: `ಮಣ್ಣಿನ ತೇವಾಂಶ (${latestMoisture}%) ಸೂಕ್ತ ಮಟ್ಟದಲ್ಲಿದೆ (${threshold}%). ಬೆಳೆ: ${crop} (${stage} ಹಂತ). ಈಗ ನೀರಾವರಿ ಅಗತ್ಯವಿಲ್ಲ.`,
          mr: `मातीची ओलावा (${latestMoisture}%) इष्टतम पातळीवर आहे (${threshold}%). पीक: ${crop} (${stage} टप्पा). सध्या सिंचनाची गरज नाही.`,
          bn: `মাটির আর্দ্রতা (${latestMoisture}%) সর্বোত্তম স্তরে রয়েছে (${threshold}%)। ফসল: ${crop} (${stage} পর্যায়)। এখন সেচের প্রয়োজন নেই।`
        }
      };
    } else {
      const grossDeficitMm = Math.round((etcMm * (1.0 + (moistureDeficitPct / threshold))) * 10) / 10;
      const netRecommendedMm = Math.round(Math.max(0.0, grossDeficitMm - effectiveRainMm) * 10) / 10;
      const pumpRuntimeMins = Math.round(netRecommendedMm * (field.area_acres || 1.0) * 12);

      if (netRecommendedMm <= 0.5) {
        result = {
          recommendation: "wait",
          amount_mm: 0.0,
          pump_runtime_mins: 0,
          urgency: "Optimal",
          moistureDeficitPct,
          threshold,
          dailyNeed: dailyBaseNeed,
          moisture: latestMoisture,
          etcMm,
          effectiveRainMm,
          kc,
          translations: {
            en: `Expected rain (${effectiveRainMm}mm) will sufficiently replenish soil moisture. Hold off on irrigation.`,
            te: `రాబోయే వర్షం (${effectiveRainMm}mm) మట్టి తేమను భర్తీ చేస్తుంది. నీటిపారుదల నిలిపివేయండి.`,
            hi: `अपेक्षित बारिश (${effectiveRainMm} मिमी) मिट्टी की नमी को पूरा करेगी। सिंचाई रोकें।`,
            ta: `எதிர்பார்க்கப்படும் மழை (${effectiveRainMm} மிமீ) மண் ஈரப்பதத்தை பூர்த்தி செய்யும். பாசனத்தை நிறுத்துங்கள்.`,
            kn: `ನಿರೀಕ್ಷಿತ ಮಳೆಯು (${effectiveRainMm}mm) ಮಣ್ಣಿನ ತೇವಾಂಶವನ್ನು ಪೂರೈಸುತ್ತದೆ. ನೀರಾವರಿಯನ್ನು ತಡೆಹಿಡಿಯಿರಿ.`,
            mr: `अपेक्षित पाऊस (${effectiveRainMm} मिमी) मातीची ओलावा पूर्ण करेल. सिंचन थांबवा.`,
            bn: `প্রত্যাশিত বৃষ্টিপাত (${effectiveRainMm} মিমি) মাটির আর্দ্রতা পূরণ করবে। সেচ স্থগিত রাখুন।`
          }
        };
      } else {
        const urgency = latestMoisture < (threshold * 0.5) ? "Critical" : "Moderate";
        result = {
          recommendation: "irrigate",
          amount_mm: netRecommendedMm,
          pump_runtime_mins: pumpRuntimeMins,
          urgency: urgency,
          moistureDeficitPct,
          threshold,
          dailyNeed: dailyBaseNeed,
          moisture: latestMoisture,
          etcMm,
          effectiveRainMm,
          kc,
          translations: {
            en: `Irrigation Required: ${netRecommendedMm} mm. Run 5HP Motor Pump for approx ${pumpRuntimeMins} minutes. Soil moisture (${latestMoisture}%) is ${moistureDeficitPct.toFixed(1)}% below target for ${crop} (${stage} stage).`,
            te: `నీటిపారుదల అవసరం: ${netRecommendedMm} mm. పంప్ మోటార్ నిరంతరం ~${pumpRuntimeMins} నిమిషాలు నడపండి. మట్టి తేమ శాతాన్ని పెంచడానికి నీరు పట్టండి (${crop} - ${stage} దశ).`,
            hi: `सिंचाई आवश्यक: ${netRecommendedMm} मिमी। पंप मोटर को लगभग ${pumpRuntimeMins} मिनट तक चलाएं। मिट्टी में ${moistureDeficitPct.toFixed(1)}% की कमी है (${crop} - ${stage} चरण)।`,
            ta: `பாசனம் தேவை: ${netRecommendedMm} மிமீ. பம்ப் மோட்டாரை सुमारे ${pumpRuntimeMins} நிமிடங்கள் இயக்கவும். மண் ஈரப்பதம் குறைவாக உள்ளது (${crop} - ${stage} நிலை).`,
            kn: `ನೀರಾವರಿ ಅಗತ್ಯವಿದೆ: ${netRecommendedMm} mm. ಪಂಪ್ ಮೋಟಾರ್ ಅನ್ನು ಸುಮಾರು ${pumpRuntimeMins} ನಿಮಿಷಗಳ ಕಾಲ ಚಾಲನೆ ಮಾಡಿ (${crop} - ${stage} ಹಂತ).`,
            mr: `सिंचन आवश्यक: ${netRecommendedMm} मिमी. पंप मोटर सुमारे ${pumpRuntimeMins} मिनिटे चालवा. मातीत ओलावा कमी आहे (${crop} - ${stage} टप्पा).`,
            bn: `সেচ প্রয়োজন: ${netRecommendedMm} মিমি। পাম্প মোটর প্রায় ${pumpRuntimeMins} মিনিটের জন্য চালান (${crop} - ${stage} পর্যায়)।`
          }
        };
      }
    }
    
    setTimeout(() => setRecommendation(result), 500);
  };

  const handleSpeakAdvisory = () => {
    if (!recommendation) return;

    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert("Text-to-Speech is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const textToRead = recommendation.translations[selectedLanguage] || recommendation.translations.en;
    const langMap = {
      en: 'en-IN',
      te: 'te-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      kn: 'kn-IN',
      mr: 'mr-IN',
      bn: 'bn-IN'
    };

    const targetLang = langMap[selectedLanguage] || 'en-US';
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = targetLang;
    utterance.rate = 0.90; 

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      let preferredVoice = voices.find(v => v.lang === targetLang);
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(selectedLanguage));
      }
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleLogMoisture = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLastLoggedAction(null);
    try {
      await addMoistureReading(id, {
        moisture_percent: parseFloat(moisture),
        source: 'manual',
        username: currentUser?.name || 'Anonymous'
      });
      logUserAction(currentUser.uid, 'moisture_logged', { field_id: id, value: parseFloat(moisture) });
      setMoisture('');
      setActiveTab('recommendation');
      await fetchHistory();
      setTimeout(() => loadRecommendation(), 200);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogIrrigation = async (actionTaken) => {
    setSubmitting(true);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    try {
      await addIrrigationLog(id, {
        recommendation: recommendation.recommendation,
        recommended_amount_mm: recommendation.amount_mm,
        action_taken: actionTaken,
        actual_amount_mm: actionTaken === 'irrigated' ? recommendation.amount_mm : 0,
        username: currentUser?.name || 'Anonymous'
      });
      logUserAction(currentUser.uid, 'irrigation_action', { field_id: id, action: actionTaken, amount: recommendation.amount_mm });
      
      setLastLoggedAction({
        action: actionTaken,
        amount: actionTaken === 'irrigated' ? recommendation.amount_mm : 0,
        timestamp: new Date().toLocaleTimeString()
      });
      await fetchHistory();
    } catch (err) {
      console.error(err);
      alert("Failed to record action");
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) return null;
  if (loading) return (
    <div className="flex items-center justify-center py-32 bg-[#0D0D0C] text-[#EAE8E1] min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#2D7A4F] border-t-[#3DA667] rounded-full animate-spin" />
        <p className="text-[#8A877E] text-sm font-[Instrument_Sans]">Fetching plot telemetry...</p>
      </div>
    </div>
  );
  if (!field) return (
    <div className="text-center py-20 bg-[#0D0D0C] text-[#EAE8E1] min-h-screen">
      <AlertTriangle className="w-12 h-12 text-[#2D7A4F] mx-auto mb-4" />
      <h2 className="text-xl font-[Instrument_Serif] mb-4">Field Plot Not Found</h2>
      <Link to="/" className="text-[#8A877E] hover:text-[#EAE8E1] font-[Instrument_Sans] text-sm underline decoration-[#2D7A4F] transition-colors">← Back to Dashboard</Link>
    </div>
  );

  const tabs = [
    { key: 'log', label: 'Log Reading', icon: Droplet },
    { key: 'recommendation', label: 'FAO-56 Advisory Engine', icon: Activity },
    { key: 'history', label: 'History & Logs', icon: Clock },
  ];

  return (
    <div className="wrap bg-[#0D0D0C] text-[#EAE8E1] min-h-screen font-[Instrument_Sans] pt-8 pb-16 reveal">
      <div className="max-w-6xl mx-auto space-y-8 px-4 sm:px-6">
        {/* Top Header Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[#8A877E] hover:text-[#EAE8E1] transition-colors text-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <div>
              <h1 className="head text-4xl sm:text-5xl font-[Instrument_Serif] text-[#EAE8E1] mb-2">{field.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-[#EAE8E1] border border-[#2D7A4F] px-2 py-1 uppercase tracking-widest bg-[#2D7A4F]/10">
                  {field.crop_type}
                </span>
                <span className="text-[#8A877E]">•</span>
                <span className="text-sm text-[#8A877E] uppercase tracking-wider">{field.current_growth_stage}</span>
                <span className="text-[#8A877E]">•</span>
                <span className="text-sm font-[DM_Mono] text-[#8A877E]">{field.area_acres} ac</span>
              </div>
            </div>
          </div>
          <Link to={`/field/${id}/analytics`} className="btn-accent flex items-center text-sm uppercase tracking-widest px-4 py-3">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Link>
        </div>

        {/* Weather Telemetry Strip */}
        {weatherData && (
          <div className="border border-[#2D7A4F]/30 p-5 rounded-none bg-[#0D0D0C] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-[DM_Mono]">
              <span className="text-[#8A877E] uppercase tracking-widest flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-2 text-[#4EC97A]" /> FAO-56 Telemetry
              </span>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[#8A877E]">TMP:</span>
                  <span className="text-[#EAE8E1]">{weatherData.temperature_c}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8A877E]">PRP:</span>
                  <span className="text-[#EAE8E1]">{weatherData.rain_probability_percent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8A877E]">EXP:</span>
                  <span className="text-[#EAE8E1]">{weatherData.expected_rainfall_mm}mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8A877E]">WND:</span>
                  <span className="text-[#EAE8E1]">{weatherData.wind_speed_kmh} km/h</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Container */}
        <div className="border border-[#8A877E]/20 bg-[#0D0D0C]">
          {/* Tabs Header */}
          <div className="flex border-b border-[#8A877E]/20 overflow-x-auto hide-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => { 
                    setActiveTab(tab.key); 
                    if (tab.key === 'recommendation') loadRecommendation();
                    if (tab.key === 'history') fetchHistory();
                  }}
                  className={`flex-1 min-w-[150px] py-4 text-center text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.key 
                      ? 'text-[#EAE8E1] border-b-2 border-[#2D7A4F] bg-[#2D7A4F]/5' 
                      : 'text-[#8A877E] hover:text-[#EAE8E1] border-b-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-10 reveal" key={activeTab}>
            {/* LOG TAB */}
            {activeTab === 'log' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                <SoilVisualizer moisturePercent={history.readings.length > 0 ? history.readings[0].moisture_percent : 0} />
                
                <div className="space-y-8">
                  <form onSubmit={handleLogMoisture} className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-xs font-bold text-[#8A877E] uppercase tracking-wider">Log Soil Moisture (%)</label>
                        <span className="text-[10px] text-[#4EC97A] uppercase tracking-widest">Presets:</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" min="0" max="100" step="0.1" required
                          className="input-dark w-full pl-4 pr-4 py-4 bg-transparent border border-[#8A877E]/30 focus:border-[#2D7A4F] text-2xl font-[DM_Mono] text-[#EAE8E1] placeholder-[#8A877E]/50 focus:outline-none transition-colors"
                          placeholder="e.g. 45"
                          value={moisture} onChange={e => setMoisture(e.target.value)}
                        />
                      </div>
                      
                      {/* Demo Presets */}
                      <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setMoisture('25')} className="btn-ghost flex-1 py-2 px-3 border border-[#8A877E]/30 hover:border-[#EAE8E1] text-[#8A877E] hover:text-[#EAE8E1] text-xs uppercase tracking-widest transition-colors font-[DM_Mono]">
                          Low (25)
                        </button>
                        <button type="button" onClick={() => setMoisture('65')} className="btn-ghost flex-1 py-2 px-3 border border-[#8A877E]/30 hover:border-[#EAE8E1] text-[#8A877E] hover:text-[#EAE8E1] text-xs uppercase tracking-widest transition-colors font-[DM_Mono]">
                          Opt (65)
                        </button>
                        <button type="button" onClick={() => setMoisture('15')} className="btn-ghost flex-1 py-2 px-3 border border-[#8A877E]/30 hover:border-[#EAE8E1] text-[#8A877E] hover:text-[#EAE8E1] text-xs uppercase tracking-widest transition-colors font-[DM_Mono]">
                          Crit (15)
                        </button>
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={submitting || !moisture}
                      className="btn-accent w-full py-4 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Save & Get Advisory'}
                    </button>
                  </form>

                  {/* Scientific Target Card */}
                  <div className="border border-[#2D7A4F]/30 bg-[#2D7A4F]/5 p-5">
                    <p className="text-xs text-[#2D7A4F] uppercase tracking-widest mb-2 font-bold">Agronomic Target</p>
                    <p className="text-sm text-[#8A877E] leading-relaxed">
                      <strong className="text-[#EAE8E1]">{field.crop_type}</strong> ({field.current_growth_stage}) requires threshold moisture &gt;{' '}
                      <strong className="text-[#4EC97A] font-[DM_Mono]">{(CROP_RULES[field.crop_type]?.[field.current_growth_stage] || DEFAULT_RULE).moisture_threshold_percent}%</strong>{' '}
                      (Kc: <span className="font-[DM_Mono]">{(CROP_RULES[field.crop_type]?.[field.current_growth_stage] || DEFAULT_RULE).kc}</span>)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* RECOMMENDATION TAB */}
            {activeTab === 'recommendation' && (
              <div className="max-w-4xl mx-auto space-y-8">
                {lastLoggedAction ? (
                  <div className="border border-[#2D7A4F] p-10 text-center space-y-6 bg-[#0D0D0C]">
                    <div className="inline-flex justify-center items-center text-[#4EC97A] mb-2">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-[Instrument_Serif] text-[#EAE8E1] mb-2">
                        {lastLoggedAction.action === 'irrigated' ? 'Irrigation Action Logged' : 'Skip Action Logged'}
                      </h2>
                      <p className="text-[#8A877E] font-[DM_Mono] text-sm">
                        {lastLoggedAction.action === 'irrigated' 
                          ? `Recorded ${lastLoggedAction.amount}mm irrigation at ${lastLoggedAction.timestamp}`
                          : `Recorded skip at ${lastLoggedAction.timestamp}`
                        }
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                      <button 
                        onClick={() => { setLastLoggedAction(null); setActiveTab('log'); }}
                        className="btn-accent px-6 py-3 text-xs uppercase tracking-widest"
                      >
                        Log New
                      </button>
                      <button 
                        onClick={() => { setLastLoggedAction(null); setActiveTab('history'); fetchHistory(); }}
                        className="btn-ghost px-6 py-3 text-xs uppercase tracking-widest border border-[#8A877E]/50 text-[#8A877E] hover:text-[#EAE8E1]"
                      >
                        History
                      </button>
                    </div>
                  </div>
                ) : !recommendation ? (
                  <div className="text-center py-20">
                    <div className="w-8 h-8 border-2 border-[#8A877E]/30 border-t-[#2D7A4F] rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-[#EAE8E1] uppercase tracking-widest text-sm mb-2">Executing Engine</p>
                    <p className="text-xs text-[#8A877E]">Calculating evapotranspiration loss...</p>
                  </div>
                ) : (
                  <div className="border border-[#8A877E]/30 bg-[#0D0D0C]">
                    {/* Result Header */}
                    <div className="p-10 text-center border-b border-[#8A877E]/30">
                      <div className="inline-block border border-[#8A877E]/30 px-3 py-1 text-[10px] uppercase tracking-widest text-[#8A877E] mb-6">
                        Urgency: <span className={recommendation.urgency === 'Critical' ? 'text-red-400' : 'text-[#4EC97A]'}>{recommendation.urgency}</span>
                      </div>
                      <h2 className={`text-5xl sm:text-6xl font-[Instrument_Serif] ${
                        recommendation.recommendation === 'irrigate' ? 'text-[#EAE8E1]' : 'text-[#8A877E]'
                      }`}>
                        {recommendation.recommendation === 'irrigate' 
                          ? `Irrigate: ${recommendation.amount_mm} mm` 
                          : 'No Irrigation'}
                      </h2>
                    </div>

                    {/* Language & Voice */}
                    <div className="px-8 py-5 border-b border-[#8A877E]/30 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#8A877E]/5">
                      <div className="flex items-center gap-3">
                        <Languages className="w-4 h-4 text-[#8A877E]" />
                        <select 
                          value={selectedLanguage}
                          onChange={e => setSelectedLanguage(e.target.value)}
                          className="select-dark bg-transparent border border-[#8A877E]/50 text-[#EAE8E1] text-xs uppercase tracking-widest py-1.5 px-2 focus:outline-none focus:border-[#2D7A4F]"
                        >
                          {INDIAN_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} className="bg-[#0D0D0C]">
                              {lang.native} ({lang.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleSpeakAdvisory}
                        className={`btn-accent px-4 py-2 text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors ${
                          isSpeaking ? 'bg-[#EAE8E1] text-[#0D0D0C]' : ''
                        }`}
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {isSpeaking ? 'Stop Voice' : 'Listen'}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 sm:p-10 space-y-8">
                      <div className="border border-[#8A877E]/20 p-6 bg-[#0D0D0C]">
                        <p className="text-[10px] text-[#2D7A4F] uppercase tracking-widest mb-3">Advisory Explanation</p>
                        <p className="text-[#EAE8E1] text-base leading-relaxed font-[Instrument_Sans]">
                          {recommendation.translations[selectedLanguage] || recommendation.translations.en}
                        </p>
                      </div>

                      {/* foot-ledger stats grid */}
                      <div className="foot-ledger grid grid-cols-2 sm:grid-cols-4 border border-[#8A877E]/30">
                        <div className="p-4 border-b sm:border-b-0 sm:border-r border-[#8A877E]/30 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] text-[#8A877E] uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Timer className="w-3 h-3" /> Pump
                          </p>
                          <p className="text-xl text-[#EAE8E1] font-[DM_Mono]">{recommendation.pump_runtime_mins || 0}m</p>
                        </div>
                        <div className="p-4 border-b sm:border-b-0 sm:border-r border-[#8A877E]/30 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] text-[#8A877E] uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Gauge className="w-3 h-3" /> Deficit
                          </p>
                          <p className="text-xl text-[#EAE8E1] font-[DM_Mono]">{recommendation.moistureDeficitPct ? recommendation.moistureDeficitPct.toFixed(1) : 0}%</p>
                        </div>
                        <div className="p-4 border-r border-[#8A877E]/30 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] text-[#8A877E] uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Droplet className="w-3 h-3" /> ET Loss
                          </p>
                          <p className="text-xl text-[#EAE8E1] font-[DM_Mono]">{recommendation.etcMm}mm</p>
                        </div>
                        <div className="p-4 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] text-[#8A877E] uppercase tracking-widest mb-1 flex items-center gap-1">
                            <CloudRain className="w-3 h-3" /> Rain
                          </p>
                          <p className="text-xl text-[#EAE8E1] font-[DM_Mono]">{recommendation.effectiveRainMm}mm</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                          onClick={() => handleLogIrrigation('irrigated')} 
                          disabled={submitting}
                          className="btn-accent flex-1 flex justify-center items-center py-4 text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Mark Irrigated
                        </button>
                        <button 
                          onClick={() => handleLogIrrigation('skipped')} 
                          disabled={submitting}
                          className="btn-ghost flex-1 flex justify-center items-center py-4 text-xs uppercase tracking-widest border border-[#8A877E]/50 text-[#8A877E] hover:text-[#EAE8E1]"
                        >
                          <Clock className="w-4 h-4 mr-2" /> Skip
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Moisture Readings */}
                <div>
                  <h3 className="text-xs text-[#EAE8E1] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[#8A877E]/30 pb-2">
                    <Droplet className="w-4 h-4 text-[#8A877E]" /> Readings
                  </h3>
                  {history.readings.length === 0 ? (
                    <div className="text-center py-10 border border-[#8A877E]/20 text-[#8A877E] text-xs uppercase tracking-widest">
                      No readings.
                    </div>
                  ) : (
                    <div className="border border-[#8A877E]/30 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#8A877E]/30 bg-[#8A877E]/5 text-[10px] uppercase tracking-widest text-[#8A877E]">
                            <th className="p-3 font-normal">Date</th>
                            <th className="p-3 font-normal">Moisture</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.readings.slice(0, 10).map((r, i) => (
                            <tr key={r.id} className={`border-b border-[#8A877E]/10 hover:bg-[#8A877E]/5 text-sm ${i === history.readings.length - 1 ? 'border-0' : ''}`}>
                              <td className="p-3 text-[#8A877E] font-[DM_Mono]">{toDate(r.created_at).toLocaleDateString()}</td>
                              <td className="p-3 text-[#EAE8E1] font-[DM_Mono]">{r.moisture_percent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Irrigation Logs */}
                <div>
                  <h3 className="text-xs text-[#EAE8E1] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[#8A877E]/30 pb-2">
                    <CheckCircle className="w-4 h-4 text-[#8A877E]" /> Irrigation
                  </h3>
                  {history.logs.length === 0 ? (
                    <div className="text-center py-10 border border-[#8A877E]/20 text-[#8A877E] text-xs uppercase tracking-widest">
                      No actions.
                    </div>
                  ) : (
                    <div className="border border-[#8A877E]/30 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#8A877E]/30 bg-[#8A877E]/5 text-[10px] uppercase tracking-widest text-[#8A877E]">
                            <th className="p-3 font-normal">Date</th>
                            <th className="p-3 font-normal">Action</th>
                            <th className="p-3 font-normal">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.logs.slice(0, 10).map((r, i) => (
                            <tr key={r.id} className={`border-b border-[#8A877E]/10 hover:bg-[#8A877E]/5 text-sm ${i === history.logs.length - 1 ? 'border-0' : ''}`}>
                              <td className="p-3 text-[#8A877E] font-[DM_Mono]">{toDate(r.logged_at).toLocaleDateString()}</td>
                              <td className="p-3">
                                <span className={`text-[10px] uppercase tracking-widest border px-2 py-0.5 ${
                                  r.action_taken === 'irrigated' ? 'border-[#2D7A4F] text-[#4EC97A]' : 'border-[#8A877E]/50 text-[#8A877E]'
                                }`}>
                                  {r.action_taken}
                                </span>
                              </td>
                              <td className="p-3 text-[#EAE8E1] font-[DM_Mono]">{r.actual_amount_mm || 0}mm</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
