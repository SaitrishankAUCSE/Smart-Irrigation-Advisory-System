import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getIrrigationLogs, toDate } from '../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Target, TrendingUp, Droplet, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WaterUsageDashboard() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [usageData, setUsageData] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [totalWater, setTotalWater] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) fetchAnalytics();
  }, [id, currentUser]);

  const fetchAnalytics = async () => {
    try {
      const logs = await getIrrigationLogs(id);
      
      const usageDict = {};
      let adheredCount = 0;
      let total = 0;
      
      for (const log of logs) {
        const dateStr = toDate(log.logged_at).toLocaleDateString();
        usageDict[dateStr] = (usageDict[dateStr] || 0) + (log.actual_amount_mm || 0);
        total += (log.actual_amount_mm || 0);

        const r = log.recommendation;
        const a = log.action_taken;
        if ((r === 'irrigate' && a === 'irrigated') || (r === 'wait' && a === 'skipped')) {
          adheredCount++;
        }
      }
      
      setUsageData(Object.entries(usageDict).map(([date, amount]) => ({ date, actual_amount_mm: amount })));
      setAdherence(logs.length > 0 ? Math.round((adheredCount / logs.length) * 100) : 100);
      setTotalWater(Math.round(total * 10) / 10);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;
  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto"
    >
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/field/${id}`} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Water Analytics</h1>
            <p className="text-sm text-gray-500">Usage trends and recommendation adherence</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center shadow-sm transition-all font-medium text-sm"
        >
          <Printer className="w-4 h-4 mr-2 text-gray-500" />
          Export Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Water Used</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{totalWater} <span className="text-sm font-normal text-gray-500">mm</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Adherence Rate</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{adherence}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data Points</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{usageData.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
              Daily Water Usage (mm)
            </h2>
            <div className="h-72 w-full">
              {usageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{fontSize: 11, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 11, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', fontSize: '13px'}} />
                    <Bar dataKey="actual_amount_mm" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Water (mm)" barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                  <Droplet className="w-5 h-5 mr-2" /> No irrigation data yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Adherence Ring */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center h-full min-h-[320px]">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Adherence Score</h2>
            <p className="text-gray-400 text-xs mb-6">How often you follow the advisory</p>
            
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <motion.circle 
                  cx="64" cy="64" r="56" 
                  stroke="#3b82f6" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 56) * (1 - ((adherence || 0) / 100)) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-gray-900">{adherence !== null ? adherence : '--'}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
