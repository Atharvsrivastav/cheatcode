import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Search, 
  Sun, 
  Menu, 
  ChevronDown, 
  Sparkles, 
  Play, 
  Maximize2, 
  MoreVertical, 
  Plus,
  Terminal,
  MessageCircle,
  X,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { sendMessageStream, Message } from './services/geminiService';

const DEFAULT_CODE = `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!");\n    return 0;\n}`;

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('c');
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiPane, setShowAiPane] = useState(false);
  const [activeTab, setActiveTab] = useState('Main.c');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (showAiPane) {
      scrollToBottom();
    }
  }, [messages, showAiPane]);

  const handleRunCode = () => {
    alert("Running code...\nOutput: Hello, World!");
  };

  const handleAskAi = async (text?: string) => {
    const query = text || aiInput;
    if (!query.trim() || isAiLoading) return;
    
    setShowAiPane(true);
    setIsAiLoading(true);
    setAiInput('');

    const userMsg: Message = { role: 'user', content: query };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      const modelMsg: Message = { role: 'model', content: '' };
      setMessages(prev => [...prev, modelMsg]);

      let fullResponse = '';
      const stream = sendMessageStream(newMessages);

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: fullResponse };
          return updated;
        });
      }
    } catch (error: any) {
      const errorMsg = error?.message || "I encountered an error. Please try again.";
      setMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1].role === 'model' && !updated[updated.length - 1].content) {
          updated[updated.length - 1].content = `Error: ${errorMsg}`;
        } else {
          updated.push({ role: 'model', content: `Error: ${errorMsg}` });
        }
        return updated;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans select-none">
      {/* Top Navbar */}
      <header className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white z-20">
        <div className="flex items-center gap-6">
          <Menu size={20} className="text-gray-500 cursor-pointer lg:hidden" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="4" fill="#3B82F6"/>
                <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#002B5B]">OneCompiler</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
              <span>Learn</span>
              <ChevronDown size={14} />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors text-blue-600 border-b-2 border-blue-600 py-3.5 mt-0.5">
              <span>Code</span>
              <ChevronDown size={14} />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
              <span>Deploy</span>
              <ChevronDown size={14} />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
              <span>More</span>
              <ChevronDown size={14} />
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Search size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
          <Sun size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
          <button className="hidden md:block px-4 py-1.5 text-sm font-semibold text-[#002B5B] hover:bg-gray-50 rounded transition-colors">
            Login
          </button>
        </div>
      </header>

      {/* Compiler Breadcrumb / Toolbar */}
      <div className="h-11 border-b border-gray-200 bg-[#F3F4F6] flex items-center justify-between px-2 text-sm">
        <div className="flex items-center h-full">
          <div className={`px-4 h-full flex items-center gap-2 border-r border-gray-200 cursor-pointer transition-colors ${activeTab === 'Main.c' ? 'bg-white font-semibold text-blue-600 border-t-2 border-t-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            <span>Main.c</span>
            <X size={12} className="text-gray-400" />
          </div>
          <button className="p-2 hover:bg-gray-200 text-gray-500">
            <Plus size={16} />
          </button>
          <div className="ml-6 font-medium text-gray-500 hidden sm:block">
            C Language Hello World
          </div>
        </div>

        <div className="flex items-center gap-2 px-2">
          <button 
            onClick={() => handleAskAi(`Rewrite this code in C minimally, no explanation: \n\n${code}`)}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded font-bold transition-all shadow-sm active:scale-95"
          >
            <Sparkles size={16} />
            <span>AI</span>
          </button>
          
          <div className="flex items-center gap-1 px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded font-bold cursor-pointer transition-all active:scale-95">
            <span className="uppercase">{language}</span>
            <ChevronDown size={16} />
          </div>

          <button 
            onClick={handleRunCode}
            className="flex items-center gap-2 px-6 py-1.5 bg-[#EC4899] hover:bg-[#DB2777] text-white rounded font-bold transition-all shadow-sm active:scale-95"
          >
            <Play size={16} fill="white" />
            <span>RUN</span>
          </button>

          <div className="flex items-center gap-1 ml-2 text-gray-400">
            <button className="p-1.5 hover:bg-gray-200 rounded text-gray-500">
              <MoreVertical size={18} />
            </button>
            <button className="p-1.5 hover:bg-gray-200 rounded text-gray-500">
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor Area */}
        <div className="flex-1 border-r border-gray-200 relative bg-white">
          <Editor
            height="100%"
            defaultLanguage={language}
            defaultValue={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 10 }
            }}
          />
        </div>

        {/* Right Pane (STDIN / Output / AI) */}
        <div className={`w-full md:w-[40%] flex flex-col bg-[#F9FAFB] border-l border-gray-200 transition-all duration-300 ${showAiPane ? 'translate-x-0' : 'md:translate-x-0'}`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex gap-4">
              <button className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b-2 border-transparent pb-1">STDIN</button>
              <button 
                onClick={() => setShowAiPane(false)}
                className={`text-xs font-bold uppercase tracking-wider border-b-2 pb-1 ${!showAiPane ? 'text-gray-800 border-gray-800' : 'text-gray-500 border-transparent'}`}
              >
                Output
              </button>
              <button 
                onClick={() => setShowAiPane(true)}
                className={`text-xs font-bold uppercase tracking-wider border-b-2 pb-1 flex items-center gap-1 ${showAiPane ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'}`}
              >
                AI Help <Sparkles size={12} className={isAiLoading ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm relative">
            {!showAiPane ? (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded p-3 text-gray-400 italic">
                  Input for the program ( Optional )
                </div>
                <div>
                  <div className="text-gray-600 mb-2">Output:</div>
                  <div className="text-gray-400">Click on RUN button to see the output</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4 text-blue-600 font-bold border-b border-blue-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} />
                    <span>Gemini AI Chat v2</span>
                  </div>
                  <button 
                    onClick={() => {
                      setMessages([]);
                    }}
                    className="text-[10px] text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
                        <MessageCircle size={24} />
                      </div>
                      <p className="text-gray-400 italic text-xs max-w-[200px]">I provide direct answers. If you need code, I only write in C.</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="flex flex-col max-w-[85%] group">
                          <div className={`p-3 rounded-2xl text-[13px] relative ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none prose prose-sm'
                          }`}>
                            {msg.role === 'user' ? (
                              msg.content
                            ) : (
                              <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                            )}
                          </div>
                          {msg.role === 'model' && msg.content && (
                            <button 
                              onClick={() => handleCopy(msg.content, i)}
                              className="self-end mt-1 p-1 text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                            >
                              {copiedIndex === i ? (
                                <>
                                  <Check size={12} className="text-green-500" />
                                  <span className="text-[10px] lowercase font-medium text-green-500">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span className="text-[10px] lowercase font-medium">Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="relative mt-auto">
                  <textarea 
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Type your question (C only)..."
                    className="w-full p-3 pr-10 text-xs border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-400 outline-none bg-white font-sans resize-none shadow-sm"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAskAi();
                      }
                    }}
                  />
                  <button 
                    onClick={() => handleAskAi()}
                    disabled={!aiInput.trim() || isAiLoading}
                    className="absolute right-2 bottom-2 p-1.5 text-blue-500 hover:text-blue-700 disabled:text-gray-300 transition-colors"
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
            <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase font-bold">
              <span className="flex items-center gap-1"><Terminal size={12} /> Console</span>
              <span className="flex items-center gap-4">
                <span>Memory: 0MB</span>
                <span>Time: 0s</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
