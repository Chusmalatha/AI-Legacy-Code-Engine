import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function UploadPage() {
  const [githubUrl, setGithubUrl] = useState("");
  const [zipFile, setZipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleGithubUpload = async () => {
    if (!githubUrl) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("url", githubUrl);
      const res = await axios.post("/api/upload-github", form);
      navigate(`/analysis/${res.data.project_id}`);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleZipUpload = async (e) => {
    e.preventDefault();
    if (!zipFile) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", zipFile);
      const res = await axios.post("/api/upload-zip", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/analysis/${res.data.project_id}`);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Upload Repository</h2>

      {/* GitHub Upload */}
      <div className="mb-6">
        <label className="block mb-1 font-medium">GitHub Repository URL</label>
        <input
          type="text"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="https://github.com/user/repo"
        />
        <button
          onClick={handleGithubUpload}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload GitHub Repo"}
        </button>
      </div>

      {/* ZIP Upload */}
      <form onSubmit={handleZipUpload} className="mb-6">
        <label className="block mb-1 font-medium">ZIP Archive</label>
        <input
          type="file"
          accept=".zip"
          onChange={(e) => setZipFile(e.target.files[0])}
          className="w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload ZIP"}
        </button>
      </form>

      {message && <p className="text-red-600 mt-2">{message}</p>}
    </div>
  );
}
