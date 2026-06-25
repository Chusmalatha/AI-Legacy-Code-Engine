import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState({}); // {projectId: {project_name, status, file_count, chunk_count, source}}
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [chatHistory, setChatHistory] = useState({}); // {projectId: [{question, answer, sources}]}
  const [isUploading, setIsUploading] = useState(false);

  // Load existing projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects');
        const projMap = {};
        response.data.forEach((p) => {
          projMap[p.project_id] = p;
        });
        setProjects(projMap);
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    };
    fetchProjects();
  }, []);

  const addProject = (projectId, info) => {
    let resolvedId = projectId;
    let resolvedInfo = info;
    if (typeof resolvedId === 'object' && resolvedId !== null) {
      resolvedInfo = resolvedId;
      resolvedId = resolvedInfo.project_id;
    }
    setProjects((prev) => ({ ...prev, [resolvedId]: resolvedInfo }));
    setActiveProjectId(resolvedId);
  };

  const updateProjectInfo = (projectId, updates) => {
    setProjects((prev) => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || {}), ...updates },
    }));
  };

  const addChatEntry = (projectId, entry) => {
    setChatHistory((prev) => {
      const hist = prev[projectId] || [];
      return { ...prev, [projectId]: [...hist, entry] };
    });
  };

  const removeProject = (projectId) => {
    setProjects((prev) => {
      const updated = { ...prev };
      delete updated[projectId];
      return updated;
    });
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        setActiveProjectId,
        addProject,
        updateProjectInfo,
        chatHistory,
        addChatEntry,
        removeProject,
        isUploading,
        setIsUploading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
