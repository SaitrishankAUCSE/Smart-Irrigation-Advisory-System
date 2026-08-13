import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplet, User, Calendar } from 'lucide-react';
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
      className="bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <Droplet className="h-7 w-7 text-emerald-600 fill-emerald-500/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent leading-tight tracking-tight">
                AgriSense
              </span>
              <span className="text-[11px] font-medium text-gray-500 tracking-wide uppercase">
                by Quantum Coders
              </span>
            </div>
          </Link>

          {/* Right Section: Date & User Profile */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Current Date */}
            <div className="hidden md:flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>{formattedDate}</span>
            </div>

            {/* User Greeting & Avatar */}
            <div className="flex items-center space-x-2.5 bg-emerald-50/70 border border-emerald-100/80 px-3 py-1.5 rounded-full">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {firstLetter ? firstLetter : <User className="w-4 h-4" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs text-gray-500 font-normal leading-none hidden sm:inline">Hello,</span>
                <span className="text-xs font-semibold text-gray-800 leading-tight">
                  <span className="sm:hidden">Hello, </span>{userName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
