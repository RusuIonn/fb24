import { Conversation, Message } from '@/types';
import { MOCK_CONVERSATIONS } from '@/constants';

const GRAPH_API_VERSION = 'v19.0';

interface FacebookAuthResponse {
  accessToken: string;
  pageId: string;
  pageName: string;
}

/**
 * Verifică token-ul și preia detaliile reale ale paginii (ID, Nume).
 */
export const getFacebookPageDetails = async (accessToken: string): Promise<{id: string, name: string}> => {
  if (accessToken.startsWith('mock_')) {
     return { id: '1000123456789', name: 'Magazin Demo (Mock)' };
  }

  const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/me?fields=id,name&access_token=${accessToken}`);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  return { id: data.id, name: data.name };
};

/**
 * Simulează procesul de Login cu Facebook.
 */
export const loginToFacebook = async (): Promise<FacebookAuthResponse> => {
  console.log("Se inițiază SDK-ul Facebook (Mock)...");
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        accessToken: 'mock_access_token_' + Date.now(),
        pageId: '1000123456789',
        pageName: 'Magazin Demo'
      });
    }, 2000);
  });
};

/**
 * Preia conversațiile paginii.
 * Dacă token-ul este real, face request către Graph API.
 */
export const getPageConversations = async (pageId: string, accessToken: string): Promise<Conversation[]> => {
  // 1. Dacă folosim token simulat, returnăm date mock
  if (accessToken.startsWith('mock_')) {
    console.log("Folosind date simulate (Mock Token detectat)");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_CONVERSATIONS);
      }, 1200);
    });
  }

  // 2. Dacă avem un token real, apelăm Facebook API cu paginare
  console.log(`Se conectează la Graph API Real pentru pagina ${pageId}...`);
  let allConversations: any[] = [];
  const MAX_PAGES = 6;
  let pagesFetched = 0;

  try {
    const fields = 'participants,updated_time,messages.limit(50){message,created_time,from,to}';
    let url: string | null = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/conversations?limit=50&fields=${fields}&access_token=${accessToken}`;

    while (url && pagesFetched < MAX_PAGES) {
      pagesFetched++;
      console.log(`Fetching page ${pagesFetched}/${MAX_PAGES} from URL: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Facebook API Error: ${data.error.message}`);
      }

      if (data.data && data.data.length > 0) {
        allConversations = [...allConversations, ...data.data];
      }

      // Preia următorul URL pentru paginare
      url = data.paging?.next || null;
    }

    // Transformă datele agregate
    return transformFacebookData({ data: allConversations }, pageId);
  } catch (error) {
    console.error("Eroare la preluarea conversațiilor:", error);
    throw error;
  }
};

/**
 * Trimite un mesaj într-o conversație reală.
 */
export const sendFacebookMessage = async (
  recipientId: string, 
  text: string, 
  accessToken: string
): Promise<boolean> => {
  // 1. Simulare
  if (accessToken.startsWith('mock_')) {
    console.log(`[SIMULARE] Mesaj trimis către ${recipientId}: ${text}`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  }

  // 2. API Real
  console.log(`Se trimite mesaj real către ${recipientId}`);
  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: text },
        messaging_type: "RESPONSE"
      })
    });

    const data = await response.json();
    if (data.error) {
       // Tratăm eroarea specifică #551 (Persoana indisponibilă)
       if (data.error.code === 551) {
           throw new Error("Această persoană nu este disponibilă momentan (Error #551). Verificați permisiunile sau dacă utilizatorul v-a contactat recent.");
       }
      throw new Error(`Facebook Send API Error: (#${data.error.code}) ${data.error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error("Eroare la trimiterea mesajului:", error);
    throw error;
  }
};

/**
 * Transformă datele brute de la Facebook în formatul intern al aplicației.
 */
export const transformFacebookData = (fbData: any, pageId: string): Conversation[] => {
  if (!fbData || !fbData.data) return [];

  return fbData.data.map((thread: any) => {
    // Identificăm partenerul (cel care NU este pagina curentă)
    const participants = thread.participants?.data || [];
    let partner = participants.find((p: any) => p.id !== pageId);
    
    // Fallback: Dacă nu putem identifica partenerul din lista de participanți, 
    // încercăm să îl găsim în mesaje (sender care nu este pagina)
    if (!partner && thread.messages?.data) {
        const incomingMsg = thread.messages.data.find((m: any) => m.from && m.from.id !== pageId);
        if (incomingMsg) {
            partner = incomingMsg.from;
        }
    }

    // Fallback names
    const partnerName = partner?.name || 'Utilizator Facebook';
    const partnerId = partner?.id; // Important: ID-ul utilizatorului (PSID) pentru trimiterea răspunsului

    // Mapăm mesajele
    const rawMessages = thread.messages?.data || [];
    // Facebook returnează mesajele în ordine inversă (cel mai recent primul), le inversăm pentru afișare
    const messages: Message[] = rawMessages.map((m: any) => ({
      id: m.id,
      text: m.message || '[Media/Attachment]',
      // CRITICAL: Ensure robust sender check even if pageId format varies slightly
      sender: (m.from?.id === pageId) ? 'me' : 'partner',
      timestamp: new Date(m.created_time).getTime()
    })).reverse();

    // Determinăm statusul (simplificat)
    const lastMsg = messages[messages.length - 1];
    let status: 'active' | 'waiting_for_partner' | 'waiting_for_me' = 'active';
    if (lastMsg) {
        status = lastMsg.sender === 'me' ? 'waiting_for_partner' : 'waiting_for_me';
    }

    return {
      id: thread.id, // Conversation ID
      partnerId: partnerId,
      partnerName,
      // Folosim un avatar generat deoarece FB nu oferă imaginea publică direct prin API standard fără permisiuni avansate
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=random&color=fff`, 
      messages,
      status
    };
  });
};