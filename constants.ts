import { Conversation, PresetMessage } from './types';

export const DEFAULT_PRESET_MESSAGE: PresetMessage = "Salut! Nu am mai primit niciun răspuns. Mai ești interesat de ofertă?";

// Helper to subtract hours from current time
const hoursAgo = (hours: number) => Date.now() - hours * 60 * 60 * 1000;

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    partnerId: 'mock_p1',
    partnerName: 'Ion Popescu',
    avatarUrl: 'https://picsum.photos/seed/ion/200/200',
    status: 'waiting_for_partner',
    messages: [
      { id: 'm1', sender: 'partner', text: 'Bună ziua, cât costă serviciul?', timestamp: hoursAgo(48) },
      { id: 'm2', sender: 'me', text: 'Bună Ion, prețul este de 200 RON.', timestamp: hoursAgo(47) },
    ]
  },
  {
    id: 'c2',
    partnerId: 'mock_p2',
    partnerName: 'Maria Ionescu',
    avatarUrl: 'https://picsum.photos/seed/maria/200/200',
    status: 'waiting_for_partner',
    messages: [
      { id: 'm3', sender: 'partner', text: 'Aveți livrare în Cluj?', timestamp: hoursAgo(5) },
      { id: 'm4', sender: 'me', text: 'Da, livrăm oriunde în țară.', timestamp: hoursAgo(2) },
    ]
  },
  {
    id: 'c3',
    partnerId: 'mock_p3',
    partnerName: 'Andrei Radu',
    avatarUrl: 'https://picsum.photos/seed/andrei/200/200',
    status: 'waiting_for_me',
    messages: [
      { id: 'm5', sender: 'me', text: 'Iată detaliile cerute.', timestamp: hoursAgo(30) },
      { id: 'm6', sender: 'partner', text: 'Mulțumesc, revin cu un telefon.', timestamp: hoursAgo(29) },
    ]
  },
  {
    id: 'c4',
    partnerId: 'mock_p4',
    partnerName: 'Elena Dumitrescu',
    avatarUrl: 'https://picsum.photos/seed/elena/200/200',
    status: 'waiting_for_partner',
    messages: [
      { id: 'm7', sender: 'partner', text: 'Vreau să fac o rezervare.', timestamp: hoursAgo(100) },
      { id: 'm8', sender: 'me', text: 'Sigur, pentru ce dată?', timestamp: hoursAgo(99) },
    ]
  },
  {
    id: 'c5',
    partnerId: 'mock_p5',
    partnerName: 'George Marin',
    avatarUrl: 'https://picsum.photos/seed/george/200/200',
    status: 'waiting_for_partner',
    messages: [
      { id: 'm9', sender: 'partner', text: 'Aveți pe stoc?', timestamp: hoursAgo(26) },
      { id: 'm10', sender: 'me', text: 'Momentan nu, dar aducem săptămâna viitoare.', timestamp: hoursAgo(25) },
    ]
  }
];