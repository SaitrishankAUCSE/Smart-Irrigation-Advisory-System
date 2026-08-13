import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getFields, addField, logUserAction } from '../services/dataService';
import { PlusCircle, Sprout, Map, LayoutDashboard, Wheat, Leaf, ChevronRight, Droplets, Sun, X, Layers, Activity, CloudSun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CROP_EMOJIS = {
  Rice: '🌾',
  Maize: '🌽',
  Chili: '🌶️',
  Wheat: '🌾',
  Cotton: '☁️',
  Sugarcane: '🎋'
};

const STAGE_COLORS = {
  Germination: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  Vegetative: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Flowering: { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200', dot: 'bg-pink-500' },
  Maturity: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' },
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
        <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-emerald-900/60 text-sm font-medium">Syncing farm plots & soil data...</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Soil & Farm Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-emerald-800/40 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 text-xs font-semibold text-emerald-300">
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Agricultural Advisory • Kharif Season</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Welcome back, {currentUser.name}! 🌾
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-xl">
              Real-time soil moisture monitoring, growth-stage water requirements, and weather-integrated advisory for optimal crop yield.
            </p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowAdd(!showAdd)}
            className={`flex items-center px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg text-sm ${
              showAdd 
                ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:from-amber-400 hover:to-amber-500'
            }`}
          >
            {showAdd ? <><X className="w-4 h-4 mr-2" /> Close Form</> : <><PlusCircle className="w-4 h-4 mr-2" /> Register New Field</>}
          </motion.button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {fields.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-900/10 p-5 shadow-sm">
            <div className="flex items-center text-xs font-bold text-emerald-800/60 uppercase tracking-wider mb-1">
              <Map className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Total Farm Plots
            </div>
            <p className="text-3xl font-black text-emerald-950">{fields.length}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-900/10 p-5 shadow-sm">
            <div className="flex items-center text-xs font-bold text-emerald-800/60 uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5 mr-1 text-amber-600" /> Cultivated Acreage
            </div>
            <p className="text-3xl font-black text-emerald-950">{fields.reduce((s, f) => s + (f.area_acres || 0), 0).toFixed(1)} <span className="text-sm font-normal text-emerald-700">acres</span></p>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-900/10 p-5 shadow-sm">
            <div className="flex items-center text-xs font-bold text-emerald-800/60 uppercase tracking-wider mb-1">
              <Sprout className="w-3.5 h-3.5 mr-1 text-green-600" /> Crop Varieties
            </div>
            <p className="text-3xl font-black text-emerald-950">{[...new Set(fields.map(f => f.crop_type))].length}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-900/10 p-5 shadow-sm">
            <div className="flex items-center text-xs font-bold text-emerald-800/60 uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5 mr-1 text-blue-600" /> Soil Monitoring
            </div>
            <p className="text-lg font-extrabold text-emerald-700 mt-1 flex items-center">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping mr-2" /> Active
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
            <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-lg border border-emerald-900/10 mb-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Sprout className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Register Field Plot Profile</h2>
              </div>

              <form onSubmit={handleAddField} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-900/60 uppercase tracking-wider mb-2">Field Name / Plot ID</label>
                  <input type="text" required className="block w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-gray-900 font-medium" 
                    placeholder="e.g. South Paddy Field A"
                    value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900/60 uppercase tracking-wider mb-2">Crop Variety</label>
                  <select className="block w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-gray-900 font-medium"
                    value={newField.crop_type} onChange={e => setNewField({...newField, crop_type: e.target.value})}>
                    <option>Rice</option>
                    <option>Maize</option>
                    <option>Chili</option>
                    <option>Wheat</option>
                    <option>Cotton</option>
                    <option>Sugarcane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900/60 uppercase tracking-wider mb-2">Total Area (Acres)</label>
                  <input type="number" step="0.1" min="0.1" required className="block w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-gray-900 font-medium"
                    value={newField.area_acres} onChange={e => setNewField({...newField, area_acres: parseFloat(e.target.value) || 0})} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900/60 uppercase tracking-wider mb-2">Current Growth Stage</label>
                  <select className="block w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none text-gray-900 font-medium"
                    value={newField.current_growth_stage} onChange={e => setNewField({...newField, current_growth_stage: e.target.value})}>
                    <option>Germination</option>
                    <option>Vegetative</option>
                    <option>Flowering</option>
                    <option>Maturity</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <button type="submit" disabled={saving} className="px-8 py-3.5 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
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
          className="text-center py-20 bg-white/80 backdrop-blur-md rounded-3xl border border-dashed border-emerald-900/20 shadow-sm"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-5 text-3xl">
            🌾
          </div>
          <h3 className="text-xl font-bold text-emerald-950">No Fields Registered Yet</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm">
            Register your farm plot to get live soil moisture recommendations based on crop variety, growth stage, and rainfall predictions.
          </p>
          <button onClick={() => setShowAdd(true)} className="mt-6 px-6 py-3 bg-emerald-700 text-white font-bold rounded-2xl hover:bg-emerald-800 transition-colors shadow-md text-sm">
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
          const stageStyle = STAGE_COLORS[field.current_growth_stage] || STAGE_COLORS.Vegetative;
          
          return (
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              key={field.id}
            >
              <Link to={`/field/${field.id}`} className="block group">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-900/10 p-6 h-full group-hover:shadow-xl group-hover:border-emerald-500/30 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  
                  {/* Decorative background accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform" />

                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-amber-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                        {emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors">{field.name}</h3>
                        <p className="text-xs font-semibold text-emerald-800/60 uppercase tracking-wider mt-1">{field.area_acres} Acres Plot</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} border`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dot} mr-1.5`} />
                        {field.current_growth_stage}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                        {field.crop_type}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-emerald-600 group-hover:underline">
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
