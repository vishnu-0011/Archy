import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import DiagramRenderer from './components/DiagramRenderer';
import HistoryPanel from './components/HistoryPanel';
import NodeInspectorPanel from './components/NodeInspectorPanel';
import { generateArchitecture } from './services/geminiService';
import { fetchRepoContext, parseGitHubUrl } from './services/githubService';
import { Message, Sender, DiagramVersion, NodeDetail } from './types';
import { Minimize2, Terminal, History, Bot } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDiagramCode, setCurrentDiagramCode] = useState<string>('');
  const [currentNodeDetails, setCurrentNodeDetails] = useState<NodeDetail[]>([]);
  const [showCodePreview, setShowCodePreview] = useState(false);
  
  const [diagramVersions, setDiagramVersions] = useState<DiagramVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('archmind_gh_token') || '';
  });

  useEffect(() => {
    localStorage.setItem('archmind_gh_token', githubToken);
  }, [githubToken]);

  const handleSendMessage = async (customPrompt?: string) => {
    const finalInput = customPrompt || input;
    if (!finalInput.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: finalInput,
      sender: Sender.USER,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let repoContext = "";
      const githubMeta = parseGitHubUrl(finalInput);
      
      if (githubMeta) {
        const analyzingMsg: Message = {
          id: Date.now().toString() + "-status",
          text: `🔍 Exploring repository: ${githubMeta.owner}/${githubMeta.repo}...`,
          sender: Sender.AI,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, analyzingMsg]);
        
        try {
            const contextData = await fetchRepoContext(finalInput, githubToken);
            repoContext = contextData.summary;
            setMessages(prev => prev.map(m => 
              m.id === analyzingMsg.id 
                ? { ...m, text: `✅ Repo structure analyzed. Synthesizing detailed architecture...` }
                : m
            ));
        } catch (err: any) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: `GitHub Sync Failed: ${err.message}`,
                sender: Sender.AI,
                timestamp: Date.now(),
                isError: true
            }]);
            setIsLoading(false);
            return;
        }
      }

      const { explanation, mermaidCode, nodeDetails } = await generateArchitecture(
          githubMeta ? `Generate a high-granularity architecture for ${githubMeta.owner}/${githubMeta.repo}.` : finalInput, 
          repoContext
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: explanation,
        sender: Sender.AI,
        timestamp: Date.now(),
        diagramCode: mermaidCode,
        nodeDetails
      };

      setMessages(prev => [...prev, aiMsg]);
      
      if (mermaidCode) {
        setCurrentDiagramCode(mermaidCode);
        setCurrentNodeDetails(nodeDetails);
        setDiagramVersions(prev => [...prev, {
          id: Date.now().toString(),
          code: mermaidCode,
          nodeDetails,
          timestamp: Date.now(),
          prompt: finalInput
        }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Deep Agent reasoning error. Please try a different prompt.",
        sender: Sender.AI,
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionSelect = (version: DiagramVersion) => {
    setCurrentDiagramCode(version.code);
    setCurrentNodeDetails(version.nodeDetails);
    setSelectedNode(null);
    setActiveElementId(null);
  };

  const handleNodeClick = (nodeId: string, label: string) => {
    // Advanced normalization to handle Mermaid's internal ID munging and AI's label variation
    const clean = (s: string) => s.toLowerCase().trim().replace(/['"]+/g, '').replace(/[^a-z0-9]/g, '');
    
    const targetLabel = clean(label);
    const targetId = clean(nodeId);

    const detail = currentNodeDetails.find(d => {
        const dId = clean(d.id);
        const dLabel = clean(d.label);
        // Check ID match, Label match, or partial overlap
        return dId === targetId || 
               dLabel === targetLabel || 
               (dLabel.length > 3 && targetLabel.includes(dLabel)) || 
               (targetLabel.length > 3 && dLabel.includes(targetLabel));
    });

    if (detail) {
      setSelectedNode(detail);
      setActiveElementId(nodeId); // Track which SVG element should be highlighted
      setShowHistory(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 overflow-hidden font-sans">
      <div className="w-[420px] flex-shrink-0 h-full z-10 shadow-2xl border-r border-gray-900">
        <ChatInterface
          messages={messages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={handleSendMessage}
          onViewDiagram={(code) => {
            setCurrentDiagramCode(code);
            const msg = messages.find(m => m.diagramCode === code);
            if (msg?.nodeDetails) setCurrentNodeDetails(msg.nodeDetails);
          }}
          githubToken={githubToken}
          setGithubToken={setGithubToken}
        />
      </div>

      <div className="flex-1 h-full relative flex flex-col bg-gray-950">
        <div className="flex-1 h-full p-6 flex flex-col gap-6 overflow-hidden relative">
            <div className={`flex-1 transition-all duration-500 ease-in-out ${showCodePreview ? 'h-2/3' : 'h-full'} relative`}>
                <DiagramRenderer 
                    code={currentDiagramCode} 
                    onNodeClick={handleNodeClick}
                    activeNodeId={activeElementId}
                    extraToolbarContent={
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => { setShowHistory(!showHistory); setSelectedNode(null); setActiveElementId(null); }}
                                className={`p-2 rounded-lg transition-all flex items-center gap-2 text-[11px] font-bold border ${
                                    showHistory ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-indigo-500' : 'bg-gray-850 text-gray-400 border-gray-700'
                                }`}
                             >
                                <History className="w-4 h-4" />
                                <span className="hidden xl:inline">HISTORY</span>
                             </button>
                             <button 
                                onClick={() => setShowCodePreview(!showCodePreview)}
                                className={`p-2 rounded-lg transition-all border ${
                                    showCodePreview ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-indigo-500' : 'bg-gray-850 text-gray-400 border-gray-700'
                                }`}
                             >
                                {showCodePreview ? <Minimize2 className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                             </button>
                        </div>
                    }
                />
                
                <HistoryPanel 
                    versions={diagramVersions}
                    currentCode={currentDiagramCode}
                    onSelect={handleVersionSelect}
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                />

                <NodeInspectorPanel
                    node={selectedNode}
                    onClose={() => { setSelectedNode(null); setActiveElementId(null); }}
                />
            </div>

            {showCodePreview && (
                <div className="h-1/3 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col shadow-2xl flex-shrink-0 animate-in slide-in-from-bottom duration-300">
                    <div className="bg-gray-850 px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Terminal className="w-3 h-3" />
                            Mermaid Script
                        </span>
                        <button onClick={() => navigator.clipboard.writeText(currentDiagramCode)} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300">COPY TO CLIPBOARD</button>
                    </div>
                    <div className="flex-1 overflow-auto p-0 bg-gray-950">
                        <pre className="p-5 text-xs font-mono text-indigo-300/80 leading-relaxed">{currentDiagramCode}</pre>
                    </div>
                </div>
            )}
            
            {!currentDiagramCode && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-10">
                    <div className="max-w-md text-center">
                        <div className="mb-6 flex justify-center opacity-40">
                            <Bot className="w-20 h-20 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-300 mb-3">Architect Engine Offline</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Select a pattern or provide a prompt to synthesize a detailed architectural system.
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;