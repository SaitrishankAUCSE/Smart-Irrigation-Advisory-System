import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getField, getMoistureReadings, getIrrigationLogs, addMoistureReading, addIrrigationLog, logUserAction, toDate } from '../services/dataService';
import { Droplet, CloudRain, Activity, CheckCircle, Clock, ArrowLeft, BarChart3, Thermometer, Wind, AlertTriangle, Sparkles, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SoilVisualizer from '../components/SoilVisualizer';

const CROP_RULES = {
  "Rice": {
    "Germination": { moisture_threshold_percent: 65, water_requirement_mm_per_day: 6.0 },
    "Vegetative": { moisture_threshold_percent: 60, water_requirement_mm_per_day: 8.0 },
    "Flowering": { moisture_threshold_percent: 70, water_requirement_mm_per_day: 10.0 },
    "Maturity": { moisture_threshold_percent: 50, water_requirement_mm_per_day: 5.0 }
  },
  "Maize": {
    "Germination": { moisture_threshold_percent: 55, water_requirement_mm_per_day: 4.0 },
    "Vegetative": { moisture_threshold_percent: 50, water_requirement_mm_per_day: 6.0 },
    "Flowering": { moisture_threshold_percent: 60, water_requirement_mm_per_day: 8.0 },
    "Maturity": { moisture_threshold_percent: 40, water_requirement_mm_per_day: 4.0 }
  },
  "Chili": {
    "Germination": { moisture_threshold_percent: 50, water_requirement_mm_per_day: 3.5 },
    "Vegetative": { moisture_threshold_percent: 45, water_requirement_mm_per_day: 5.0 },
    "Flowering": { moisture_threshold_percent: 55, water_requirement_mm_per_day: 7.0 },
    "Maturity": { moisture_threshold_percent: 40, water_requirement_mm_per_day: 3.5 }
  }
};

const DEFAULT_RULE = { moisture_threshold_percent: 50, water_requirement_mm_per_day: 5.0 };

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
      temperature_c: Math.round(25 + Math.random() * 10),
      rain_probability_percent: Math.round(Math.random() * 50),
      expected_rainfall_mm: Math.round(Math.random() * 5 * 10) / 10,
      humidity_percent: Math.round(55 + Math.random() * 30),
      wind_speed_kmh: Math.round(5 + Math.random() * 15),
      source: 'AgriSense Weather AI'
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

  const loadRecommendation = () => {
    if (!field) return;
    setRecommendation(null);

    const latestMoisture = history.readings.length > 0 ? history.readings[0].moisture_percent : 0;
    const rainProb = weatherData ? weatherData.rain_probability_percent : 20;
    const expRain = weatherData ? weatherData.expected_rainfall_mm : 0;
    
    const crop = field.crop_type;
    const stage = field.current_growth_stage;
    const rule = (CROP_RULES[crop] && CROP_RULES[crop][stage]) ? CROP_RULES[crop][stage] : DEFAULT_RULE;
    
    const threshold = rule.moisture_threshold_percent;
    const dailyNeed = rule.water_requirement_mm_per_day;

    let result;
    if (latestMoisture >= threshold) {
      result = {
        recommendation: "wait",
        amount_mm: 0,
        reason: `Soil moisture (${latestMoisture}%) is above the ${threshold}% threshold for the ${stage} stage of ${crop}. No irrigation needed right now.`,
        threshold,
        dailyNeed,
        moisture: latestMoisture
      };
    } else if (rainProb >= 60 && expRain >= dailyNeed * 0.7) {
      result = {
        recommendation: "wait",
        amount_mm: 0,
        reason: `Rain probability is ${rainProb}% with ${expRain}mm expected — this should cover ~${Math.round((expRain / dailyNeed) * 100)}% of the daily water need. Hold off on irrigation.`,
        threshold,
        dailyNeed,
        moisture: latestMoisture
      };
    } else {
      const deficitFactor = (threshold - latestMoisture) / threshold;
      const recommendedAmount = Math.round((dailyNeed * (1 + deficitFactor)) * 10) / 10;
      result = {
        recommendation: "irrigate",
        amount_mm: recommendedAmount,
        reason: `Soil moisture (${latestMoisture}%) is ${Math.round(threshold - latestMoisture)}% below the ${threshold}% threshold for ${crop} in ${stage} stage. Recommended irrigation: ${recommendedAmount}mm to restore optimal levels.`,
        threshold,
        dailyNeed,
        moisture: latestMoisture
      };
    }
    
    setTimeout(() => setRecommendation(result), 600);
  };

  const handleLogMoisture = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
    try {
      await addIrrigationLog(id, {
        recommendation: recommendation.recommendation,
        recommended_amount_mm: recommendation.amount_mm,
        action_taken: actionTaken,
        actual_amount_mm: actionTaken === 'irrigated' ? recommendation.amount_mm : 0,
        username: currentUser?.name || 'Anonymous'
      });
      logUserAction(currentUser.uid, 'irrigation_action', { field_id: id, action: actionTaken, amount: recommendation.amount_mm });
      setRecommendation(null);
      fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) return null;
  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-emerald-800 text-sm font-bold">Fetching plot telemetry...</p>
      </div>
    </div>
  );
  if (!field) return (
    <div className="text-center py-20 bg-white rounded-3xl border border-emerald-200 shadow-sm">
      <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Field Plot Not Found</h2>
      <Link to="/" className="mt-4 inline-block text-emerald-700 hover:underline font-bold text-sm">← Back to Dashboard</Link>
    </div>
  );

  const tabs = [
    { key: 'log', label: 'Log Reading', icon: Droplet },
    { key: 'recommendation', label: 'AI Advisory Engine', icon: Activity },
    { key: 'history', label: 'History & Logs', icon: Clock },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="w-11 h-11 bg-white border border-emerald-200 rounded-2xl flex items-center justify-center hover:bg-emerald-50 transition-colors shadow-sm text-emerald-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{field.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {field.crop_type}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-600 font-semibold">{field.current_growth_stage} stage</span>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-600 font-semibold">{field.area_acres} acres</span>
            </div>
          </div>
        </div>
        <Link to={`/field/${id}/analytics`} className="px-5 py-3 bg-emerald-700 text-white rounded-2xl hover:bg-emerald-800 flex items-center shadow-lg transition-all font-black text-sm">
          <BarChart3 className="w-4 h-4 mr-2" />
          Water Analytics
        </Link>
      </div>

      {/* Weather Telemetry Strip */}
      {weatherData && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-100 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <span className="font-extrabold text-emerald-800 uppercase tracking-widest flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Weather Telemetry
            </span>
            <div className="flex items-center gap-6 font-bold">
              <div className="flex items-center gap-1.5 text-amber-800">
                <Thermometer className="w-4 h-4 text-amber-600" />
                <span>{weatherData.temperature_c}°C</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-800">
                <CloudRain className="w-4 h-4 text-blue-600" />
                <span>{weatherData.rain_probability_percent}% Rain</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-800">
                <Droplet className="w-4 h-4 text-teal-600" />
                <span>{weatherData.expected_rainfall_mm}mm Rain Expected</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Wind className="w-4 h-4 text-slate-500" />
                <span>{weatherData.wind_speed_kmh} km/h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 shadow-xl overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-emerald-100">
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
                className={`flex-1 py-4 text-center font-black transition-all text-sm flex items-center justify-center gap-2 ${
                  activeTab === tab.key 
                    ? 'text-emerald-800 border-b-2 border-emerald-600 bg-emerald-50/60' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* LOG TAB */}
              {activeTab === 'log' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  <SoilVisualizer moisturePercent={history.readings.length > 0 ? history.readings[0].moisture_percent : 0} />
                  
                  <div className="space-y-6">
                    <form onSubmit={handleLogMoisture} className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Log Soil Moisture (%)</label>
                          <span className="text-xs text-amber-700 font-extrabold">1-Click Presets for Demo:</span>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Droplet className="h-5 w-5 text-blue-500" />
                          </div>
                          <input 
                            type="number" min="0" max="100" step="0.1" required
                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xl font-black text-slate-900 placeholder-slate-400"
                            placeholder="e.g. 45"
                            value={moisture} onChange={e => setMoisture(e.target.value)}
                          />
                        </div>
                        
                        {/* Demo Presets */}
                        <div className="flex gap-2.5 mt-3">
                          <button type="button" onClick={() => setMoisture('25')} className="flex-1 py-2 px-3 bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 text-xs font-black rounded-xl border border-amber-300 transition-colors">
                            Low (25%)
                          </button>
                          <button type="button" onClick={() => setMoisture('65')} className="flex-1 py-2 px-3 bg-emerald-100/80 hover:bg-emerald-200/80 text-emerald-900 text-xs font-black rounded-xl border border-emerald-300 transition-colors">
                            Optimal (65%)
                          </button>
                          <button type="button" onClick={() => setMoisture('15')} className="flex-1 py-2 px-3 bg-red-100/80 hover:bg-red-200/80 text-red-900 text-xs font-black rounded-xl border border-red-300 transition-colors">
                            Critical (15%)
                          </button>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={submitting || !moisture}
                        className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {submitting ? 'Saving Telemetry...' : 'Save & Get Advisory'}
                      </button>
                    </form>

                    {/* Requirement Card */}
                    <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/80 space-y-1">
                      <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Agronomic Rule Target</p>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        <strong>{field.crop_type}</strong> ({field.current_growth_stage}) requires moisture &gt;{' '}
                        <strong className="text-emerald-900 font-extrabold">{(CROP_RULES[field.crop_type]?.[field.current_growth_stage] || DEFAULT_RULE).moisture_threshold_percent}%</strong>{' '}
                        ({(CROP_RULES[field.crop_type]?.[field.current_growth_stage] || DEFAULT_RULE).water_requirement_mm_per_day}mm/day)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* RECOMMENDATION TAB */}
              {activeTab === 'recommendation' && (
                <div className="max-w-2xl mx-auto">
                  {!recommendation ? (
                    <div className="text-center py-16 flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
                      <p className="text-emerald-900 font-black">Running advisory engine...</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Combining soil moisture + rain predictions + crop stage rules</p>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`rounded-3xl border-2 overflow-hidden shadow-xl ${
                        recommendation.recommendation === 'irrigate' 
                          ? 'border-blue-200 bg-white' 
                          : 'border-emerald-200 bg-white'
                      }`}
                    >
                      {/* Header */}
                      <div className={`p-8 text-center ${
                        recommendation.recommendation === 'irrigate' 
                          ? 'bg-gradient-to-b from-blue-50 to-white' 
                          : 'bg-gradient-to-b from-emerald-50 to-white'
                      }`}>
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                          recommendation.recommendation === 'irrigate' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {recommendation.recommendation === 'irrigate' 
                            ? <Droplet className="w-8 h-8" />
                            : <CheckCircle className="w-8 h-8" />
                          }
                        </div>
                        <h2 className={`text-4xl sm:text-5xl font-black tracking-tight ${
                          recommendation.recommendation === 'irrigate' ? 'text-blue-700' : 'text-emerald-700'
                        }`}>
                          {recommendation.recommendation === 'irrigate' 
                            ? `Irrigate: ${recommendation.amount_mm} mm` 
                            : 'No Irrigation Needed'}
                        </h2>
                      </div>

                      {/* Details */}
                      <div className="p-6 sm:p-8 space-y-6">
                        <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/60 font-medium">{recommendation.reason}</p>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                            <p className="text-[10px] text-slate-500 font-extrabold uppercase">Moisture</p>
                            <p className="text-lg font-black text-slate-900">{recommendation.moisture}%</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                            <p className="text-[10px] text-slate-500 font-extrabold uppercase">Threshold</p>
                            <p className="text-lg font-black text-slate-900">{recommendation.threshold}%</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                            <p className="text-[10px] text-slate-500 font-extrabold uppercase">Daily Need</p>
                            <p className="text-lg font-black text-slate-900">{recommendation.dailyNeed}mm</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleLogIrrigation('irrigated')} 
                            disabled={submitting}
                            className="flex-1 flex justify-center items-center px-5 py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black shadow-lg transition-all disabled:opacity-50 text-sm"
                          >
                            <CheckCircle className="w-5 h-5 mr-2" /> Mark Irrigated
                          </button>
                          <button 
                            onClick={() => handleLogIrrigation('skipped')} 
                            disabled={submitting}
                            className="flex-1 flex justify-center items-center px-5 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold border border-slate-200 hover:bg-slate-200 transition-all text-sm"
                          >
                            <Clock className="w-5 h-5 mr-2" /> Skip
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Moisture Readings */}
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center">
                      <Droplet className="w-4 h-4 mr-2 text-blue-600" /> Soil Moisture Readings
                    </h3>
                    {history.readings.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
                        No readings logged yet.
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <table className="min-w-full divide-y divide-slate-100">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="py-3 pl-4 pr-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Date</th>
                              <th className="px-3 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Moisture</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {history.readings.slice(0, 10).map(r => (
                              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                <td className="whitespace-nowrap py-3 pl-4 pr-3 text-xs text-slate-600 font-medium">{toDate(r.created_at).toLocaleDateString()}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-sm font-black text-blue-600">{r.moisture_percent}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Irrigation Logs */}
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Irrigation Actions
                    </h3>
                    {history.logs.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
                        No irrigation actions logged yet.
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <table className="min-w-full divide-y divide-slate-100">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="py-3 pl-4 pr-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Date</th>
                              <th className="px-3 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Action</th>
                              <th className="px-3 py-3 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {history.logs.slice(0, 10).map(r => (
                              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                <td className="whitespace-nowrap py-3 pl-4 pr-3 text-xs text-slate-600 font-medium">{toDate(r.logged_at).toLocaleDateString()}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-xs">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    r.action_taken === 'irrigated' 
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {r.action_taken === 'irrigated' ? '💧 Irrigated' : '⏭ Skipped'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-xs font-black text-slate-900">{r.actual_amount_mm || 0}mm</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
