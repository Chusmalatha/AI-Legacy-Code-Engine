import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6">
      <h1 className="text-4xl font-bold mb-4">AI Legacy Code Knowledge Engine</h1>
      <p className="text-lg mb-8 max-w-2xl text-center">
        Upload a GitHub repository or a ZIP archive and explore its structure instantly.
      </p>
      <Link
        to="/upload"
        className="px-6 py-3 bg-white text-indigo-700 rounded-lg shadow-lg hover:bg-gray-100 transition"
      >
        Upload Repository
      </Link>
    </div>
  );
}
