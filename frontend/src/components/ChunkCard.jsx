import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChunkCard({ chunk }) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105">
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-teal-300 font-medium">
            {chunk.file_path}
          </div>
          <div className="text-xs text-gray-400">
            Score: {chunk.similarity_score?.toFixed(3)}
          </div>
        </div>
        <div className="text-sm text-gray-300 mb-2">
          <span className="font-semibold">{chunk.name}</span> ({chunk.chunk_type})
        </div>
        <SyntaxHighlighter language="python" style={dark} className="rounded-md text-sm">
          {chunk.code_content || ''}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
