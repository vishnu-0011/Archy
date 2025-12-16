import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface DiagramRendererProps {
  code: string;
}

const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code) return;
      
      setError(null);
      
      try {
        const id = `mermaid-${Date.now()}`;
        // mermaid.render returns an object { svg } in newer versions
        const { svg } = await mermaid.render(id, code);
        setSvgContent(svg);
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        setError("Invalid Diagram Syntax. The AI model generated code that Mermaid could not parse.");
        // We do not setSvgContent here to keep the old one or show error
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-xl relative">
      {/* Header / Toolbar */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
        <span className="text-gray-300 text-xs font-mono uppercase tracking-wider">Visualizer</span>
        <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[#0d1117] relative custom-grid"
        ref={containerRef}
      >
        {!code && !error && (
            <div className="text-gray-500 flex flex-col items-center">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>No architecture generated yet.</p>
                <p className="text-sm mt-2 opacity-50">Describe your system in the chat to begin.</p>
            </div>
        )}
        
        {error && (
             <div className="text-red-400 p-4 border border-red-900/50 bg-red-900/20 rounded max-w-md text-center">
                <p className="font-bold mb-2">Rendering Error</p>
                <p className="text-sm font-mono">{error}</p>
            </div>
        )}

        {svgContent && !error && (
          <div 
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>

      {/* Background Grid Pattern CSS */}
      <style>{`
        .custom-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
};

export default DiagramRenderer;