import React, { useRef, useEffect } from 'react';
import { Message, Sender } from '../types';
import { Send, Bot, User, Code, Layers } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: () => void;
  onViewDiagram: (code: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  input, 
  setInput, 
  isLoading, 
  onSend,
  onViewDiagram
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
        
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
            <h1 className="font-bold text-gray-100">ArchMind Agent</h1>
            <p className="text-xs text-indigo-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Active
            </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
            <div className="mt-10 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                    <Bot className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-200">What shall we build?</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    Describe a system you want to architect. Example: <br/>
                    <span className="text-indigo-400 italic">"A real-time chat app using Redis Pub/Sub, Node.js, and React."</span>
                </p>
            </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.sender === Sender.USER ? 'bg-gray-700' : 'bg-indigo-600'
            }`}>
              {msg.sender === Sender.USER ? (
                <User className="w-5 h-5 text-gray-300" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col max-w-[85%] space-y-2`}>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.sender === Sender.USER 
                        ? 'bg-gray-800 text-gray-100 rounded-tr-none border border-gray-700' 
                        : 'bg-indigo-900/30 text-gray-200 rounded-tl-none border border-indigo-500/30'
                }`}>
                    {msg.text}
                </div>
                
                {/* Action Buttons for AI Messages */}
                {msg.sender === Sender.AI && msg.diagramCode && (
                    <button 
                        onClick={() => onViewDiagram(msg.diagramCode!)}
                        className="self-start flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-gray-800/50 px-3 py-1.5 rounded-full border border-indigo-500/20 hover:border-indigo-500/50"
                    >
                        <Code className="w-3 h-3" />
                        Load Diagram
                    </button>
                )}
                
                <span className="text-[10px] text-gray-500 opacity-70 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-indigo-900/30 p-3 rounded-2xl rounded-tl-none border border-indigo-500/30 flex items-center gap-2">
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
        <div className="relative">
            <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your system architecture..."
                disabled={isLoading}
                className="w-full bg-gray-800 text-gray-100 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-gray-700 resize-none h-14 max-h-32 disabled:opacity-50 placeholder-gray-500"
            />
            <button
                onClick={onSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 text-center">
            Powered by Google Gemini • Mermaid.js
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;