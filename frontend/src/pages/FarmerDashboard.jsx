import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getFields, addField, logUserAction } from '../services/dataService';
import { PlusCircle, Sprout, Map, LayoutDashboard, ChevronRight, Droplets, Sun, X, Layers, Activity, CloudSun, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CROP_EMOJIS = {
  Rice: '🌾',
  Maize: '🌽',
  Chili: '🌶️',
  Wheat: '🌾',
  Cotton: '☁️',
  Sugarcane: '🎋'
};

const STAGE_STYLES = {
  Germination: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  Vegetative: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  Flowering: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30', dot: 'bg-pink-400' },
  Maturity: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', dot: 'bg-orange-400' },
};

export default function FarmerDashboard() {
  const { currentUser } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState({
    name: '', crop_type: 'Rice', area_acres: 1.0, current_growth_stage: 'Vegetative', soil_type: 'Loamy Soil'
  });

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
      setShowAdd(false);
      setNewField({ name: '', crop_type: 'Rice', area_acres: 1.0, current_growth_stage: 'Vegetative', soil_type: 'Loamy Soil' });
      fetchFields();
    } catch (err) {
      console.error(err);
      alert("Failed to add field");
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) return null;

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-emerald-300 text-sm font-medium tracking-wide">Syncing farm plots & soil data...</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Live Agricultural Ticker */}
      <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl border border-emerald-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-200 shadow-lg overflow-x-auto">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold text-emerald-400 uppercase tracking-widest text-[10px]">Live Farm Alert:</span>
          <span>Optimal sowing & irrigation window active for Kharif crops</span>
        </div>
        <div className="hidden md:flex items-center space-x-4 text-emerald-400/80 font-medium">
          <span>🌡️ Soil Temp: 27°C</span>
          <span>•</span>
          <span>💧 Moisture Index: 92%</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl p-8 sm:p-10 overflow-hidden border border-emerald-500/30 shadow-2xl bg-gradient-to-r from-emerald-900/90 via-teal-950/90 to-amber-950/90 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Irrigation Advisory Hub</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Welcome, {currentUser.name}! 🌾
            </h1>
            <p className="text-emerald-200/80 text-sm max-w-xl leading-relaxed">
              Real-time soil moisture monitoring, growth-stage water requirements, and weather forecast integration for optimal farm yield.
            </p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.04, boxShadow: "0 0 25px rgba(245, 158, 11, 0.4)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowAdd(!showAdd)}
            className={`flex items-center px-6 py-4 rounded-2xl font-bold transition-all shadow-xl text-sm ${
              showAdd 
                ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:from-amber-400 hover:to-amber-500'
            }`}
          >
            {showAdd ? <><X className="w-4 h-4 mr-2" /> Close Form</> : <><PlusCircle className="w-4 h-4 mr-2" /> Register New Field Plot</>}
          </motion.button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {fields.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-emerald-950/40 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-5 shadow-lg">
            <div className="flex items-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider mb-1">
              <Map className="w-4 h-4 mr-1.5 text-emerald-400" /> Total Farm Plots
            </div>
            <p className="text-3xl font-black text-white">{fields.length}</p>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-5 shadow-lg">
            <div className="flex items-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4 mr-1.5 text-amber-400" /> Total Acreage
            </div>
            <p className="text-3xl font-black text-white">
              {fields.reduce((s, f) => s + (f.area_acres || 0), 0).toFixed(1)} <span className="text-sm font-medium text-emerald-300">acres</span>
            </p>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-5 shadow-lg">
            <div className="flex items-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider mb-1">
              <Sprout className="w-4 h-4 mr-1.5 text-green-400" /> Crop Varieties
            </div>
            <p className="text-3xl font-black text-white">{[...new Set(fields.map(f => f.crop_type))].length}</p>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-5 shadow-lg">
            <div className="flex items-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4 mr-1.5 text-blue-400" /> Advisory Engine
            </div>
            <p className="text-lg font-black text-emerald-300 mt-1 flex items-center">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping mr-2" /> Active
            </p>
          </div>
        </div>
      )}

      {/* Add Field Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-emerald-950/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-emerald-500/30 mb-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/30">
                  <Sprout className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Register Field Plot Profile</h2>
              </div>

              <form onSubmit={handleAddField} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-300/80 uppercase tracking-wider mb-2">Field Name / Plot ID</label>
                  <input type="text" required className="block w-full rounded-2xl px-4 py-3.5 bg-slate-900/90 border border-emerald-500/30 focus:ring-2 focus:ring-emerald-400 focus:outline-none text-white font-medium placeholder-gray-500" 
                    placeholder="e.g. South Paddy Field A"
                    value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-300/80 uppercase tracking-wider mb-2">Crop Variety</label>
                  <select className="block w-full rounded-2xl px-4 py-3.5 bg-slate-900/90 border border-emerald-500/30 focus:ring-2 focus:ring-emerald-400 focus:outline-none text-white font-medium"
                    value={newField.crop_type} onChange={e => setNewField({...newField, crop_type: e.target.value})}>
                    <option className="bg-slate-900">Rice</option>
                    <option className="bg-slate-900">Maize</option>
                    <option className="bg-slate-900">Chili</option>
                    <option className="bg-slate-900">Wheat</option>
                    <option className="bg-slate-900">Cotton</option>
                    <option className="bg-slate-900">Sugarcane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-300/80 uppercase tracking-wider mb-2">Total Area (Acres)</label>
                  <input type="number" step="0.1" min="0.1" required className="block w-full rounded-2xl px-4 py-3.5 bg-slate-900/90 border border-emerald-500/30 focus:ring-2 focus:ring-emerald-400 focus:outline-none text-white font-medium"
                    value={newField.area_acres} onChange={e => setNewField({...newField, area_acres: parseFloat(e.target.value) || 0})} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-300/80 uppercase tracking-wider mb-2">Current Growth Stage</label>
                  <select className="block w-full rounded-2xl px-4 py-3.5 bg-slate-900/90 border border-emerald-500/30 focus:ring-2 focus:ring-emerald-400 focus:outline-none text-white font-medium"
                    value={newField.current_growth_stage} onChange={e => setNewField({...newField, current_growth_stage: e.target.value})}>
                    <option className="bg-slate-900">Germination</option>
                    <option className="bg-slate-900">Vegetative</option>
                    <option className="bg-slate-900">Flowering</option>
                    <option className="bg-slate-900">Maturity</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <button type="submit" disabled={saving} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    {saving ? 'Registering...' : 'Save Field Profile'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {fields.length === 0 && !showAdd && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-emerald-950/40 backdrop-blur-xl rounded-3xl border border-dashed border-emerald-500/30 shadow-xl"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 text-4xl">
            🌾
          </div>
          <h3 className="text-2xl font-bold text-white">No Fields Registered Yet</h3>
          <p className="text-emerald-200/70 mt-2 max-w-md mx-auto text-sm">
            Register your farm plot to get live soil moisture recommendations based on crop variety, growth stage, and rainfall predictions.
          </p>
          <button onClick={() => setShowAdd(true)} className="mt-6 px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all shadow-xl text-sm">
            <PlusCircle className="w-4 h-4 mr-2 inline" /> Register Your First Field Plot
          </button>
        </motion.div>
      )}

      {/* Field Cards Grid */}
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {fields.map(field => {
          const emoji = CROP_EMOJIS[field.crop_type] || '🌱';
          const stageStyle = STAGE_STYLES[field.current_growth_stage] || STAGE_STYLES.Vegetative;
          
          return (
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              key={field.id}
            >
              <Link to={`/field/${field.id}`} className="block group">
                <div className="bg-emerald-950/50 backdrop-blur-xl rounded-3xl border border-emerald-500/20 p-7 h-full group-hover:shadow-2xl group-hover:border-emerald-400/50 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  
                  {/* Decorative ambient gradient */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-800/80 to-amber-900/80 rounded-2xl border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner">
                        {emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">{field.name}</h3>
                        <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mt-1">{field.area_acres} Acres Plot</p>
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-900/40 rounded-xl border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-emerald-950 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-emerald-500/10 flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} border`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dot} mr-1.5`} />
                        {field.current_growth_stage}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-500/20">
                        {field.crop_type}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-amber-400 group-hover:underline">
                      View Profile →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
