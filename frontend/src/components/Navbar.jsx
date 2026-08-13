import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplet, User, Calendar, Sprout, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { currentUser } = useAuth();
  const userName = currentUser?.name || 'Farmer';
  const firstLetter = userName.charAt(0).toUpperCase();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white/90 backdrop-blur-md border-b border-emerald-100/80 text-slate-900 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Droplet className="h-6 w-6 text-white fill-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent leading-tight tracking-tight flex items-center">
                AgriSense <Sprout className="w-4 h-4 ml-1.5 text-emerald-600" />
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700/70 tracking-widest uppercase">
                Smart Irrigation Advisory • Quantum Coders
              </span>
            </div>
          </Link>

          {/* Center Season Badge */}
          <div className="hidden lg:flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 rounded-full text-xs font-bold text-emerald-800 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Soil Moisture & Weather Synced</span>
          </div>

          {/* Right Section: Date & User Profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Current Date */}
            <div className="hidden sm:flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-100">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>{formattedDate}</span>
            </div>

            {/* User Greeting & Avatar */}
            <div className="flex items-center space-x-2.5 bg-emerald-50 border border-emerald-200/60 px-3.5 py-1.5 rounded-full shadow-xs">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                {firstLetter ? firstLetter : <User className="w-4 h-4" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-emerald-700 font-extrabold uppercase leading-none hidden sm:inline">Farmer</span>
                <span className="text-xs font-extrabold text-slate-900 leading-tight">
                  {userName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
