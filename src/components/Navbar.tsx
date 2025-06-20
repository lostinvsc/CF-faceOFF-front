import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BarChart2 } from 'lucide-react';

const CFLogo = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-8 w-8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Hexagonal background representing algorithmic structure */}
    <path
      d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
      className="fill-indigo-600"
      stroke="none"
    />
    
    {/* Inner geometric pattern */}
    <path
      d="M12 7l4 2.5v5l-4 2.5l-4-2.5v-5l4-2.5z"
      className="fill-purple-500 stroke-none"
      opacity="0.8"
    />
    
    {/* Binary representation */}
    <path
      d="M8 9v2m4-4v2m4-2v2"
      className="stroke-white"
      strokeWidth="1.5"
    />
    
    {/* Connected nodes representing graph algorithms */}
    <path
      d="M8 13h8m-4-2v4"
      className="stroke-white"
      strokeWidth="1.5"
      strokeDasharray="1 1"
    />
    
    {/* Glowing effect */}
    <circle
      cx="12"
      cy="12"
      r="1"
      className="fill-white"
      filter="url(#glow)"
    />
    
    {/* Filters for glowing effect */}
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="0.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  </svg>
);

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative transition-all duration-300 transform group-hover:scale-110 group-hover:brightness-110">
              <CFLogo />
            </div>
            <span className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
              CF Tracker
            </span>
          </Link>
          <div className="flex space-x-6">
            <Link to="/dashboard" className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors duration-300">
              <BarChart2 className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/compare" className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors duration-300">
              <Users className="h-5 w-5" />
              <span>Compare</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;