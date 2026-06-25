import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function IndexingPage() {
  const { projectId } = useParams();
  const [projectName, setProjectName] = useState("");
  const [totalChunks, setTotalChunks] = useState(0);
  const [indexedChunks, setIndexedChunks] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | indexing | completed | error
  const [error, setError] = useState("");

  // Load project info (name) and chunk count
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const projRes = await axios.get(`/api/projects/${projectId}`);
        setProjectName(projRes.data.project_name || projectId);
        const chunksRes = await axios.get(`/api/projects/${projectId}/chunks`);
        setTotalChunks(chunksRes.data.length);
        // also fetch index status
        const idxRes = await axios.get(`/api/projects/${projectId}/index-status`);
        if (idxRes.data.indexed) {
          setIndexedChunks(idxRes.data.chunks_indexed);
          setStatus("completed");
        }
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load project data");
      }
    };
    fetchInfo();
  }, [projectId]);

  const startIndexing = async () => {
    setStatus("indexing");
    setError("");
    try {
      await axios.post(`/api/projects/${projectId}/index`);
      // after creation, refresh status
      const idxRes = await axios.get(`/api/projects/${projectId}/index-status`);
      setIndexedChunks(idxRes.data.chunks_indexed);
      setStatus("completed");
    } catch (err) {
      setError(err.response?.data?.detail || "Indexing failed");
      setStatus("error");
    }
  };

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Embedding & Indexing</h2>
      <p className="mb-2"><strong>Project:</strong> {projectName}</p>
      <p className="mb-2"><strong>Total Chunks:</strong> {totalChunks}</p>
      <p className="mb-2"><strong>Indexed Chunks:</strong> {indexedChunks}</p>
      <p className="mb-4"><strong>Status:</strong> {status}</p>

      {status === "completed" ? (
        <p className="text-green-600">Indexing completed successfully.</p>
      ) : status === "indexing" ? (
        <p className="text-blue-600">Indexing in progress…</p>
      ) : (
        <button
          onClick={startIndexing}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          disabled={status === "indexing"}
        >
          Generate Embeddings & Build Index
        </button>
      )}
    </div>
  );
}
