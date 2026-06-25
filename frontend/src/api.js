import axios from 'axios';

const API_BASE = '';

export const uploadRepository = async (url, file) => {
  const form = new FormData();
  if (url) form.append('url', url);
  if (file) form.append('file', file);
  const response = await axios.post(`${API_BASE}/api/upload-repository`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data; // {project_id, project_name, status}
};

export const getProjectStatus = async (projectId) => {
  const response = await axios.get(`${API_BASE}/api/project-status/${projectId}`);
  return response.data;
};

export const postQuery = async (projectId, question) => {
  const response = await axios.post(`${API_BASE}/api/query`, {
    project_id: projectId,
    question,
  });
  return response.data; // {answer, sources}
};

export const fetchChatHistory = async (projectId) => {
  const response = await axios.get(`${API_BASE}/api/chat-history/${projectId}`);
  return response.data; // [{question, answer, sources}]
};

export const deleteProject = async (projectId) => {
  const response = await axios.delete(`${API_BASE}/api/projects/${projectId}`);
  return response.data;
};

