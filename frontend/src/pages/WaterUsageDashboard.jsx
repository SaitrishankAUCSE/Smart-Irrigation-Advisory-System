import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getIrrigationLogs, toDate } from '../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Target, TrendingUp, Droplet, Printer, Award, ShieldCheck } from 'lucide-react';
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
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/field/${id}`} className="w-11 h-11 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl flex items-center justify-center hover:bg-emerald-900/60 transition-colors shadow-md text-emerald-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Water Telemetry & Analytics</h1>
            <p className="text-sm text-emerald-200/80">Irrigation volume trends and recommendation adherence score</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-5 py-3 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-2xl hover:bg-emerald-900/60 flex items-center shadow-md transition-all font-bold text-sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-950/40 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-5 shadow-lg">
          <div className="flex items-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider mb-1">
            <Droplet className="w-4 h-4 mr-1.5 text-blue-400" /> Total Water Applied
          </div>
          <p className="text-3xl font-black text-white">{totalWater} <span className="text-sm font-semibold text-emerald-300">mm</span></p>
        </div>

        <div className="bg-emerald-950/40 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-5 shadow-lg">
          <div className="flex items-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 mr-1.5 text-amber-400" /> Advisory Adherence Rate
          </div>
          <p className="text-3xl font-black text-white">{adherence}%</p>
        </div>

        <div className="bg-emerald-950/40 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-5 shadow-lg">
          <div className="flex items-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" /> Conservation Rating
          </div>
          <p className="text-xl font-black text-emerald-300 mt-1">
            {adherence >= 80 ? '🌟 Grade A+ Efficient' : '👍 Good Efficiency'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="bg-emerald-950/40 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-emerald-500/20 h-full">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-400" />
              Daily Water Usage Trend (mm)
            </h2>
            <div className="h-72 w-full">
              {usageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 185, 129, 0.1)" />
                    <XAxis dataKey="date" tick={{fontSize: 11, fill: '#6EE7B7'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 11, fill: '#6EE7B7'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: 'rgba(16, 185, 129, 0.05)'}} contentStyle={{backgroundColor: '#064E3B', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#fff', fontSize: '12px'}} />
                    <Bar dataKey="actual_amount_mm" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Water (mm)" barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-emerald-200/50 bg-slate-950/40 rounded-2xl border border-dashed border-emerald-500/20 text-sm">
                  <Droplet className="w-5 h-5 mr-2 text-blue-400" /> No irrigation action records available yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Adherence Ring */}
        <div className="lg:col-span-1">
          <div className="bg-emerald-950/40 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-emerald-500/20 flex flex-col items-center text-center justify-center h-full min-h-[320px]">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
              <Target className="w-8 h-8" />
            </div>
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Adherence Score</h2>
            <p className="text-emerald-200/60 text-xs mb-6 max-w-xs">Measures how often irrigation decisions match AI recommendations.</p>
            
            <div className="relative">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="62" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="10" fill="none" />
                <motion.circle 
                  cx="72" cy="72" r="62" 
                  stroke="#10B981" 
                  strokeWidth="10" 
                  fill="none" 
                  strokeDasharray={`${2 * Math.PI * 62}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 62 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 62) * (1 - ((adherence || 0) / 100)) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-white">{adherence !== null ? adherence : '--'}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
