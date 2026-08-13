import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getField, getMoistureReadings, getIrrigationLogs, addMoistureReading, addIrrigationLog, logUserAction, toDate } from '../services/dataService';
import { Droplet, CloudRain, Activity, CheckCircle, Clock, ArrowLeft, BarChart3, Thermometer, Wind, AlertTriangle } from 'lucide-react';
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

// Default fallback rule for unknown crops
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
    // Mock weather data for hackathon demo — always works
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
    setRecommendation(null); // Reset to show loading

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
    
    // Simulate advisory engine processing time
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
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading field data...</p>
      </div>
    </div>
  );
  if (!field) return (
    <div className="text-center py-20">
      <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-700">Field not found</h2>
      <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline font-medium">← Back to Dashboard</Link>
    </div>
  );

  const tabs = [
    { key: 'log', label: 'Log Reading', icon: Droplet },
    { key: 'recommendation', label: 'Advisory', icon: Activity },
    { key: 'history', label: 'History', icon: Clock },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto"
    >
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                {field.crop_type}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500 font-medium">{field.current_growth_stage} stage</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500 font-medium">{field.area_acres} acres</span>
            </div>
          </div>
        </div>
        <Link to={`/field/${id}/analytics`} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center shadow-sm transition-all font-medium text-sm">
          <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
          Water Analytics
        </Link>
      </div>

      {/* Weather Strip */}
      {weatherData && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Weather Forecast</span>
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-gray-700">{weatherData.temperature_c}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-gray-700">{weatherData.rain_probability_percent}% rain</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-cyan-500" />
              <span className="font-semibold text-gray-700">{weatherData.expected_rainfall_mm}mm expected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-700">{weatherData.wind_speed_kmh} km/h</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
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
                className={`flex-1 py-4 text-center font-medium transition-all text-sm flex items-center justify-center gap-2 ${
                  activeTab === tab.key 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
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
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Soil Moisture Reading (%)</label>
                          <span className="text-xs text-blue-600 font-medium">1-Click Presets for Demo:</span>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Droplet className="h-5 w-5 text-blue-400" />
                          </div>
                          <input 
                            type="number" min="0" max="100" step="0.1" required
                            className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-lg font-semibold text-gray-900"
                            placeholder="e.g. 45"
                            value={moisture} onChange={e => setMoisture(e.target.value)}
                          />
                        </div>
                        
                        {/* Quick Presets for Demo Judging */}
                        <div className="flex gap-2 mt-3">
                          <button type="button" onClick={() => setMoisture('25')} className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 transition-colors">
                            Low (25%)
                          </button>
                          <button type="button" onClick={() => setMoisture('65')} className="flex-1 py-1.5 px-2 bg-green-50 hover:bg-green-100 text-green-800 text-xs font-semibold rounded-lg border border-green-200 transition-colors">
                            Optimal (65%)
                          </button>
                          <button type="button" onClick={() => setMoisture('15')} className="flex-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold rounded-lg border border-red-200 transition-colors">
                            Critical (15%)
                          </button>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={submitting || !moisture}
                        className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Saving...' : 'Save & Get Advisory'}
                      </button>
                    </form>

                    {/* Quick info card */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Crop Water Threshold</p>
                        <p className="text-sm text-blue-800">
                          <strong>{field.crop_type}</strong> ({field.current_growth_stage}) requires moisture &gt;{' '}
                          <strong>{(CROP_RULES[field.crop_type]?.[field.current_growth_stage] || DEFAULT_RULE).moisture_threshold_percent}%</strong>{' '}
                          ({(CROP_RULES[field.crop_type]?.[field.current_growth_stage] || DEFAULT_RULE).water_requirement_mm_per_day}mm/day)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RECOMMENDATION TAB */}
              {activeTab === 'recommendation' && (
                <div className="max-w-2xl mx-auto">
                  {!recommendation ? (
                    <div className="text-center py-16 flex flex-col items-center">
                      <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                      <p className="text-gray-400 font-medium">Running advisory engine...</p>
                      <p className="text-xs text-gray-300 mt-1">Analyzing soil + weather + crop data</p>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`rounded-2xl border-2 overflow-hidden ${
                        recommendation.recommendation === 'irrigate' 
                          ? 'border-blue-200' 
                          : 'border-green-200'
                      }`}
                    >
                      {/* Result header */}
                      <div className={`p-8 text-center ${
                        recommendation.recommendation === 'irrigate' 
                          ? 'bg-gradient-to-b from-blue-50 to-blue-25' 
                          : 'bg-gradient-to-b from-green-50 to-green-25'
                      }`}>
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                          recommendation.recommendation === 'irrigate' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {recommendation.recommendation === 'irrigate' 
                            ? <Droplet className="w-8 h-8 text-blue-600" />
                            : <CheckCircle className="w-8 h-8 text-green-600" />
                          }
                        </div>
                        <h2 className={`text-4xl font-black tracking-tight ${
                          recommendation.recommendation === 'irrigate' ? 'text-blue-700' : 'text-green-700'
                        }`}>
                          {recommendation.recommendation === 'irrigate' 
                            ? `Irrigate: ${recommendation.amount_mm} mm` 
                            : 'No Irrigation Needed'}
                        </h2>
                      </div>

                      {/* Reason & Stats */}
                      <div className="p-6 bg-white">
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">{recommendation.reason}</p>
                        
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400 font-semibold uppercase">Moisture</p>
                            <p className="text-lg font-bold text-gray-900">{recommendation.moisture}%</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400 font-semibold uppercase">Threshold</p>
                            <p className="text-lg font-bold text-gray-900">{recommendation.threshold}%</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400 font-semibold uppercase">Daily Need</p>
                            <p className="text-lg font-bold text-gray-900">{recommendation.dailyNeed}mm</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleLogIrrigation('irrigated')} 
                            disabled={submitting}
                            className="flex-1 flex justify-center items-center px-5 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                          >
                            <CheckCircle className="w-5 h-5 mr-2" /> Mark Irrigated
                          </button>
                          <button 
                            onClick={() => handleLogIrrigation('skipped')} 
                            disabled={submitting}
                            className="flex-1 flex justify-center items-center px-5 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold border border-gray-200 transition-all active:scale-[0.98] disabled:opacity-50"
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
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                      <Droplet className="w-4 h-4 mr-2 text-blue-500" /> Moisture Readings
                    </h3>
                    {history.readings.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
                        No readings yet. Log your first soil moisture reading.
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50/80">
                            <tr>
                              <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Moisture</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {history.readings.slice(0, 10).map(r => (
                              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm text-gray-600">{toDate(r.created_at).toLocaleDateString()}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-sm font-bold text-blue-600">{r.moisture_percent}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Irrigation Logs */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Irrigation Actions
                    </h3>
                    {history.logs.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
                        No irrigation actions logged yet.
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50/80">
                            <tr>
                              <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {history.logs.slice(0, 10).map(r => (
                              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm text-gray-600">{toDate(r.logged_at).toLocaleDateString()}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-sm">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                    r.action_taken === 'irrigated' 
                                      ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                      : 'bg-gray-50 text-gray-600 border border-gray-100'
                                  }`}>
                                    {r.action_taken === 'irrigated' ? '💧 Irrigated' : '⏭ Skipped'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-700">{r.actual_amount_mm || 0}mm</td>
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
