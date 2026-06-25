import React, { useContext, useState } from 'react';
import { ProjectContext } from './ProjectContext.jsx';
import LeftSidebar from './LeftSidebar.jsx';
import ChatPanel from './ChatPanel';

const Workspace = () => {
  const { activeProjectId } = useContext(ProjectContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans relative">
      {/* Sidebar overlay backdrop for mobile when open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar overlay wrapper */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 md:relative md:translate-x-0 w-80 flex-shrink-0 h-full`}>
        <LeftSidebar onCloseSidebar={() => setSidebarOpen(false)} />
      </div>

      {/* Main chat/content area */}
      <div className="flex-1 h-full p-4 md:p-6 overflow-hidden flex flex-col min-w-0">
        {activeProjectId ? (
          <ChatPanel projectId={activeProjectId} onToggleSidebar={() => setSidebarOpen(true)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 relative p-6">
            {/* Hamburger trigger for empty state on mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-4 left-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 md:hidden active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Active Source</h3>
            <p className="text-sm text-slate-500 max-w-xs text-center leading-normal mb-5">
              Select an uploaded repository from the sidebar or click "Add Knowledge Source" to get started.
            </p>
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-500 active:scale-95 transition-all"
            >
              Open Sidebar Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspace;
