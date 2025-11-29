import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

export const generateFollowUpMessage = async (
  partnerName: string,
  history: Message[],
  manualApiKey?: string
): Promise<string> => {
  try {
    // 1. Determine the API Key safely
    let apiKey = manualApiKey;

    // Safe check for process.env (prevents crash on Vercel/Browsers)
    if (!apiKey && typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }

    if (!apiKey) {
      return "Eroare: Lipsă API Key. Te rog configurează cheia Gemini în Setări.";
    }

    // 2. Instantiate GoogleGenAI with the resolved key
    const ai = new GoogleGenAI({ apiKey });

    const conversationText = history.map(m => 
      `${m.sender === 'me' ? 'Eu (Page)' : partnerName}: ${m.text}`
    ).join('\n');

    const prompt = `
      Ești un asistent inteligent pentru o pagină de Facebook.
      Sarcina ta este să scrii un mesaj scurt, politicos și prietenos de revenire (follow-up) în limba română.
      
      Context: Am discutat cu "${partnerName}" dar nu a mai răspuns la ultimul meu mesaj de peste 24 de ore.
      Trebuie să reactivez conversația fără să fiu agasant.
      
      Istoricul conversației:
      ${conversationText}
      
      Te rog generează doar textul mesajului de follow-up, fără ghilimele sau text introductiv. Mesajul trebuie să fie natural.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Nu s-a putut genera mesajul.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Eroare la generarea mesajului. Verifică validitatea API Key-ului în Setări.";
  }
};