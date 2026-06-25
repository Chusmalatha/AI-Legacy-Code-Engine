import React, { useState, useContext } from 'react';
import { uploadRepository } from '../api.js';
import { ProjectContext } from './ProjectContext.jsx';

const UploadModal = ({ onClose, onProjectCreated }) => {
  const [activeTab, setActiveTab] = useState('github'); // 'github' or 'zip'
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addProject, setIsUploading } = useContext(ProjectContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'github' && !url.trim()) return;
    if (activeTab === 'zip' && !file) return;

    setLoading(true);
    if (setIsUploading) setIsUploading(true);
    try {
      // Send only the relevant parameter based on the selected tab
      const result = await uploadRepository(
        activeTab === 'github' ? url.trim() : null,
        activeTab === 'zip' ? file : null
      );

      const newProj = {
        project_id: result.project_id,
        project_name: result.project_name || 'Untitled',
        status: result.status || 'processing',
        source: activeTab === 'github' ? 'github' : 'zip',
        file_count: 0,
        chunk_count: 0,
        error: null
      };

      if (addProject) addProject(newProj.project_id, newProj);
      if (onProjectCreated) onProjectCreated(newProj.project_id, newProj);
      onClose();
    } catch (err) {
      console.error('Upload failed', err);
      alert(err.response?.data?.detail || 'Failed to upload repository source.');
    } finally {
      setLoading(false);
      if (setIsUploading) setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Add Knowledge Source</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Ingest code repositories to query in RAG Chat</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-all duration-150"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800/80 px-4 pt-2.5 bg-slate-950/20">
          <button
            onClick={() => !loading && setActiveTab('github')}
            className={`flex-1 pb-3 text-sm font-bold tracking-wide transition-all border-b-2 text-center ${activeTab === 'github'
              ? 'border-indigo-500 text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            disabled={loading}
          >
            GitHub Repository
          </button>
          <button
            onClick={() => !loading && setActiveTab('zip')}
            className={`flex-1 pb-3 text-sm font-bold tracking-wide transition-all border-b-2 text-center ${activeTab === 'zip'
              ? 'border-indigo-500 text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            disabled={loading}
          >
            Local ZIP Archive
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col space-y-5">
          {activeTab === 'github' ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                GitHub Repository URL
              </label>
              <div className="relative rounded-xl border border-slate-800 focus-within:border-indigo-500 bg-slate-950 transition-all duration-200 shadow-inner">
                <input
                  type="url"
                  placeholder="https://github.com/username/repo"
                  className="w-full bg-transparent text-white px-4 py-3 text-sm focus:outline-none placeholder-slate-600 font-medium"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <span className="text-[10px] text-slate-500 block leading-normal px-0.5">
                Must be a public repository. Includes automated cloning, analysis, and vector database indexing.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                ZIP Archive Upload
              </label>
              <div className="border border-dashed border-slate-800 hover:border-indigo-500 bg-slate-950/60 hover:bg-slate-950 rounded-2xl transition-all duration-200 p-6 text-center cursor-pointer relative group">
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={loading}
                  required
                />
                <div className="flex flex-col items-center justify-center space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-300">
                      {file ? file.name : 'Select repository ZIP'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Drop ZIP here or browse local files'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end items-center space-x-3 pt-3 border-t border-slate-850/60">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-850 hover:text-white text-slate-300 font-bold text-sm tracking-wide transition-all duration-150"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm tracking-wide shadow-md active:scale-98 disabled:opacity-50 transition-all duration-150 flex items-center space-x-2"
              disabled={loading}
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                </svg>
              )}
              <span>
                {loading
                  ? (activeTab === 'github' ? 'Cloning...' : 'Uploading...')
                  : (activeTab === 'github' ? 'Ingest Repository' : 'Upload ZIP Archive')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
