import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link to="/" className="flex items-center">
            <Droplet className="h-8 w-8 text-blue-600 mr-2" />
            <div className="flex flex-col">
              <span className="font-bold text-xl text-gray-900 leading-none mt-1">AgriSense</span>
              <span className="text-xs text-gray-500 mt-1">by Quantum Coders</span>
            </div>
          </Link>
          <div className="flex items-center">
            <span className="text-sm text-gray-600">
              Smart Irrigation Advisory System
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
