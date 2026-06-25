import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function TreeNode({ name, children }) {
  const [open, setOpen] = useState(true);
  const isFile = Object.keys(children).length === 0;
  return (
    <div className="ml-4">
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {isFile ? (
          <span className="text-gray-600">📄 {name}</span>
        ) : (
          <span className="font-medium">{open ? "📂" : "📁"} {name}</span>
        )}
      </div>
      {open && !isFile && (
        <div className="ml-4">
          {Object.entries(children).map(([childName, childChildren]) => (
            <TreeNode key={childName} name={childName} children={childChildren} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StructurePage() {
  const { projectId } = useParams();
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const res = await axios.get(`/api/projects/${projectId}/structure`);
        setStructure(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load structure");
      } finally {
        setLoading(false);
      }
    };
    fetchStructure();
  }, [projectId]);

  if (loading) return <p className="p-6">Loading structure...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Project: {structure.project_name}</h2>
      <div className="border rounded p-4 bg-gray-50 max-h-[70vh] overflow-auto">
        {Object.entries(structure.structure).map(([name, children]) => (
          <TreeNode key={name} name={name} children={children} />
        ))}
      </div>
    </div>
  );
}
