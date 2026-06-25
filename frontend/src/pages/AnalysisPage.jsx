import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function AnalysisPage() {
  const { projectId } = useParams();
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingChunks, setLoadingChunks] = useState(true);
  const [error, setError] = useState("");

  // Trigger analysis on mount
  useEffect(() => {
    const runAnalysis = async () => {
      try {
        const res = await axios.post(`/api/projects/${projectId}/analyze`);
        setAnalysisInfo(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to analyze project");
      } finally {
        setLoadingInfo(false);
      }
    };
    runAnalysis();
  }, [projectId]);

  // Load chunks after analysis completes
  useEffect(() => {
    if (analysisInfo && analysisInfo.status === "completed") {
      const fetchChunks = async () => {
        try {
          const res = await axios.get(`/api/projects/${projectId}/chunks`);
          setChunks(res.data);
        } catch (err) {
          setError(err.response?.data?.detail || "Failed to load chunks");
        } finally {
          setLoadingChunks(false);
        }
      };
      fetchChunks();
    }
  }, [analysisInfo, projectId]);

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  if (loadingInfo) {
    return <p className="p-6">Analyzing repository…</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Analysis Results</h2>
      <div className="mb-4">
        <p>Project ID: {analysisInfo.project_id}</p>
        <p>Files Processed: {analysisInfo.files_processed}</p>
        <p>Chunks Created: {analysisInfo.chunks_created}</p>
        <p>Status: {analysisInfo.status}</p>
      </div>

      {loadingChunks ? (
        <p>Loading chunks…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chunks.map((chunk) => (
            <div
              key={chunk.chunk_id}
              className="border rounded p-4 bg-white shadow hover:shadow-lg transition"
            >
              <p className="font-medium mb-1">{chunk.name}</p>
              <p className="text-sm text-gray-600">{chunk.file_path}</p>
              <p className="text-xs text-blue-600">{chunk.language} – {chunk.chunk_type}</p>
              <pre className="mt-2 text-xs overflow-x-auto bg-gray-50 p-2 rounded">
                {chunk.code_content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
