import React, { useRef, useEffect, useState } from 'react';
import { Message, Sender } from '../types';
import { Send, Bot, User, Code, Layers, Github, X, Settings2, ShieldCheck, ShieldAlert, Sparkles, Cpu, Search, Workflow } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: (customPrompt?: string) => void;
  onViewDiagram: (code: string) => void;
  githubToken: string;
  setGithubToken: (token: string) => void;
}

const PRESETS = [
  { id: 'rag', label: 'RAG Pipeline', icon: <Search className="w-3 h-3" />, prompt: "Design a Retrieval-Augmented Generation (RAG) pipeline using LangChain, ChromaDB, and an embedding model." },
  { id: 'agent', label: 'Multi-Agent', icon: <Cpu className="w-3 h-3" />, prompt: "Create a multi-agent orchestration architecture with a master agent, research worker, and code execution tools." },
  { id: 'loop', label: 'Self-Correction', icon: <Workflow className="w-3 h-3" />, prompt: "Build a LangChain-based self-correction loop where a critic agent evaluates the output of a generator agent." },
  { id: 'fullstack', label: 'AI SaaS', icon: <Layers className="w-3 h-3" />, prompt: "Design a full-stack AI SaaS architecture with Next.js, FastAPI, LangChain, and Redis for session memory." }
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  input, 
  setInput, 
  isLoading, 
  onSend,
  onViewDiagram,
  githubToken,
  setGithubToken
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isGithubMode, setIsGithubMode] = useState(false);
  const [showTokenSettings, setShowTokenSettings] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const toggleGithubMode = () => {
    setIsGithubMode(!isGithubMode);
    if (!isGithubMode) setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 relative">
        
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
                <h1 className="font-bold text-gray-100">ArchMind Agent</h1>
                <p className="text-xs text-indigo-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Deep Reasoning Mode
                </p>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
            <div className="mt-10 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4 ring-1 ring-gray-700">
                    <Bot className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-200">AI Architect Ready</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                    I specialize in **Deep Agent** logic and **LangChain** structures. Use a preset below to start.
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {PRESETS.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => onSend(p.prompt)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-850 border border-gray-700 text-[11px] text-gray-300 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all shadow-sm"
                        >
                            {p.icon}
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
              msg.sender === Sender.USER ? 'bg-gray-800' : 'bg-indigo-600'
            }`}>
              {msg.sender === Sender.USER ? (
                <User className="w-4 h-4 text-gray-400" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            <div className={`flex flex-col max-w-[85%] space-y-2`}>
                <div className={`p-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm border transition-all ${
                    msg.sender === Sender.USER 
                        ? 'bg-gray-850 text-gray-200 rounded-tr-none border-gray-700' 
                        : msg.isError 
                            ? 'bg-red-900/20 text-red-300 rounded-tl-none border-red-500/30'
                            : 'bg-indigo-950/40 text-indigo-100 rounded-tl-none border-indigo-500/20'
                }`}>
                    {msg.text}
                </div>
                
                {msg.sender === Sender.AI && msg.diagramCode && (
                    <button 
                        onClick={() => onViewDiagram(msg.diagramCode!)}
                        className="self-start flex items-center gap-2 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-all bg-indigo-500/5 px-4 py-1.5 rounded-full border border-indigo-500/20 hover:bg-indigo-500/10 hover:border-indigo-500/40"
                    >
                        <Code className="w-3 h-3" />
                        Explore Diagram
                    </button>
                )}
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-indigo-950/40 p-3 rounded-2xl rounded-tl-none border border-indigo-500/20 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        
        {/* Quick Presets Bar */}
        {messages.length > 0 && !isLoading && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide no-scrollbar">
                {PRESETS.map(p => (
                    <button 
                        key={p.id}
                        onClick={() => onSend(p.prompt)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/50 border border-gray-700 text-[10px] text-gray-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-all"
                    >
                        {p.icon}
                        {p.label}
                    </button>
                ))}
            </div>
        )}

        {isGithubMode && (
          <div className="flex items-center gap-2 mb-3 text-[11px] bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/20 animate-in slide-in-from-bottom-2 fade-in">
            <Github className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-indigo-200">Repository Mode</span>
            
            <button 
                onClick={() => setShowTokenSettings(!showTokenSettings)}
                className={`ml-auto p-1 rounded-md transition-colors ${githubToken ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-500 hover:bg-gray-800'}`}
                title="GitHub Token Settings"
            >
                {githubToken ? <ShieldCheck className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={toggleGithubMode} className="p-1 rounded-md text-gray-500 hover:bg-gray-800 hover:text-gray-300">
                <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {showTokenSettings && (
            <div className="mb-3 bg-gray-850 p-3 rounded-lg border border-gray-700 animate-in slide-in-from-top-2 fade-in shadow-xl">
                <input 
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="Enter gh_token for private repos"
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
            </div>
        )}

        <div className="relative group">
            <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isGithubMode ? "Paste repo link..." : "Describe your Deep Agent or LangChain..."}
                disabled={isLoading}
                className={`w-full bg-gray-850 text-gray-100 rounded-xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-1 border resize-none min-h-[56px] max-h-40 disabled:opacity-50 transition-all ${
                  isGithubMode ? 'focus:ring-indigo-500/50 border-indigo-500/30' : 'focus:ring-indigo-500/50 border-gray-700'
                }`}
            />
            
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                <button
                    onClick={toggleGithubMode}
                    disabled={isLoading}
                    className={`p-2 rounded-lg transition-all ${isGithubMode ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
                >
                    <Github className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:bg-gray-800 transition-all shadow-lg active:scale-95"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;