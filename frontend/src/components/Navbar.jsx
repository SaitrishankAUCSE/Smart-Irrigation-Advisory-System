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
      className="bg-emerald-950/90 backdrop-blur-md border-b border-emerald-800/40 text-white shadow-lg sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-emerald-800/60 rounded-2xl group-hover:bg-emerald-700/60 transition-colors border border-emerald-500/30 flex items-center justify-center">
              <Droplet className="h-6 w-6 text-emerald-400 fill-emerald-400/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-white leading-tight tracking-tight flex items-center">
                AgriSense <Sprout className="w-4 h-4 ml-1.5 text-emerald-400" />
              </span>
              <span className="text-[10px] font-bold text-emerald-400/80 tracking-widest uppercase">
                Smart Irrigation Advisory • Quantum Coders
              </span>
            </div>
          </Link>

          {/* Center Season Badge */}
          <div className="hidden lg:flex items-center space-x-2 bg-emerald-900/50 border border-emerald-700/40 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Soil Moisture & Weather Synced</span>
          </div>

          {/* Right Section: Date & User Profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Current Date */}
            <div className="hidden sm:flex items-center text-xs font-medium text-emerald-200/80 bg-emerald-900/60 px-3 py-1.5 rounded-full border border-emerald-800/50">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <span>{formattedDate}</span>
            </div>

            {/* User Greeting & Avatar */}
            <div className="flex items-center space-x-2.5 bg-emerald-800/50 border border-emerald-700/50 px-3 py-1.5 rounded-full">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
                {firstLetter ? firstLetter : <User className="w-4 h-4" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-emerald-300 font-bold uppercase leading-none hidden sm:inline">Farmer</span>
                <span className="text-xs font-bold text-white leading-tight">
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
