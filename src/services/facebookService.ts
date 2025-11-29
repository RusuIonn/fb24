import { Conversation, Message } from '@/types';
import { MOCK_CONVERSATIONS } from '@/constants';

const GRAPH_API_VERSION = 'v19.0';

interface FacebookAuthResponse {
  accessToken: string;
  pageId: string;
  pageName: string;
}

interface FacebookError {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

interface FacebookConversationsResponse {
  data: any[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Verifies the token and retrieves the actual page details (ID, Name).
 */
export const getFacebookPageDetails = async (accessToken: string): Promise<{id: string, name: string}> => {
  if (accessToken.startsWith('mock_')) {
     return { id: '1000123456789', name: 'Magazin Demo (Mock)' };
  }

  const response: Response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/me?fields=id,name&access_token=${accessToken}`);
  const data: { id: string, name: string } & FacebookError = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  return { id: data.id, name: data.name };
};

/**
 * Simulates the Facebook Login process.
 */
export const loginToFacebook = async (): Promise<FacebookAuthResponse> => {
  console.log("Initiating Facebook SDK (Mock)...");
  
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
 * Retrieves the page's conversations.
 * If the token is real, it makes a request to the Graph API.
 */
export const getPageConversations = async (pageId: string, accessToken: string): Promise<Conversation[]> => {
  if (accessToken.startsWith('mock_')) {
    console.log("Using simulated data (Mock Token detected)");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_CONVERSATIONS);
      }, 1200);
    });
  }

  console.log(`Connecting to the real Graph API for page ${pageId}...`);
  try {
    let allConversations: any[] = [];
    const fields = 'participants,updated_time,messages.limit(50){message,created_time,from,to}';
    let url: string | undefined = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/conversations?limit=50&fields=${fields}&access_token=${accessToken}`;
    let pagesFetched = 0;

    while (url && pagesFetched < 6) {
      const response: Response = await fetch(url);
      const data: FacebookConversationsResponse & FacebookError = await response.json();

      if (data.error) {
        throw new Error(`Facebook API Error: ${data.error.message}`);
      }

      if (data.data) {
        allConversations = allConversations.concat(data.data);
      }

      url = data.paging?.next;
      pagesFetched++;
    }

    return transformFacebookData({ data: allConversations }, pageId);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

/**
 * Sends a message in a real conversation.
 */
export const sendFacebookMessage = async (
  recipientId: string, 
  text: string, 
  accessToken: string
): Promise<boolean> => {
  if (accessToken.startsWith('mock_')) {
    console.log(`[SIMULATION] Message sent to ${recipientId}: ${text}`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  }

  console.log(`Sending a real message to ${recipientId}`);
  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${accessToken}`;
    const response: Response = await fetch(url, {
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

    const data: FacebookError = await response.json();
    if (data.error) {
       if (data.error.code === 551) {
           throw new Error("This person is not available right now (Error #551). Check permissions or if the user has contacted you recently.");
       }
      throw new Error(`Facebook Send API Error: (#${data.error.code}) ${data.error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Transforms the raw data from Facebook into the application's internal format.
 */
export const transformFacebookData = (fbData: { data: any[] }, pageId: string): Conversation[] => {
  if (!fbData || !fbData.data) return [];

  return fbData.data.map((thread: any) => {
    const participants = thread.participants?.data || [];
    let partner = participants.find((p: any) => p.id !== pageId);
    
    if (!partner && thread.messages?.data) {
        const incomingMsg = thread.messages.data.find((m: any) => m.from && m.from.id !== pageId);
        if (incomingMsg) {
            partner = incomingMsg.from;
        }
    }

    const partnerName = partner?.name || 'Facebook User';
    const partnerId = partner?.id;

    const rawMessages = thread.messages?.data || [];
    const messages: Message[] = rawMessages.map((m: any) => ({
      id: m.id,
      text: m.message || '[Media/Attachment]',
      sender: (m.from?.id === pageId) ? 'me' : 'partner',
      timestamp: new Date(m.created_time).getTime()
    })).reverse();

    const lastMsg = messages[messages.length - 1];
    let status: 'active' | 'waiting_for_partner' | 'waiting_for_me' = 'active';
    if (lastMsg) {
        status = lastMsg.sender === 'me' ? 'waiting_for_partner' : 'waiting_for_me';
    }

    return {
      id: thread.id,
      partnerId: partnerId,
      partnerName,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=random&color=fff`, 
      messages,
      status
    };
  });
};