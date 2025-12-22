import React from 'react';
import { NodeDetail } from '../types';
import { X, Info, Zap, Link as LinkIcon, Cpu } from 'lucide-react';

interface NodeInspectorPanelProps {
  node: NodeDetail | null;
  onClose: () => void;
}

const NodeInspectorPanel: React.FC<NodeInspectorPanelProps> = ({ node, onClose }) => {
  if (!node) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-85 bg-gray-900/95 backdrop-blur-xl border-l border-indigo-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-40 flex flex-col animate-in slide-in-from-right duration-300 ease-out">
      <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-850/50">
        <div className="flex items-center gap-3 text-gray-200 font-semibold">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
            <Info className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm tracking-tight uppercase font-bold">Node Inspector</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-700/50 rounded-xl text-gray-400 hover:text-white transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div key={node.id} className="flex-1 overflow-y-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2">
            <h3 className="text-2xl font-black text-white leading-tight tracking-tight">{node.label}</h3>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-widest uppercase bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    ID: {node.id}
                </span>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-indigo-500" />
                Technical Overview
            </h4>
            <p className="text-[14px] text-gray-300 leading-relaxed bg-gray-850/80 p-4 rounded-2xl border border-gray-800/50 shadow-inner">
                {node.description}
            </p>
        </div>

        {node.technologies && node.technologies.length > 0 && (
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                    Stack Capabilities
                </h4>
                <div className="flex flex-wrap gap-2">
                    {node.technologies.map((tech, i) => (
                        <span key={i} className="px-3 py-1.5 bg-emerald-500/5 text-emerald-400 text-[11px] font-bold rounded-xl border border-emerald-500/20 shadow-sm hover:bg-emerald-500/10 transition-colors">
                            {tech}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {node.relatedComponents && node.relatedComponents.length > 0 && (
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-amber-500" />
                    System Context
                </h4>
                <div className="space-y-2.5">
                    {node.relatedComponents.map((comp, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-850/30 rounded-xl border border-gray-800/50 group hover:border-amber-500/40 hover:bg-gray-850/60 transition-all cursor-default">
                            <div className="w-2 h-2 rounded-full bg-amber-500/40 group-hover:bg-amber-500 shadow-sm transition-colors" />
                            <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200">{comp}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="p-6 bg-gray-950/80 border-t border-gray-800/50 backdrop-blur-md">
        <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/10">
            <p className="text-[11px] text-indigo-300/60 text-center leading-relaxed font-medium">
                Deep Agent can provide further clarification on <span className="text-indigo-300 font-bold">{node.label}'s</span> specific implementation details if requested in chat.
            </p>
        </div>
      </div>
    </div>
  );
};

export default NodeInspectorPanel;