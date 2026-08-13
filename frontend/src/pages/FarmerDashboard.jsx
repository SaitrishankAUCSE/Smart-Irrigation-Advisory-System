import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getFields, addField, logUserAction } from '../services/dataService';
import { PlusCircle, Sprout, Map, LayoutDashboard, Wheat, Leaf, ChevronRight, Droplets, Sun, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CROP_ICONS = {
  Rice: Wheat,
  Maize: Sprout,
  Chili: Leaf,
};

const STAGE_COLORS = {
  Germination: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  Vegetative: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-400' },
  Flowering: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-400' },
  Maturity: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
};

export default function FarmerDashboard() {
  const { currentUser } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState({
    name: '', crop_type: 'Rice', area_acres: 1.0, current_growth_stage: 'Vegetative'
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
      setNewField({ name: '', crop_type: 'Rice', area_acres: 1.0, current_growth_stage: 'Vegetative' });
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
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading your fields...</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center tracking-tight">
            <LayoutDashboard className="w-7 h-7 mr-3 text-blue-600" />
            My Fields
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your crop fields and get irrigation advisories</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(!showAdd)}
          className={`flex items-center px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
            showAdd 
              ? 'bg-gray-100 text-gray-700 border border-gray-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showAdd ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><PlusCircle className="w-4 h-4 mr-2" /> Register Field</>}
        </motion.button>
      </div>

      {/* Quick Stats */}
      {fields.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Fields</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{fields.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Area</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{fields.reduce((s, f) => s + (f.area_acres || 0), 0).toFixed(1)} <span className="text-sm font-normal text-gray-500">acres</span></p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Crops</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{[...new Set(fields.map(f => f.crop_type))].length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Farmer</p>
            <p className="text-lg font-bold text-gray-900 mt-1 truncate">{currentUser.name}</p>
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
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
              <h2 className="text-lg font-bold mb-5 text-gray-800">Register New Field</h2>
              <form onSubmit={handleAddField} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Field Name / Plot ID</label>
                  <input type="text" required className="block w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-gray-900 font-medium" 
                    placeholder="e.g. North Plot A"
                    value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Crop Variety</label>
                  <select className="block w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-gray-900 font-medium"
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Area (Acres)</label>
                  <input type="number" step="0.1" min="0.1" required className="block w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-gray-900 font-medium"
                    value={newField.area_acres} onChange={e => setNewField({...newField, area_acres: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Growth Stage</label>
                  <select className="block w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-gray-900 font-medium"
                    value={newField.current_growth_stage} onChange={e => setNewField({...newField, current_growth_stage: e.target.value})}>
                    <option>Germination</option>
                    <option>Vegetative</option>
                    <option>Flowering</option>
                    <option>Maturity</option>
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <button type="submit" disabled={saving} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? 'Saving...' : 'Save Field Profile'}
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Sprout className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700">No Fields Registered</h3>
          <p className="text-gray-400 mt-2 max-w-sm mx-auto">Register your first field to start receiving smart irrigation advisories powered by soil + weather + crop-stage data.</p>
          <button onClick={() => setShowAdd(true)} className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <PlusCircle className="w-4 h-4 mr-2 inline" /> Register Your First Field
          </button>
        </motion.div>
      )}

      {/* Field Cards */}
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {fields.map(field => {
          const CropIcon = CROP_ICONS[field.crop_type] || Sprout;
          const stageStyle = STAGE_COLORS[field.current_growth_stage] || STAGE_COLORS.Vegetative;
          
          return (
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              key={field.id}
            >
              <Link to={`/field/${field.id}`} className="block group">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 h-full group-hover:shadow-lg group-hover:border-gray-200 group-hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <CropIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{field.name}</h3>
                        <p className="text-sm text-gray-400 font-medium">{field.area_acres} acres</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} border`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dot} mr-1.5`} />
                      {field.current_growth_stage}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-100">
                      {field.crop_type}
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
