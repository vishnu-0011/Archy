import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import DiagramRenderer from './components/DiagramRenderer';
import HistoryPanel from './components/HistoryPanel';
import { generateArchitecture } from './services/geminiService';
import { fetchRepoContext, parseGitHubUrl } from './services/githubService';
import { Message, Sender, DiagramVersion } from './types';
import { Minimize2, Terminal, History } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDiagramCode, setCurrentDiagramCode] = useState<string>('');
  const [showCodePreview, setShowCodePreview] = useState(false);

  // History State
  const [diagramVersions, setDiagramVersions] = useState<DiagramVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.USER,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    const promptText = input; // capture for history
    setInput('');
    setIsLoading(true);

    try {
      let repoContext = "";

      // Check if input is a GitHub URL
      const githubMeta = parseGitHubUrl(promptText);
      if (githubMeta) {
        // Notify user we are analyzing
        const analyzingMsg: Message = {
          id: Date.now().toString() + "-status",
          text: `🔍 Analyzing repository ${githubMeta.owner}/${githubMeta.repo}...`,
          sender: Sender.AI,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, analyzingMsg]);

        try {
          const contextData = await fetchRepoContext(promptText);
          repoContext = contextData.summary;
          // Update the prompt to specific instruction for repo
          // We keep the original prompt (URL) as the "request", but the service handles it via context
        } catch (err: any) {
          const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: `Could not analyze repository: ${err.message}`,
            sender: Sender.AI,
            timestamp: Date.now(),
            isError: true
          };
          setMessages(prev => [...prev, errorMsg]);
          setIsLoading(false);
          return;
        }
      }

      // Generate Architecture
      const { explanation, mermaidCode } = await generateArchitecture(
        githubMeta ? "Visualize the architecture of this repository based on the provided file structure and readme." : promptText,
        repoContext
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: explanation,
        sender: Sender.AI,
        timestamp: Date.now(),
        diagramCode: mermaidCode
      };

      setMessages(prev => [...prev, aiMsg]);

      if (mermaidCode) {
        setCurrentDiagramCode(mermaidCode);

        // Add to history
        const newVersion: DiagramVersion = {
          id: (Date.now() + 2).toString(),
          code: mermaidCode,
          timestamp: Date.now(),
          prompt: promptText
        };
        setDiagramVersions(prev => [...prev, newVersion]);
      }
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        sender: Sender.AI,
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionSelect = (version: DiagramVersion) => {
    setCurrentDiagramCode(version.code);
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 overflow-hidden">

      {/* Left Panel: Chat */}
      <div className="w-[400px] flex-shrink-0 h-full z-10 shadow-xl">
        <ChatInterface
          messages={messages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={handleSendMessage}
          onViewDiagram={(code) => {
            setCurrentDiagramCode(code);
            // Optionally open history to show context? No, just show it.
          }}
        />
      </div>

      {/* Right Panel: Diagram & Code */}
      <div className="flex-1 h-full relative flex flex-col bg-gray-950">

        {/* Main Content Area */}
        <div className="flex-1 h-full p-4 flex flex-col gap-4 overflow-hidden relative">
          {/* Diagram Area */}
          <div className={`flex-1 transition-all duration-300 ${showCodePreview ? 'h-2/3' : 'h-full'} relative`}>
            <DiagramRenderer
              code={currentDiagramCode}
              extraToolbarContent={
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-1.5 rounded transition-colors flex items-center gap-2 text-xs font-medium border ${showHistory
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      }`}
                    title="Version History"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">History</span>
                    {diagramVersions.length > 0 && (
                      <span className="bg-gray-900/50 px-1.5 rounded text-[10px] min-w-[16px] text-center">
                        {diagramVersions.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setShowCodePreview(!showCodePreview)}
                    className={`p-1.5 rounded transition-colors border ${showCodePreview
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      }`}
                    title={showCodePreview ? "Hide Code" : "Show Code"}
                  >
                    {showCodePreview ? <Minimize2 className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                  </button>
                </>
              }
            />

            {/* History Sidebar Overlay */}
            <HistoryPanel
              versions={diagramVersions}
              currentCode={currentDiagramCode}
              onSelect={handleVersionSelect}
              isOpen={showHistory}
              onClose={() => setShowHistory(false)}
            />
          </div>

          {/* Mermaid Code Inspector (Bottom panel if toggled) */}
          {showCodePreview && (
            <div className="h-1/3 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 flex-shrink-0">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400">mermaid.mmd</span>
                <button onClick={() => navigator.clipboard.writeText(currentDiagramCode)} className="text-xs text-indigo-400 hover:text-indigo-300">
                  Copy
                </button>
              </div>
              <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-green-400 bg-[#0d1117] selection:bg-indigo-500/30">
                {currentDiagramCode || "// No diagram code generated yet"}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;