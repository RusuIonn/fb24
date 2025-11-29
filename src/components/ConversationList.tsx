import React, { useState } from 'react';
import { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, selectedId, onSelect }) => {
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to check if conversation is overdue (last msg from me > 24h)
  const isOverdue = (conv: Conversation) => {
    const lastMsg = conv.messages[conv.messages.length - 1];
    if (!lastMsg) return false;
    const isMyMsg = lastMsg.sender === 'me';
    const timeDiff = Date.now() - lastMsg.timestamp;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return isMyMsg && hoursDiff >= 24;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    // If today, show time only, else show date
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const baseConversations = filterOverdue
    ? conversations.filter(isOverdue)
    : conversations;

  const searchResults = baseConversations.reduce<{
    nameMatch: Conversation[],
    contentMatch: Conversation[]
  }>((acc, conv) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = conv.partnerName.toLowerCase().includes(term);

    if (nameMatch) {
      acc.nameMatch.push(conv);
    } else {
      const contentMatch = conv.messages.some(msg => msg.text.toLowerCase().includes(term));
      if (contentMatch) {
        acc.contentMatch.push(conv);
      }
    }
    return acc;
  }, { nameMatch: [], contentMatch: [] });

  const finalConversationList = searchTerm
    ? [...searchResults.nameMatch, ...searchResults.contentMatch]
    : baseConversations;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-80">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
            <div>
               <h2 className="text-xl font-bold text-gray-800">Mesaje</h2>
               <p className="text-xs text-gray-500 mt-1">Inbox Pagina</p>
            </div>

            <button
                onClick={() => setFilterOverdue(!filterOverdue)}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    filterOverdue
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                }`}
                title="Arată doar mesajele fără răspuns de 24h"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                {filterOverdue ? 'Doar expirate' : 'Toate'}
            </button>
        </div>

        {/* Search Input */}
        <div className="relative">
            <input
                type="text"
                placeholder="Caută după nume sau mesaj..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {finalConversationList.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
                Niciun rezultat găsit.
            </div>
        )}

        {finalConversationList.map((conv) => {
          const overdue = isOverdue(conv);
          const lastMsg = conv.messages[conv.messages.length - 1];
          const isSelected = selectedId === conv.id;

          // Determine background styling
          let bgClass = 'hover:bg-gray-50';
          let borderClass = 'border-l-4 border-transparent';

          if (isSelected) {
            bgClass = 'bg-blue-50';
            borderClass = 'border-l-4 border-blue-500';
          } else if (overdue) {
            bgClass = 'bg-red-50 hover:bg-red-100'; // Distinctive red background for overdue
            borderClass = 'border-l-4 border-red-400';
          }
          
          return (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`conversation-item p-4 border-b border-gray-100 cursor-pointer transition-colors ${bgClass} ${borderClass}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={conv.avatarUrl}
                    alt={conv.partnerName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {overdue && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white text-[8px] text-white items-center justify-center font-bold">!</span>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-sm font-medium truncate ${overdue ? 'text-red-700 font-bold' : 'text-gray-900'}`}>
                      {conv.partnerName}
                    </h3>
                    <span className="text-xs text-gray-400">{formatTime(lastMsg?.timestamp || 0)}</span>
                  </div>
                  <p className={`text-xs truncate ${overdue ? 'text-red-600/80 font-medium' : 'text-gray-500'}`}>
                    {lastMsg?.sender === 'me' ? 'Tu: ' : ''}{lastMsg?.text}
                  </p>
                  {overdue && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                         Așteaptă de 24h+
                      </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;