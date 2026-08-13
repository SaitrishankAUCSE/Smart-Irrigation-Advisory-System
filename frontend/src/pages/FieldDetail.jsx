import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Droplet, CloudRain, Activity, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SoilVisualizer from '../components/SoilVisualizer';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function FieldDetail() {
  const { id } = useParams();
  const [field, setField] = useState(null);
  const [activeTab, setActiveTab] = useState('log');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Forms
  const [moisture, setMoisture] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState({ readings: [], logs: [] });

  const fetchField = async () => {
    try {
      const docRef = doc(db, 'fields', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setField({ id: docSnap.id, ...docSnap.data() });
      } else {
        setField(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    try {
      const res = await axios.get(`${API_BASE}/weather?id=${id}`);
      setWeatherData(res.data);
    } catch (err) {
      console.error("Failed to fetch weather", err);
      // Fallback mock weather so the UI always shows something
      setWeatherData({ rain_probability_percent: 20, expected_rainfall_mm: 0, temperature_c: 30, source: 'mock' });
    }
  };

  const loadRecommendation = () => {
    if (!field) return;
    try {
      // Local fallback rules for instant demo performance
      const CROP_RULES = {
        "Rice": {
            "Vegetative": {"moisture_threshold_percent": 60, "water_requirement_mm_per_day": 8.0},
            "Flowering": {"moisture_threshold_percent": 70, "water_requirement_mm_per_day": 10.0},
            "Maturity": {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 5.0}
        },
        "Maize": {
            "Vegetative": {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 6.0},
            "Flowering": {"moisture_threshold_percent": 60, "water_requirement_mm_per_day": 8.0},
            "Maturity": {"moisture_threshold_percent": 40, "water_requirement_mm_per_day": 4.0}
        },
        "Chili": {
            "Vegetative": {"moisture_threshold_percent": 45, "water_requirement_mm_per_day": 5.0},
            "Flowering": {"moisture_threshold_percent": 55, "water_requirement_mm_per_day": 7.0},
            "Maturity": {"moisture_threshold_percent": 40, "water_requirement_mm_per_day": 3.5}
        }
      };

      const latestMoisture = history.readings.length > 0 ? history.readings[0].moisture_percent : 0;
      const rainProb = weatherData ? weatherData.rain_probability_percent : 20;
      const expRain = weatherData ? weatherData.expected_rainfall_mm : 0;
      
      const crop = field.crop_type;
      const stage = field.current_growth_stage;
      
      const rule = (CROP_RULES[crop] && CROP_RULES[crop][stage]) ? CROP_RULES[crop][stage] : {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 5.0};
      
      const threshold = rule.moisture_threshold_percent;
      const dailyNeed = rule.water_requirement_mm_per_day;

      let result = null;
      if (latestMoisture >= threshold) {
        result = { recommendation: "wait", amount_mm: 0, reason: "Soil moisture is above threshold for this growth stage." };
      } else if (rainProb >= 60 && expRain >= dailyNeed * 0.7) {
        result = { recommendation: "wait", amount_mm: 0, reason: "High rain probability expected to cover most of the water need." };
      } else {
        const deficitFactor = (threshold - latestMoisture) / threshold;
        const recommendedAmount = Math.round((dailyNeed * (1 + deficitFactor)) * 10) / 10;
        result = { recommendation: "irrigate", amount_mm: recommendedAmount, reason: `Soil moisture ${latestMoisture}% is below the ${threshold}% threshold for this stage.` };
      }
      
      setTimeout(() => {
        setRecommendation(result);
      }, 800); // add a slight delay so they can see the 'loading' animation for the demo effect
    } catch (err) {
      console.error(err);
      setRecommendation(null);
    }
  };

  const fetchHistory = async () => {
    try {
      const mQ = query(collection(db, 'fields', id, 'moistureReadings'), orderBy('created_at', 'desc'));
      const mSnap = await getDocs(mQ);
      const mData = mSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const iQ = query(collection(db, 'fields', id, 'irrigationLogs'), orderBy('logged_at', 'desc'));
      const iSnap = await getDocs(iQ);
      const iData = iSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setHistory({ readings: mData, logs: iData });
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

  const handleLogMoisture = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'fields', id, 'moistureReadings'), {
        moisture_percent: parseFloat(moisture),
        created_at: serverTimestamp(),
        source: 'manual',
        username: currentUser?.name || 'Anonymous'
      });
      
      alert("Reading logged successfully!");
      setMoisture('');
      setActiveTab('recommendation');
      await fetchHistory(); // Refresh visualizer data
      // Recommendation must be loaded AFTER history state updates
      setTimeout(() => loadRecommendation(), 100);
    } catch (err) {
      console.error(err);
      alert("Failed to log moisture");
    }
  };

  const handleLogIrrigation = async (actionTaken) => {
    try {
      await addDoc(collection(db, 'fields', id, 'irrigationLogs'), {
        recommendation: recommendation.recommendation,
        recommended_amount_mm: recommendation.amount_mm,
        action_taken: actionTaken,
        actual_amount_mm: actionTaken === 'irrigated' ? recommendation.amount_mm : 0,
        logged_at: serverTimestamp(),
        username: currentUser?.name || 'Anonymous'
      });
      
      alert("Action logged successfully!");
      setRecommendation(null);
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!field) return <div className="p-8 text-center text-gray-500">Field not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{field.name}</h1>
          <p className="text-gray-600">{field.crop_type} • {field.current_growth_stage}</p>
        </div>
        <Link to={`/field/${id}/analytics`} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 flex items-center shadow-md transition-all">
          <Activity className="w-5 h-5 mr-2" />
          View Analytics
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('log')} className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'log' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>Log Reading</button>
          <button onClick={() => { setActiveTab('recommendation'); loadRecommendation(); }} className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'recommendation' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>Recommendation</button>
          <button onClick={() => { setActiveTab('history'); fetchHistory(); }} className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>History</button>
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'log' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
                  {/* Left Column: Visualizer */}
                  <div>
                    <SoilVisualizer moisturePercent={history.readings.length > 0 ? history.readings[0].moisture_percent : 0} />
                  </div>
                  
                  {/* Right Column: Input & Weather */}
                  <div className="space-y-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl flex items-start border border-blue-100 shadow-sm">
                      <CloudRain className="w-8 h-8 text-blue-500 mr-4 mt-1" />
                      <div>
                        <h3 className="font-semibold text-blue-900 text-lg">Forecast</h3>
                        {weatherData ? (
                          <div className="text-blue-800 text-sm mt-2 space-y-1">
                            <p className="flex justify-between w-48"><span>Rain Probability:</span> <strong>{weatherData.rain_probability_percent}%</strong></p>
                            <p className="flex justify-between w-48"><span>Expected Rainfall:</span> <strong>{weatherData.expected_rainfall_mm} mm</strong></p>
                          </div>
                        ) : (
                          <p className="text-sm text-blue-600 mt-2 animate-pulse">Fetching weather...</p>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleLogMoisture} className="space-y-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Log New Soil Moisture (%)</label>
                        <div className="mt-2 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Droplet className="h-5 w-5 text-gray-400" />
                          </div>
                          <input 
                            type="number" min="0" max="100" step="0.1" required
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-lg border-gray-300 rounded-lg p-3 border shadow-inner bg-gray-50"
                            placeholder="e.g. 45"
                            value={moisture} onChange={e => setMoisture(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                        Save & Analyze Need
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'recommendation' && (
                <div className="max-w-2xl mx-auto">
                  {!recommendation ? (
                    <div className="text-center py-16 text-gray-500 flex flex-col items-center">
                      <Activity className="w-10 h-10 mb-4 animate-spin text-blue-400" />
                      <p>Running advisory engine...</p>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`p-10 rounded-2xl border-2 shadow-lg ${recommendation.recommendation === 'irrigate' ? 'bg-gradient-to-b from-blue-50 to-white border-blue-200' : 'bg-gradient-to-b from-green-50 to-white border-green-200'}`}
                    >
                      <div className="text-center">
                        <h2 className={`text-5xl font-black mb-4 tracking-tight ${recommendation.recommendation === 'irrigate' ? 'text-blue-700' : 'text-green-700'}`}>
                          {recommendation.recommendation === 'irrigate' ? `Irrigate: ${recommendation.amount_mm} mm` : 'Wait'}
                        </h2>
                        <p className="text-lg text-gray-700 mt-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100 inline-block">
                          {recommendation.reason}
                        </p>
                      </div>
                      
                      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => handleLogIrrigation('irrigated')} className="flex-1 flex justify-center items-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-md transition-transform active:scale-95">
                          <CheckCircle className="w-6 h-6 mr-2" /> Mark Irrigated
                        </button>
                        <button onClick={() => handleLogIrrigation('skipped')} className="flex-1 flex justify-center items-center px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold border border-gray-300 shadow-sm transition-transform active:scale-95">
                          <Clock className="w-6 h-6 mr-2" /> Skip For Now
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800"><Droplet className="w-5 h-5 mr-2 text-blue-500" /> Moisture Readings</h3>
                    <div className="overflow-hidden shadow-sm border border-gray-200 rounded-xl bg-white">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3.5 pl-5 pr-3 text-left text-sm font-semibold text-gray-900">Date</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Moisture</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {history.readings.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                              <td className="whitespace-nowrap py-4 pl-5 pr-3 text-sm text-gray-900">{r.created_at ? new Date(r.created_at.toDate ? r.created_at.toDate() : Date.now()).toLocaleDateString() : 'Just now'}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-blue-600">{r.moisture_percent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800"><CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Irrigation Actions</h3>
                    <div className="overflow-hidden shadow-sm border border-gray-200 rounded-xl bg-white">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3.5 pl-5 pr-3 text-left text-sm font-semibold text-gray-900">Date</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {history.logs.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                              <td className="whitespace-nowrap py-4 pl-5 pr-3 text-sm text-gray-900">{r.logged_at ? new Date(r.logged_at.toDate ? r.logged_at.toDate() : Date.now()).toLocaleDateString() : 'Just now'}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                                <span className={r.action_taken === 'irrigated' ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800' : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'}>
                                  {r.action_taken}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
