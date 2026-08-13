import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { PlusCircle, Sprout, Map, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FarmerDashboard() {
  const { currentUser } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newField, setNewField] = useState({
    name: '', crop_type: 'Rice', area_acres: 1.0, current_growth_stage: 'Vegetative'
  });

  const fetchFields = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'fields'), where('user_id', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fieldsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFields(fieldsData);
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
    try {
      await addDoc(collection(db, 'fields'), {
        ...newField,
        user_id: currentUser.uid,
        created_at: serverTimestamp()
      });
      setShowAdd(false);
      setNewField({ name: '', crop_type: 'Rice', area_acres: 1.0, current_growth_stage: 'Vegetative' });
      fetchFields();
    } catch (err) {
      console.error(err);
      alert("Failed to add field");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) return <div className="text-center py-12 text-gray-500 animate-pulse">Loading dashboard...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-gray-900 flex items-center tracking-tight">
          <LayoutDashboard className="w-8 h-8 mr-3 text-blue-600" />
          My Fields Dashboard
        </h1>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 font-semibold transition-all"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {showAdd ? 'Cancel' : 'Register New Field'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8"
          >
            <h2 className="text-xl font-bold mb-6 text-gray-800">Field Registration</h2>
            <form onSubmit={handleAddField} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Field Name / Plot ID</label>
                <input type="text" required className="block w-full border-gray-300 rounded-lg p-3 bg-gray-50 border shadow-inner focus:ring-2 focus:ring-green-500 focus:outline-none" 
                  placeholder="e.g. North Plot A"
                  value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Crop Variety</label>
                <select className="block w-full border-gray-300 rounded-lg p-3 bg-gray-50 border shadow-inner focus:ring-2 focus:ring-green-500 focus:outline-none"
                  value={newField.crop_type} onChange={e => setNewField({...newField, crop_type: e.target.value})}>
                  <option>Rice</option>
                  <option>Maize</option>
                  <option>Chili</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Area (Acres)</label>
                <input type="number" step="0.1" required className="block w-full border-gray-300 rounded-lg p-3 bg-gray-50 border shadow-inner focus:ring-2 focus:ring-green-500 focus:outline-none"
                  value={newField.area_acres} onChange={e => setNewField({...newField, area_acres: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Current Growth Stage</label>
                <select className="block w-full border-gray-300 rounded-lg p-3 bg-gray-50 border shadow-inner focus:ring-2 focus:ring-green-500 focus:outline-none"
                  value={newField.current_growth_stage} onChange={e => setNewField({...newField, current_growth_stage: e.target.value})}>
                  <option>Germination</option>
                  <option>Vegetative</option>
                  <option>Flowering</option>
                  <option>Maturity</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 mt-2">
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-colors w-full sm:w-auto">
                  Save Field Profile
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {fields.length === 0 && !showAdd && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
          <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600">No Fields Found</h3>
          <p className="text-gray-500 mt-2">Register your first field plot to begin receiving intelligent irrigation advisories.</p>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {fields.map(field => (
          <motion.div variants={itemVariants} key={field.id}>
            <Link to={`/field/${field.id}`} className="block h-full group">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-full group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                
                <div className="flex items-start mb-6 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4 shadow-inner">
                    <Map className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-900 leading-tight">{field.name}</h3>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">{field.area_acres} Acres</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 relative z-10">
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="bg-green-100 p-1.5 rounded-lg mr-3">
                      <Sprout className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-gray-400 uppercase">Crop Profile</span>
                      <span className="font-semibold text-gray-800">{field.crop_type}</span> • <span className="text-gray-600">{field.current_growth_stage}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
