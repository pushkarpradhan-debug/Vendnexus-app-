import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Maximize2, Minimize2, Loader2, Volume2, Mic, AlertTriangle, Calendar, StopCircle } from 'lucide-react';
import { chatWithAgent } from '../services/geminiService';
import { ChatMessage, Product } from '../types';

interface AIAssistantProps {
  contextData: {
    products: Product[];
    salesSummary: any;
    machines: any;
  }; 
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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Expiry Alert State
  const [showExpiryList, setShowExpiryList] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, showExpiryList]);

  // Expiry Analysis
  const now = Date.now();
  const weekInMs = 7 * 24 * 60 * 60 * 1000;
  
  const expiredProducts = contextData.products.filter(p => p.expiryDate && p.expiryDate < now);
  const nearExpiryProducts = contextData.products.filter(p => p.expiryDate && p.expiryDate >= now && p.expiryDate <= now + weekInMs);
  const hasExpiryAlerts = expiredProducts.length > 0 || nearExpiryProducts.length > 0;

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    } else {
      alert("Speech recognition not supported in this browser.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

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
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await chatWithAgent(history, userMsg.text, contextData);
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);

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
        className="fixed bottom-6 right-6 bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50 flex items-center justify-center relative"
      >
        <Bot size={28} />
        {hasExpiryAlerts && (
           <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full animate-bounce"></span>
        )}
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
          {hasExpiryAlerts && (
             <button 
               onClick={() => setShowExpiryList(!showExpiryList)}
               className={`p-1.5 rounded transition-colors mr-1 relative ${showExpiryList ? 'bg-red-600 text-white' : 'hover:bg-teal-600 text-teal-100'}`}
               title="Expiry Alerts"
             >
               <AlertTriangle size={18} />
               {!showExpiryList && (
                 <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border border-teal-700 rounded-full"></span>
               )}
             </button>
          )}
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

      {/* Main Content Area: Chat or Expiry List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 relative">
        {showExpiryList ? (
           <div className="p-4 animate-in fade-in slide-in-from-top-4 duration-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Calendar size={18} className="text-gray-500"/> Expiry Status
                </h3>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">
                  {expiredProducts.length} Expired, {nearExpiryProducts.length} Near
                </span>
             </div>
             
             {expiredProducts.length > 0 && (
               <div className="mb-6">
                 <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle size={12}/> Expired Items
                 </h4>
                 <div className="space-y-2">
                   {expiredProducts.map(p => (
                     <div key={p.id} className="bg-red-50 border border-red-100 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium text-red-900">{p.name}</p>
                          <p className="text-xs text-red-700">Expired: {new Date(p.expiryDate).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs font-bold text-red-800 bg-red-200 px-2 py-1 rounded">
                           Qty: {p.quantity}
                        </span>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {nearExpiryProducts.length > 0 && (
               <div>
                 <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Expiring Soon (7 Days)</h4>
                 <div className="space-y-2">
                   {nearExpiryProducts.map(p => (
                     <div key={p.id} className="bg-orange-50 border border-orange-100 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium text-orange-900">{p.name}</p>
                          <p className="text-xs text-orange-700">Expires: {new Date(p.expiryDate).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs font-bold text-orange-800 bg-orange-200 px-2 py-1 rounded">
                           Qty: {p.quantity}
                        </span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
             
             {expiredProducts.length === 0 && nearExpiryProducts.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                   <p>All products are fresh!</p>
                </div>
             )}
             
             <button 
               onClick={() => setShowExpiryList(false)}
               className="mt-6 w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
             >
               Return to Chat
             </button>
           </div>
        ) : (
          <div className="p-4 space-y-4 min-h-full">
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
        )}
      </div>

      {/* Input */}
      {!showExpiryList && (
        <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
          <div className="flex items-center space-x-2">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title={isListening ? "Stop Listening" : "Speak"}
            >
              {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : "Ask about revenue, stock..."}
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
      )}
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