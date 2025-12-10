import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Maximize2, Minimize2, Loader2, Volume2, Mic } from 'lucide-react';
import { chatWithAgent } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  contextData: any; // Raw JSON of products, sales, etc.
}

const AIAssistant: React.FC<AIAssistantProps> = ({ contextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am your VendNexus business assistant. Ask me about inventory, sales trends, or profit analysis.', timestamp: Date.now() }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for API (excluding the very recent user message which is passed separately if needed, 
      // but here we pass history + current in one go via the service structure)
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      
      const response = await chatWithAgent(history, userMsg.text, contextData);
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);

      // Play audio if available
      if (response.audio) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          const buffer = await decodeAudioData(response.audio, audioContext, 24000, 1);
          
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error connecting to the AI service.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50 flex items-center justify-center"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div 
      className={`
        fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 transition-all duration-300
        ${isExpanded ? 'w-full md:w-[600px] h-[80vh]' : 'w-[90vw] md:w-[400px] h-[500px]'}
      `}
    >
      {/* Header */}
      <div className="p-4 bg-teal-700 rounded-t-2xl flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <span className="font-semibold">VendNexus Assistant</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-teal-600 rounded transition-colors"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-teal-600 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`
                max-w-[80%] p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user' 
                  ? 'bg-teal-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'}
              `}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-2">
              <Loader2 size={16} className="animate-spin text-teal-600" />
              <span className="text-xs text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about revenue, stock, or trends..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-2 flex justify-center text-[10px] text-gray-400">
           Powered by Gemini 3 Pro
        </div>
      </div>
    </div>
  );
};

// PCM Decoding Helper
async function decodeAudioData(
  arrayBuffer: ArrayBuffer,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(arrayBuffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export default AIAssistant;