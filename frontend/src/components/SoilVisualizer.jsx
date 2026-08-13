import React from 'react';
import { motion } from 'framer-motion';
import { Droplet } from 'lucide-react';

export default function SoilVisualizer({ moisturePercent }) {
  // Clamp moisture between 0 and 100
  const clampedMoisture = Math.min(Math.max(moisturePercent || 0, 0), 100);
  
  // For a 200px height SVG, calculate how tall the water layer is
  const totalHeight = 200;
  const waterHeight = (clampedMoisture / 100) * totalHeight;
  const waterY = totalHeight - waterHeight;

  return (
    <div className="relative w-full h-64 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center z-10">
        <h3 className="font-semibold text-gray-700 flex items-center">
          <Droplet className="w-5 h-5 text-blue-500 mr-2" />
          Live Soil Profile
        </h3>
        <span className="font-bold text-blue-600 text-lg">{clampedMoisture.toFixed(1)}%</span>
      </div>
      
      <div className="relative flex-1 w-full bg-[#e8dcc4]">
        {/* Decorative Roots / Soil Texture */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-20">
          <path d="M 10,0 Q 20,50 10,100 T 20,200" stroke="#5c4033" fill="transparent" strokeWidth="2" />
          <path d="M 50,0 Q 40,80 60,150 T 40,200" stroke="#5c4033" fill="transparent" strokeWidth="3" />
          <path d="M 90,0 Q 100,40 80,100 T 90,200" stroke="#5c4033" fill="transparent" strokeWidth="2" />
          <path d="M 150,0 Q 140,70 160,120 T 150,200" stroke="#5c4033" fill="transparent" strokeWidth="4" />
          <path d="M 220,0 Q 230,60 210,140 T 230,200" stroke="#5c4033" fill="transparent" strokeWidth="2" />
          <path d="M 300,0 Q 290,90 310,160 T 300,200" stroke="#5c4033" fill="transparent" strokeWidth="3" />
        </svg>

        {/* Animated Water Level */}
        <svg width="100%" height="100%" viewBox={`0 0 100 ${totalHeight}`} preserveAspectRatio="none" className="absolute inset-0">
          <motion.rect
            x="0"
            width="100"
            fill="#3b82f6"
            opacity="0.6"
            initial={{ y: totalHeight, height: 0 }}
            animate={{ y: waterY, height: waterHeight }}
            transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.2 }}
          />
          
          {/* Surface Wave Animation */}
          <motion.g
            initial={{ y: totalHeight }}
            animate={{ y: waterY }}
            transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.2 }}
          >
            <path
              fill="#60a5fa"
              opacity="0.8"
              d={`M 0 0 Q 25 10 50 0 T 100 0 L 100 ${totalHeight} L 0 ${totalHeight} Z`}
            />
          </motion.g>
        </svg>
        
        {/* Depth Markers */}
        <div className="absolute top-0 right-2 bottom-0 w-8 flex flex-col justify-between py-2 text-xs text-gray-500 font-medium">
          <span>0cm</span>
          <span>15cm</span>
          <span>30cm</span>
          <span>45cm</span>
          <span>60cm</span>
        </div>
      </div>
    </div>
  );
}
