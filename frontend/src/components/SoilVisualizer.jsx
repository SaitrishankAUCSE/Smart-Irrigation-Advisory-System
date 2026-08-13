import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, Layers, Sprout, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SoilVisualizer({ moisturePercent = 0 }) {
  const clamped = Math.min(Math.max(moisturePercent || 0, 0), 100);
  
  // Status evaluation for UI badge
  let status = { label: 'Dry Soil', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertCircle };
  if (clamped >= 40 && clamped <= 75) {
    status = { label: 'Optimal Saturation', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
  } else if (clamped > 75) {
    status = { label: 'Fully Saturated', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ShieldAlert };
  }

  const StatusIcon = status.icon;
  const totalHeight = 220;
  const waterHeight = (clamped / 100) * totalHeight;
  const waterY = totalHeight - waterHeight;

  return (
    <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-950/5 to-amber-950/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Soil Profile Strata</h3>
            <p className="text-[11px] text-gray-500">Subsurface Moisture Map</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5 mr-1" />
            {status.label}
          </span>
          <span className="font-black text-blue-600 text-lg">{clamped.toFixed(1)}%</span>
        </div>
      </div>
      
      {/* Visualizer Canvas */}
      <div className="relative flex-1 min-h-[220px] w-full bg-gradient-to-b from-[#795548] via-[#5D4037] to-[#3E2723] overflow-hidden">
        {/* Top Grass / Organic Layer */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 flex items-center justify-around z-20">
          <Sprout className="w-3.5 h-3.5 text-emerald-200 -mt-2" />
          <Sprout className="w-3 h-3 text-emerald-200 -mt-2" />
          <Sprout className="w-4 h-4 text-emerald-200 -mt-2" />
          <Sprout className="w-3 h-3 text-emerald-200 -mt-2" />
        </div>

        {/* Soil Texture & Root Network */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-25 z-10 pointer-events-none">
          {/* Root system SVG paths */}
          <path d="M 50,0 Q 40,60 65,120 T 45,220" stroke="#D7CCC8" fill="transparent" strokeWidth="2.5" />
          <path d="M 50,0 Q 75,40 55,90 T 80,160" stroke="#D7CCC8" fill="transparent" strokeWidth="1.5" />
          <path d="M 180,0 Q 170,70 190,140 T 165,220" stroke="#D7CCC8" fill="transparent" strokeWidth="3" />
          <path d="M 180,0 Q 200,50 175,100 T 210,180" stroke="#D7CCC8" fill="transparent" strokeWidth="1.5" />
          <path d="M 320,0 Q 300,80 330,150 T 310,220" stroke="#D7CCC8" fill="transparent" strokeWidth="2" />
        </svg>

        {/* Animated Water Table */}
        <svg width="100%" height="100%" viewBox={`0 0 100 ${totalHeight}`} preserveAspectRatio="none" className="absolute inset-0 z-10">
          <motion.rect
            x="0"
            width="100"
            fill="url(#waterGradient)"
            opacity="0.75"
            initial={{ y: totalHeight, height: 0 }}
            animate={{ y: waterY, height: waterHeight }}
            transition={{ type: 'spring', stiffness: 40, damping: 14, delay: 0.1 }}
          />
          
          <defs>
            <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>

          {/* Animated Surface Wave */}
          <motion.g
            initial={{ y: totalHeight }}
            animate={{ y: waterY }}
            transition={{ type: 'spring', stiffness: 40, damping: 14, delay: 0.1 }}
          >
            <path
              fill="#93C5FD"
              opacity="0.9"
              d={`M 0 0 Q 25 6 50 0 T 100 0 L 100 ${totalHeight} L 0 ${totalHeight} Z`}
            />
          </motion.g>
        </svg>
        
        {/* Soil Layer Markers */}
        <div className="absolute top-0 right-3 bottom-0 flex flex-col justify-between py-3 text-[10px] font-bold text-amber-100/70 z-20 pointer-events-none tracking-widest uppercase">
          <span className="bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-xs">Topsoil (0-15cm)</span>
          <span className="bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-xs">Rootzone (15-30cm)</span>
          <span className="bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-xs">Subsoil (30-60cm)</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-emerald-950/5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
        <span className="flex items-center text-gray-500">
          <Droplet className="w-3.5 h-3.5 text-blue-500 mr-1" />
          Active Water Deficit: <strong className="ml-1 text-gray-800">{Math.max(0, (50 - clamped)).toFixed(1)}%</strong>
        </span>
        <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-100/60 px-2 py-0.5 rounded">
          Soil Type: Loamy Topsoil
        </span>
      </div>
    </div>
  );
}
