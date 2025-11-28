import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (credentials?: { accessToken: string; pageId: string }) => void;
  isLoading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading }) => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Manual Login State
  const [manualPageId, setManualPageId] = useState('');
  const [manualToken, setManualToken] = useState('');

  const handleStartLogin = () => {
    // Show the simulated permission modal instead of logging in immediately
    setShowPermissionModal(true);
  };

  const handleConfirmPermissions = () => {
    // User clicked "Continue as..." in the mock popup
    onLogin();
    // Keep the modal open while loading to simulate the redirect back
  };

  const handleManualLogin = () => {
    if (!manualPageId || !manualToken) {
      alert("Te rog introdu Page ID și Token-ul.");
      return;
    }
    onLogin({ accessToken: manualToken, pageId: manualPageId });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center z-10">
        <div className="bg-blue-600 p-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#1877F2" stroke="none">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MessengerPulse</h1>
          <p className="text-blue-100">Automatizează răspunsurile pentru clienții tăi</p>
        </div>
        
        <div className="p-8">
          {!isManualMode ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Conectează Pagina de Facebook</h2>
              <p className="text-gray-600 text-sm mb-8">
                Pentru a identifica mesajele la care nu s-a răspuns și a trimite notificări automate, avem nevoie de acces la mesajele paginii tale.
              </p>
              
              <button
                onClick={handleStartLogin}
                disabled={isLoading || showPermissionModal}
                className={`w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>Se conectează...</>
                ) : (
                  <span>Continuă cu Facebook</span>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setIsManualMode(true)}
                  className="text-sm text-gray-500 hover:text-blue-600 underline"
                >
                  Sau intră manual cu Access Token
                </button>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Conexiune securizată SSL
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
               <h2 className="text-lg font-semibold text-gray-800 mb-4">Logare Manuală Token</h2>
               
               <div className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Page ID</label>
                    <input 
                      type="text"
                      value={manualPageId}
                      onChange={(e) => setManualPageId(e.target.value)}
                      placeholder="ex: 1000123456789"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Access Token</label>
                    <input 
                      type="password"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Token-ul paginii..."
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
               </div>

               <button
                onClick={handleManualLogin}
                disabled={isLoading}
                className="w-full mt-6 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md flex justify-center"
               >
                 {isLoading ? 'Se verifică...' : 'Logare cu Token'}
               </button>

               <button 
                  onClick={() => setIsManualMode(false)}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  Înapoi la logare standard
                </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Facebook Permission Popup */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl max-w-[500px] w-full overflow-hidden border border-gray-300">
                {/* FB Header */}
                <div className="bg-[#3b5998] p-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="text-white font-bold text-sm">Log in with Facebook</span>
                </div>

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1877F2] mb-4"></div>
                         <p className="text-gray-600 font-medium">Se verifică permisiunile...</p>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                             <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden border border-gray-300">
                                 {/* App Icon placeholder */}
                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                             </div>
                             <div>
                                 <h3 className="font-bold text-gray-900 text-lg">MessengerPulse</h3>
                                 <p className="text-sm text-gray-500">solicită acces la:</p>
                             </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 text-[#1877F2]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm">Administrarea și accesarea conversațiilor Paginii</p>
                                    <p className="text-xs text-gray-500">Permite citirea mesajelor de la clienți și trimiterea răspunsurilor.</p>
                                </div>
                            </div>
                             <div className="flex gap-3 items-start">
                                <div className="mt-0.5 text-[#1877F2]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm">Afișarea listei Paginilor pe care le administrezi</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                             <button 
                                onClick={handleConfirmPermissions}
                                className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-2.5 px-4 rounded-md transition-colors text-sm"
                            >
                                Continuă ca Administrator
                            </button>
                             <button 
                                onClick={() => setShowPermissionModal(false)}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-md transition-colors text-sm"
                            >
                                Anulează
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-4 text-center">
                            Aceasta este o simulare a procesului de conectare Facebook. Nu se transmit date reale.
                        </p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;