import React from 'react';
import { DiagramVersion } from '../types';
import { Clock, ChevronRight, Check } from 'lucide-react';

interface HistoryPanelProps {
  versions: DiagramVersion[];
  currentCode: string;
  onSelect: (version: DiagramVersion) => void;
  isOpen: boolean;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  versions, 
  currentCode, 
  onSelect, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 shadow-2xl z-30 flex flex-col transform transition-transform duration-300 ease-in-out">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-850">
        <div className="flex items-center gap-2 text-gray-200 font-semibold">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Version History</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No versions yet.
          </div>
        ) : (
          [...versions].reverse().map((version, index) => {
            const isSelected = version.code === currentCode;
            const versionNumber = versions.length - index;
            
            return (
              <button
                key={version.id}
                onClick={() => onSelect(version)}
                className={`w-full text-left p-3 rounded-lg border transition-all group ${
                  isSelected 
                    ? 'bg-indigo-900/30 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-mono font-medium ${
                    isSelected ? 'text-indigo-300' : 'text-gray-400 group-hover:text-gray-300'
                  }`}>
                    v{versionNumber}
                  </span>
                  <span className="text-[10px] text-gray-600 group-hover:text-gray-500">
                    {new Date(version.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <p className={`text-sm line-clamp-2 ${
                  isSelected ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-300'
                }`}>
                  {version.prompt}
                </p>
                
                {isSelected && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-indigo-400 font-medium">
                     <Check className="w-3 h-3" />
                     Current View
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;