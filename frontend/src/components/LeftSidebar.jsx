import React, { useContext, useState, useEffect } from 'react';
import { ProjectContext } from './ProjectContext.jsx';
import UploadModal from './UploadModal';
import { getProjectStatus, deleteProject } from '../api.js';

const LeftSidebar = ({ onCloseSidebar }) => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    addProject,
    updateProjectInfo,
    removeProject,
  } = useContext(ProjectContext);

  const [showModal, setShowModal] = useState(false);
  const [statusInterval, setStatusInterval] = useState(null);

  // Poll status for active project when it is not ready and not error
  useEffect(() => {
    if (!activeProjectId) return;
    const proj = projects[activeProjectId];
    if (!proj) return;

    if (proj.status !== 'ready' && proj.status !== 'error') {
      const interval = setInterval(async () => {
        try {
          const status = await getProjectStatus(activeProjectId);
          updateProjectInfo(activeProjectId, status);
        } catch (e) {
          console.error('Failed to poll status', e);
        }
      }, 2500);
      setStatusInterval(interval);
      return () => clearInterval(interval);
    }
  }, [activeProjectId, projects[activeProjectId]?.status]);

  const handleProjectClick = (id) => {
    setActiveProjectId(id);
    if (onCloseSidebar) onCloseSidebar();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this knowledge source?")) return;
    try {
      await deleteProject(id);
      removeProject(id);
    } catch (err) {
      console.error("Failed to delete source", err);
      alert("Failed to delete source.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
            Ready
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-900/60">
            Failed
          </span>
        );
      case 'cloning':
      case 'extracting':
      case 'analyzing':
      case 'indexing':
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-400 border border-indigo-900/60 animate-pulse">
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-850 text-slate-400 border border-slate-750">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-200">
      {/* Premium Header/Logo */}
      <div className="p-6 border-b border-slate-800/80 flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
          <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div>
          <span className="font-extrabold text-[15px] tracking-wide text-white uppercase bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Legacy Engine
          </span>
          {/* <span className="text-[10px] block text-slate-500 font-bold uppercase tracking-widest mt-0.5"> RAG</span> */}
        </div>
      </div>

      {/* Primary Actions */}
      <div className="p-4 border-b border-slate-800/60">
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/20 active:scale-98 transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Knowledge Source</span>
        </button>
      </div>

      {/* Selected Source Details */}
      {activeProjectId && projects[activeProjectId] && (
        <div className="p-4 border-b border-slate-800/60 bg-slate-950/40">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Source</span>
              {getStatusBadge(projects[activeProjectId].status)}
            </div>

            <h3 className="font-bold text-[15px] text-white truncate mb-3 flex items-center space-x-2" title={projects[activeProjectId].project_name}>
              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="truncate">{projects[activeProjectId].project_name}</span>
            </h3>

            {projects[activeProjectId].status === 'error' ? (
              <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-2.5 text-xs text-red-300 font-mono overflow-y-auto max-h-24 scrollbar-thin">
                <div className="font-bold mb-1">Pipeline failure:</div>
                <div className="leading-relaxed">{projects[activeProjectId].error || 'Unknown setup error.'}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 text-xs font-medium text-slate-400">
                <div className="bg-slate-950/50 border border-slate-850 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Files</div>
                  <div className="text-sm font-bold text-white font-mono">{projects[activeProjectId].file_count || 0}</div>
                </div>
                <div className="bg-slate-950/50 border border-slate-850 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Chunks</div>
                  <div className="text-sm font-bold text-white font-mono">{projects[activeProjectId].chunk_count || 0}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">My Sources</h4>

        {Object.keys(projects).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-2 text-center border-2 border-dashed border-slate-800 rounded-xl">
            <svg className="w-8 h-8 text-slate-600 mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <div className="text-xs font-semibold text-slate-400">No sources found</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Upload a GitHub repo or ZIP source</div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(projects).map(([id, info]) => (
              <div
                key={id}
                onClick={() => handleProjectClick(id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150 ${id === activeProjectId
                  ? 'bg-indigo-950/30 border-indigo-500/50 hover:bg-indigo-950/40 shadow-md shadow-indigo-950/10'
                  : 'bg-slate-950/20 border-slate-850 hover:border-slate-750 hover:bg-slate-950/40'
                  }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${id === activeProjectId ? 'bg-indigo-950 border border-indigo-850 text-indigo-400' : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold truncate ${id === activeProjectId ? 'text-white' : 'text-slate-300'}`}>
                      {info.project_name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate uppercase">
                      {info.status === 'ready' ? `${info.file_count || 0} files` : info.status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                  {info.status === 'error' && (
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  )}
                  {info.status !== 'ready' && info.status !== 'error' && (
                    <div className="w-2.5 h-2.5 rounded-full border border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
                  )}

                  <button
                    onClick={(e) => handleDelete(e, id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors duration-155"
                    title="Delete source"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 text-center text-[10px] text-slate-500 font-medium">
        v1.0.0 • AI Legacy Code Knowledge Engine
      </div>

      {showModal && (
        <UploadModal onClose={() => setShowModal(false)} onProjectCreated={addProject} />
      )}
    </div>
  );
};

export default LeftSidebar;
