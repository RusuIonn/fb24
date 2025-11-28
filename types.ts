export interface Message {
  id: string;
  sender: 'me' | 'partner';
  text: string;
  timestamp: number; // Unix timestamp
}

export interface Conversation {
  id: string;
  partnerId?: string; // Facebook PSID (Page Scoped ID) of the user
  partnerName: string;
  avatarUrl: string;
  messages: Message[];
  status: 'active' | 'waiting_for_partner' | 'waiting_for_me';
}

export type PresetMessage = string;

// Standard stats interface
export interface DashboardStats {
  total: number;
  overdue: number;
  responded: number;
}