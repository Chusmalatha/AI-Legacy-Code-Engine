import React, { useState } from 'react';
import axios from 'axios';
import ChunkCard from '../components/ChunkCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Search() {
  const [projectId, setProjectId] = useState('');
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/search', {
        project_id: projectId,
        query,
        top_k: topK,
      });
      setResults(response.data.results);
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-teal-300">Semantic Search</h1>
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Project ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
          required
        />
        <input
          type="text"
          placeholder="Search query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
          required
        />
        <input
          type="number"
          min={1}
          placeholder="Top K"
          value={topK}
          onChange={(e) => setTopK(parseInt(e.target.value))}
          className="p-2 rounded bg-gray-800 text-white"
        />
        <button
          type="submit"
          className="col-span-full mt-2 bg-teal-600 hover:bg-teal-500 text-white py-2 rounded transition"
        >
          Search
        </button>
      </form>
      {loading && <Spinner />}
      {error && <div className="text-red-400 mb-4">{error}</div>}
      <div className="space-y-4">
        {results.map((r) => (
          <ChunkCard key={r.chunk_id} chunk={r} />
        ))}
      </div>
    </div>
  );
}
