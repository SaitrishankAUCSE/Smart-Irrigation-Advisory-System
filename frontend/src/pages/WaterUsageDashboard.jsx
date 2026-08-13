import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WaterUsageDashboard() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [usageData, setUsageData] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchAnalytics();
    }
  }, [id, currentUser]);

  const fetchAnalytics = async () => {
    try {
      const logsSnap = await getDocs(collection(db, 'fields', id, 'irrigationLogs'));
      const logs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Build water usage by date
      const usageDict = {};
      let adheredCount = 0;
      
      for (const log of logs) {
        if (log.logged_at) {
          const dateStr = new Date(log.logged_at.toDate ? log.logged_at.toDate() : Date.now()).toLocaleDateString();
          usageDict[dateStr] = (usageDict[dateStr] || 0) + (log.actual_amount_mm || 0);
        }
        
        const r = log.recommendation;
        const a = log.action_taken;
        if ((r === 'irrigate' && a === 'irrigated') || (r === 'wait' && a === 'skipped')) {
          adheredCount++;
        }
      }
      
      const usageList = Object.entries(usageDict).map(([date, amount]) => ({
        date,
        actual_amount_mm: amount
      }));
      
      setUsageData(usageList);
      setAdherence(logs.length > 0 ? Math.round((adheredCount / logs.length) * 100) : 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto"
    >
      <div className="mb-6 flex items-center">
        <Link to={`/field/${id}`} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Field
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Daily Water Usage Trend (mm)
            </h2>
            <div className="h-80 w-full">
              {usageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="actual_amount_mm" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Water Amount (mm)" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No irrigation logs available yet.
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl shadow-sm border border-indigo-100 flex flex-col items-center text-center justify-center h-full min-h-[320px]"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <Target className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Recommendation Adherence</h2>
            <p className="text-gray-600 text-sm mb-6 px-4">This measures how often irrigation actions match the system's AI advisory recommendations.</p>
            
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="#e0e7ff" strokeWidth="8" fill="none" />
                <motion.circle 
                  cx="64" cy="64" r="60" 
                  stroke="#4f46e5" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 60) * (1 - ((adherence || 0) / 100)) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-indigo-900">{adherence !== null ? Math.round(adherence) : '--'}%</span>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
