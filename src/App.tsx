import React, { useState, useEffect } from 'react';
import ConversationList from '@/components/ConversationList';
import ChatWindow from '@/components/ChatWindow';
import LoginScreen from '@/components/LoginScreen';
import { Conversation, Message, PresetMessage } from '@/types';
import { DEFAULT_PRESET_MESSAGE } from '@/constants';
import { loginToFacebook, getPageConversations, sendFacebookMessage, getFacebookPageDetails } from '@/services/facebookService';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authData, setAuthData] = useState<{accessToken: string, pageId: string, pageName: string} | null>(null);

  // App State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [presetMessage, setPresetMessage] = useState<PresetMessage>(DEFAULT_PRESET_MESSAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load auth data from localStorage on initial render
  useEffect(() => {
    const storedAuthData = localStorage.getItem('auth_data');
    if (storedAuthData) {
      const parsedAuthData = JSON.parse(storedAuthData);
      setAuthData(parsedAuthData);
      setIsAuthenticated(true);
      handleRefreshFacebookConnection(parsedAuthData);
    }
  }, []);

  // Save auth data to localStorage whenever it changes
  useEffect(() => {
    if (authData) {
      localStorage.setItem('authData', JSON.stringify(authData));
    } else {
      localStorage.removeItem('authData');
    }
  }, [authData]);

  // Stats Calculations
  const overdueCount = conversations.filter(c => {
      const lastMsg = c.messages[c.messages.length - 1];
      if (!lastMsg) return false;
      return lastMsg.sender === 'me' && (Date.now() - lastMsg.timestamp > 24 * 60 * 60 * 1000);
  }).length;

  // Calculate total messages for the current day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayMessageCount = conversations.reduce((acc, conv) => {
    return acc + conv.messages.filter(m => m.timestamp >= todayStart.getTime()).length;
  }, 0);

  // Sort conversations by latest message timestamp (descending)
  const sortedConversations = [...conversations].sort((a, b) => {
    const lastA = a.messages[a.messages.length - 1]?.timestamp || 0;
    const lastB = b.messages[b.messages.length - 1]?.timestamp || 0;
    return lastB - lastA;
  });

  const handleLogin = async (credentials?: { accessToken: string, pageId: string }) => {
    setIsLoggingIn(true);
    try {
      let result;
      
      if (credentials) {
        // Manual login path: Verify token and get REAL page details to avoid ID mismatch issues
        try {
           const pageDetails = await getFacebookPageDetails(credentials.accessToken);
           result = {
              accessToken: credentials.accessToken,
              pageId: pageDetails.id, // Use the ID returned by API, not the one typed by user
              pageName: pageDetails.name
           };
        } catch (err) {
            console.error("Token invalid:", err);
            alert(`Token-ul pare invalid: ${(err as Error).message}`);
            setIsLoggingIn(false);
            return;
        }
      } else {
        // Simulated standard path
        result = await loginToFacebook();
      }

      setAuthData({ 
        accessToken: result.accessToken, 
        pageId: result.pageId, 
        pageName: result.pageName 
      });
      setIsAuthenticated(true);
      
      // Fetch data immediately after login
      setIsLoadingData(true);
      try {
        const data = await getPageConversations(result.pageId, result.accessToken);
        setConversations(data);
      } catch (err) {
        console.error("Data fetch error on login:", err);
        alert("Autentificare reușită, dar nu s-au putut prelua conversațiile. Verificați permisiunile.");
        setConversations([]);
      }

    } catch (error) {
      console.error("Login failed", error);
      alert("Autentificarea a eșuat. Încearcă din nou.");
    } finally {
      setIsLoggingIn(false);
      setIsLoadingData(false);
    }
  };

  const handleRefreshFacebookConnection = async (credentials?: {accessToken: string, pageId: string}) => {
    const token = credentials?.accessToken || authData?.accessToken;
    if (!token) {
        alert("Te rog completează Access Token.");
        return;
    }

    setIsLoadingData(true);
    try {
      // 1. Verify Page Details again to ensure ID is correct
      const pageDetails = await getFacebookPageDetails(token);
      
      // 2. Update Auth Data with canonical ID
      const newAuthData = {
          accessToken: token,
          pageId: pageDetails.id,
          pageName: pageDetails.name
      };
      setAuthData(newAuthData);

      // 3. Fetch Conversations
      const data = await getPageConversations(newAuthData.pageId, newAuthData.accessToken);
      setConversations(data);
      
      if (!credentials) {
        alert(`Conexiune actualizată pentru pagina: ${pageDetails.name}`);
      }
    } catch (error) {
      console.error("Refresh failed", error);
      alert(`Nu s-au putut prelua datele: ${(error as Error).message}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSendMessage = async (conversationId: string, text: string) => {
    if (!authData) return;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Use partnerId (PSID) if available
    const targetId = conversation.partnerId;
    if (!targetId) {
        alert("Nu s-a putut identifica ID-ul partenerului. Mesajul nu poate fi trimis.");
        return;
    }

    // Optimistic UI Update
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text,
      timestamp: Date.now()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          status: 'waiting_for_partner'
        };
      }
      return conv;
    }));

    // Call API
    try {
      await sendFacebookMessage(targetId, text, authData.accessToken);
    } catch (error) {
      console.error("Failed to send message", error);
      alert(`Eroare la trimitere: ${(error as Error).message}`);
      // In a real app, we would rollback the optimistic update here
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthData(null);
    setConversations([]);
    setSelectedId(null);
  };

  const activeConversation = conversations.find(c => c.id === selectedId) || null;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} isLoading={isLoggingIn} />;
  }

  if (isLoadingData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">Se sincronizează datele cu Facebook...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      
      {/* Sidebar - Mobile Responsive */}
      <div className={`fixed inset-y-0 left-0 z-20 w-80 bg-white transform ${selectedId ? '-translate-x-full' : 'translate-x-0'} md:relative md:translate-x-0 transition duration-200 ease-in-out md:flex md:flex-col border-r border-gray-200 shrink-0`}>
        {/* App Title & Settings Toggle */}
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            <div>
                <h1 className="font-bold text-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    MessengerPulse
                </h1>
            </div>
            <div className="flex gap-1">
              <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                  title="Setări"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
              <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                  title="Deconectare"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
        </div>

        {/* Dashboard Stats */}
        <div className="bg-blue-50 p-4 border-b border-blue-100">
             <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                Conectat ca: {authData?.pageName}
             </div>
             <div className="flex justify-between items-center">
                 <span className="text-sm text-blue-800 font-medium">Conversații Active</span>
                 <span className="font-bold text-blue-900">{conversations.length}</span>
             </div>
             <div className="flex justify-between items-center mt-2">
                 <span className="text-sm text-red-600 font-medium">Fără Răspuns {'>'} 24h</span>
                 <span className="font-bold text-red-700 bg-red-100 px-2 rounded-md">{overdueCount}</span>
             </div>
             <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-100/50">
                 <span className="text-sm text-green-600 font-medium">Mesaje Azi</span>
                 <span className="font-bold text-green-700 bg-green-100 px-2 rounded-md">{todayMessageCount}</span>
             </div>
        </div>

        <ConversationList 
            conversations={sortedConversations} 
            selectedId={selectedId} 
            onSelect={setSelectedId} 
        />
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full w-full relative z-10 bg-white overflow-hidden">
        {selectedId && (
            <button 
                onClick={() => setSelectedId(null)}
                className="md:hidden absolute top-4 left-4 z-50 bg-white p-2 rounded-full shadow-lg border border-gray-200 text-gray-600"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
        )}
        <ChatWindow 
            conversation={activeConversation} 
            onSendMessage={handleSendMessage}
            presetMessage={presetMessage}
        />
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 my-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Setări Aplicație</h2>
                    <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mesaj Prestabilit (pentru follow-up rapid)
                    </label>
                    <textarea 
                        value={presetMessage}
                        onChange={(e) => setPresetMessage(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none text-sm"
                    />
                </div>

                {/* Facebook Configuration Section */}
                <div className="mb-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        Configurare Manuală Facebook
                    </h3>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Facebook Page ID
                            </label>
                            <input 
                                type="text" 
                                value={authData?.pageId || ''} 
                                readOnly
                                className="w-full p-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500"
                                title="Page ID-ul este preluat automat din token"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">ID-ul este setat automat la validarea token-ului.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Facebook Access Token
                            </label>
                            <input 
                                type="text" 
                                value={authData?.accessToken || ''} 
                                onChange={(e) => setAuthData(prev => prev ? ({...prev, accessToken: e.target.value}) : null)}
                                placeholder="Lipeste token-ul aici"
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                            />
                        </div>
                        <button
                            onClick={() => handleRefreshFacebookConnection()}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-blue-200 mt-2"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
                             Validează & Actualizează
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button 
                        onClick={() => setPresetMessage(DEFAULT_PRESET_MESSAGE)}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Resetează Mesajul
                    </button>
                    <button 
                        onClick={() => setShowSettings(false)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Închide
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;