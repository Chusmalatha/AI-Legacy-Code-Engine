import React, { useState } from 'react';
import axios from 'axios';
import Spinner from '../components/Spinner.jsx';
import ChatMessage from '../components/ChatMessage.jsx';

export default function Chat() {
  const [projectId, setProjectId] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!projectId || !question) return;
    const userMsg = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/query', {
        project_id: projectId,
        question,
      });
      const assistantMsg = { role: 'assistant', content: response.data.answer };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Query failed');
    } finally {
      setLoading(false);
      setQuestion('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-teal-300">AI Code Q&amp;A</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Project ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white w-full mb-2"
          required
        />
      </div>
      <div className="space-y-3 mb-4 h-96 overflow-y-auto p-2 bg-gray-900 rounded">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
      </div>
      {loading && <Spinner />}
      {error && <div className="text-red-400 mb-2">{error}</div>}
      <form onSubmit={handleSend} className="flex space-x-2">
        <input
          type="text"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-grow p-2 rounded bg-gray-800 text-white"
          required
        />
        <button
          type="submit"
          className="bg-teal-600 hover:bg-teal-500 text-white py-2 px-4 rounded transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
