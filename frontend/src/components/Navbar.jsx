import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white py-3 px-4 flex justify-between items-center">
      <div className="text-xl font-semibold">AI Legacy Code Engine</div>
      <div className="space-x-4">
        <Link to="/" className="hover:text-teal-300 transition-colors">Home</Link>
        <Link to="/upload" className="hover:text-teal-300 transition-colors">Upload</Link>
        <Link to="/search" className="hover:text-teal-300 transition-colors">Search</Link>
        <Link to="/chat" className="hover:text-teal-300 transition-colors">Chat</Link>
      </div>
    </nav>
  );
}
