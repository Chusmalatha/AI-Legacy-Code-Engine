import React, { useContext, useEffect, useState, useRef } from 'react';
import { ProjectContext } from './ProjectContext.jsx';
import { postQuery, fetchChatHistory } from '../api.js';
import ChatMessage from './ChatMessage.jsx';

const ChatPanel = ({ projectId, onToggleSidebar }) => {
  const { projects, addChatEntry } = useContext(ProjectContext);
  const projectInfo = projects[projectId] || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Load chat history when active project changes
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await fetchChatHistory(projectId);
        // Map backend history format [{question, answer, sources}] to display roles
        const formatted = [];
        history.forEach((h) => {
          formatted.push({ role: 'user', content: h.question });
          formatted.push({ role: 'assistant', content: h.answer, sources: h.sources });
        });
        setMessages(formatted);
      } catch (e) {
        console.error('Failed to load chat history', e);
        setMessages([]);
      }
    };
    loadHistory();
  }, [projectId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const isProcessing = ['cloning', 'extracting', 'analyzing', 'indexing', 'processing'].includes(projectInfo.status);
  const isError = projectInfo.status === 'error';

  if (isProcessing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl h-full relative">
        {/* Burger trigger for mobile */}
        <button
          onClick={onToggleSidebar}
          className="absolute top-4 left-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 md:hidden active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="relative mb-6">
          {/* Inner ring */}
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          {/* Outer ring */}
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-dashed border-purple-500/20 border-b-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 tracking-wide capitalize">
          Processing {projectInfo.project_name || 'Source'}
        </h3>
        <div className="flex items-center space-x-2 bg-indigo-950/60 border border-indigo-900/60 px-4 py-1.5 rounded-full text-indigo-400 font-semibold text-xs tracking-wider uppercase animate-pulse">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span>Status: {projectInfo.status}...</span>
        </div>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mt-4">
          Please wait while we clone, extract, and build the FAISS vector database index for Q&A. This takes a moment.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl h-full relative">
        {/* Burger trigger for mobile */}
        <button
          onClick={onToggleSidebar}
          className="absolute top-4 left-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 md:hidden active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-red-500 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Ingestion Failed</h3>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
          An error occurred while trying to process the repository source code:
        </p>
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 text-xs text-red-300 font-mono max-w-md text-left overflow-y-auto max-h-48 scrollbar-thin">
          <span className="font-bold">Pipeline Error: </span>
          {projectInfo.error || 'Unknown setup error.'}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 font-bold text-sm tracking-wide transition-all active:scale-95"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await postQuery(projectId, queryText);
      const assistantMsg = {
        role: 'assistant',
        content: result.answer,
        sources: result.sources
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (addChatEntry) {
        addChatEntry(projectId, {
          question: queryText,
          answer: result.answer,
          sources: result.sources
        });
      }
    } catch (e) {
      console.error('Query failed', e);
      const errMsg = {
        role: 'assistant',
        content: 'Error: Failed to fetch response. Please verify HuggingFace API key and model status.'
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    { label: "Architecture Summary", text: "Give a high-level summary of this codebase's architecture." },
    { label: "Main Components", text: "What are the main entrypoints and components in this repository?" },
    { label: "Configuration & Entry", text: "Where is the configuration set up, and how does the application start?" }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Premium Header */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-slate-850 px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          {/* Hamburger trigger for mobile */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850 md:hidden active:scale-95 transition-all flex-shrink-0"
            title="Open Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white tracking-wide truncate">{projectInfo.project_name || 'Legacy Project'}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5 truncate">
              <span className="capitalize">{projectInfo.source || 'repository'}</span>
              <span>•</span>
              <span className="whitespace-nowrap">{projectInfo.file_count || 0} files</span>
              <span>•</span>
              <span className="whitespace-nowrap">{projectInfo.chunk_count || 0} chunks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto py-12">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-6 animate-bounce">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-wide">AI Legacy Code Assistant</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Ask any questions about this codebase. The engine search queries FAISS indices and answers questions using RAG.
            </p>
            <div className="grid grid-cols-1 gap-3 w-full pb-3">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s.text)}
                  className="flex items-center justify-between text-left p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900/60 transition-all duration-200 group shadow-md"
                >
                  <div>
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-0.5">{s.label}</div>
                    <div className="text-sm text-slate-300 font-medium leading-normal">{s.text}</div>
                  </div>
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))}

            {loading && (
              <div className="flex flex-col items-start mb-6">
                <div className="flex items-center space-x-2 mb-1.5 px-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Legacy Engine</span>
                </div>
                <div className="bg-gray-800 text-gray-100 border border-gray-700 rounded-2xl rounded-tl-none px-5 py-3.5 shadow-xl flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-400 font-medium font-mono">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-slate-900/60 border-t border-slate-850 p-4">
        <div className="max-w-4xl mx-auto flex items-end space-x-2 bg-slate-950 border border-slate-850 rounded-2xl p-2 focus-within:border-indigo-500 transition-all duration-200 shadow-lg">
          <textarea
            className="flex-1 max-h-32 min-h-[44px] bg-transparent text-white px-3 py-2.5 focus:outline-none resize-none text-[15px] placeholder-slate-500 scrollbar-none"
            rows={1}
            placeholder="Ask anything about the codebase..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
            style={{ height: 'auto' }}
          />
          <button
            className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition-all duration-150 flex-shrink-0"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        {/* <div className="text-center text-[10px] text-slate-500 mt-2 font-medium tracking-wide">
          Uses RAG & HuggingFace Inference API models. Answers are derived from indexed codebase chunks.
        </div> */}
      </div>
    </div>
  );
};

export default ChatPanel;
