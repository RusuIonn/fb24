import React, { useState, useEffect, useRef } from 'react';
import { Conversation } from '@/types';
import { generateFollowUpMessage } from '@/services/geminiService';

// Icons
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const SettingsIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

interface ChatWindowProps {
  conversation: Conversation | null;
  onSendMessage: (conversationId: string, text: string) => void;
  presetMessage: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onSendMessage, presetMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when conversation changes or new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setInputText(''); // Clear input on switch
  }, [conversation, conversation?.messages]);

  const handleSend = () => {
    if (!inputText.trim() || !conversation) return;
    onSendMessage(conversation.id, inputText);
    setInputText('');
  };

  const handleUsePreset = () => {
    setInputText(presetMessage);
  };

  const handleGenerateAI = async () => {
    if (!conversation) return;
    setIsGenerating(true);
    const generatedText = await generateFollowUpMessage(conversation.partnerName, conversation.messages);
    setInputText(generatedText);
    setIsGenerating(false);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 flex-col">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <ClockIcon />
        </div>
        <p>Selectează o conversație pentru a începe.</p>
      </div>
    );
  }

  const lastMsg = conversation.messages[conversation.messages.length - 1];
  const isOverdue = lastMsg?.sender === 'me' && (Date.now() - lastMsg.timestamp > 24 * 60 * 60 * 1000);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
            <img src={conversation.avatarUrl} className="w-10 h-10 rounded-full" alt="avatar" />
          <div>
            <h2 className="font-bold text-gray-800">{conversation.partnerName}</h2>
            <div className="text-xs text-gray-500 flex items-center gap-1">
               Status: 
               <span className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-green-500'}`}>
                {isOverdue ? 'Necesită Follow-up' : 'Activ'}
               </span>
            </div>
          </div>
        </div>
        {isOverdue && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold border border-red-100 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Partenerul nu a răspuns {'>'} 24h
            </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 h-0">
        {conversation.messages.map((msg, index) => {
            const isLastMessage = index === conversation.messages.length - 1;
            // Mark this specific message if it's the one causing the overdue status
            const isTheOverdueMessage = isOverdue && isLastMessage && msg.sender === 'me';
            
            return (
              <div
                key={msg.id}
                className={`flex w-full ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm shadow-sm relative ${
                        msg.sender === 'me'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                      } ${isTheOverdueMessage ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}
                    >
                      <p>{msg.text}</p>
                      <span className={`text-[10px] block text-right mt-1 opacity-70`}>
                        {new Date(msg.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {isTheOverdueMessage && (
                        <span className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            Niciun răspuns primit
                        </span>
                    )}
                </div>
              </div>
            );
        })}
        {isOverdue && (
            <div className="flex justify-center my-6">
                <span className="text-xs bg-red-50 border border-red-100 text-red-600 px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                    <ClockIcon />
                    Au trecut peste 24 de ore de la ultimul mesaj
                </span>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        
        {/* Quick Actions for Overdue */}
        {isOverdue && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={handleUsePreset}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors border border-gray-300"
                >
                    <SettingsIcon />
                    Folosește Mesaj Prestabilit
                </button>
                <button
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs rounded-lg transition-colors border border-purple-200"
                >
                    <SparklesIcon />
                    {isGenerating ? 'Se generează...' : 'Generează Follow-up cu AI'}
                </button>
            </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="relative flex-1">
             <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Scrie un mesaj..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-12 max-h-32 text-sm"
                rows={1}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
              />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;