import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import DiagramRenderer from './components/DiagramRenderer';
import { generateArchitecture } from './services/geminiService';
import { Message, Sender } from './types';
import { Maximize2, Minimize2, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDiagramCode, setCurrentDiagramCode] = useState<string>('');
  const [showCodePreview, setShowCodePreview] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.USER,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { explanation, mermaidCode } = await generateArchitecture(input);

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
      }
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I encountered an error connecting to the Deep Agent services. Please try again.",
        sender: Sender.AI,
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 overflow-hidden">
      
      {/* Left Panel: Chat */}
      <div className="w-[400px] flex-shrink-0 h-full">
        <ChatInterface
          messages={messages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={handleSendMessage}
          onViewDiagram={setCurrentDiagramCode}
        />
      </div>

      {/* Right Panel: Diagram & Code */}
      <div className="flex-1 h-full p-4 flex flex-col gap-4 relative">
        
        {/* Toggle Code View Button */}
        <div className="absolute top-6 right-6 z-10">
             <button 
                onClick={() => setShowCodePreview(!showCodePreview)}
                className="bg-gray-800/80 backdrop-blur border border-gray-700 text-gray-300 p-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
                title={showCodePreview ? "Hide Code" : "Show Code"}
             >
                {showCodePreview ? <Minimize2 className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
             </button>
        </div>

        {/* Diagram Area */}
        <div className={`flex-1 transition-all duration-300 ${showCodePreview ? 'h-2/3' : 'h-full'}`}>
            <DiagramRenderer code={currentDiagramCode} />
        </div>

        {/* Mermaid Code Inspector (Bottom panel if toggled) */}
        {showCodePreview && (
            <div className="h-1/3 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-400">mermaid.mmd</span>
                    <button onClick={() => navigator.clipboard.writeText(currentDiagramCode)} className="text-xs text-indigo-400 hover:text-indigo-300">
                        Copy
                    </button>
                </div>
                <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-green-400 bg-[#0d1117]">
                    {currentDiagramCode || "// No diagram code generated yet"}
                </pre>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;