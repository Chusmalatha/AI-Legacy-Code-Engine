import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  const parseMarkdown = (text) => {
    if (!text) return null;
    
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Extract language and code
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : 'javascript';
        const code = match ? match[2] : part.slice(3, -3);
        
        return (
          <div key={index} className="my-3 rounded-lg overflow-hidden text-sm shadow-lg border border-gray-700">
            <div className="bg-gray-800 px-4 py-1.5 text-xs text-gray-400 flex justify-between items-center border-b border-gray-700 font-mono">
              <span>{lang || 'code'}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(code)}
                className="hover:text-white transition-colors duration-150"
              >
                Copy
              </button>
            </div>
            <SyntaxHighlighter
              language={lang || 'javascript'}
              style={atomDark}
              customStyle={{ margin: 0, padding: '1rem', background: '#1e1e1e' }}
            >
              {code.trim()}
            </SyntaxHighlighter>
          </div>
        );
      } else {
        // Parse list items, bold, inline code, paragraphs
        // Split by double newlines to separate paragraphs/lists
        const blocks = part.split('\n\n');
        
        return blocks.map((block, bIdx) => {
          if (!block.trim()) return null;
          
          const lines = block.split('\n');
          const renderedElements = [];
          
          let currentListType = null; // 'ul', 'ol', or null
          let listItems = [];
          
          const renderTextWithFormatting = (txt) => {
            const subParts = txt.split(/(\*\*.*?\*\*|`.*?`)/g);
            return subParts.map((sub, sIdx) => {
              if (sub.startsWith('**') && sub.endsWith('**')) {
                return <strong key={sIdx} className="font-bold text-gray-100">{sub.slice(2, -2)}</strong>;
              } else if (sub.startsWith('`') && sub.endsWith('`')) {
                return <code key={sIdx} className="bg-gray-800 text-indigo-400 px-1.5 py-0.5 rounded font-mono text-sm border border-gray-700">{sub.slice(1, -1)}</code>;
              }
              return sub;
            });
          };

          const flushList = (key) => {
            if (listItems.length === 0) return;
            if (currentListType === 'ul') {
              renderedElements.push(
                <ul key={key} className="list-disc pl-6 mb-3.5 space-y-2 text-gray-200 marker:text-indigo-400">
                  {listItems.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              );
            } else if (currentListType === 'ol') {
              renderedElements.push(
                <ol key={key} className="list-decimal pl-6 mb-3.5 space-y-2 text-gray-200 marker:text-indigo-400 marker:font-semibold">
                  {listItems.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ol>
              );
            }
            listItems = [];
            currentListType = null;
          };

          lines.forEach((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            
            // Match unordered list
            const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
            // Match ordered list
            const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
            
            if (ulMatch) {
              if (currentListType !== 'ul') {
                flushList(`list-flush-${lIdx}`);
                currentListType = 'ul';
              }
              listItems.push(renderTextWithFormatting(ulMatch[2]));
            } else if (olMatch) {
              if (currentListType !== 'ol') {
                flushList(`list-flush-${lIdx}`);
                currentListType = 'ol';
              }
              listItems.push(renderTextWithFormatting(olMatch[2]));
            } else {
              // Not a list item
              flushList(`list-flush-${lIdx}`);
              renderedElements.push(
                <p key={`p-${lIdx}`} className="mb-3.5 last:mb-0 leading-relaxed text-gray-200">
                  {renderTextWithFormatting(line)}
                </p>
              );
            }
          });
          
          flushList(`list-flush-end`);
          
          return (
            <div key={bIdx} className="mb-3.5 last:mb-0">
              {renderedElements}
            </div>
          );
        });
      }
    });
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-6`}>
      <div className="flex items-center space-x-2 mb-1.5 px-1">
        {!isUser && (
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}
        <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
          {isUser ? 'You' : 'Legacy Engine'}
        </span>
        {isUser && (
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>
      <div 
        className={`max-w-3xl rounded-2xl px-5 py-3.5 shadow-xl border ${
          isUser 
            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-500 rounded-tr-none'
            : 'bg-gray-800 text-gray-100 border-gray-700 rounded-tl-none'
        }`}
      >
        <div className="text-[15px] leading-relaxed">
          {parseMarkdown(message.content)}
        </div>
        
        {/* Render Citations/Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-700/60">
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center space-x-1">
              <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Source Citations</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((src, idx) => {
                const path = typeof src === 'object' ? src.file_path : src;
                const name = typeof src === 'object' ? src.chunk_name : '';
                const parts = path.split('/');
                const filename = parts[parts.length - 1];
                return (
                  <div 
                    key={idx} 
                    className="flex items-center space-x-1 bg-gray-900/60 border border-gray-700/80 hover:border-indigo-500/80 hover:bg-gray-900 px-2.5 py-1 rounded-md text-xs font-mono text-indigo-300 cursor-pointer transition-all duration-150 group shadow-sm"
                    title={path}
                  >
                    <span>{filename}</span>
                    {name && <span className="text-[10px] text-gray-500 group-hover:text-indigo-400">#{name}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
