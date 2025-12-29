
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, Card } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getWardenDialogue = async (gameState: GameState, context: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sei il Custode della Foresta, un'entità misteriosa e oscura simile a Leshy di Inscryption. 
      Stai giocando a carte con un viandante. Il gioco si chiama "Spiriti della Foresta".
      Stato del gioco: Salute Giocatore: ${gameState.playerHealth}, Salute Custode: ${gameState.opponentHealth}, Livello: ${gameState.currentLevel}.
      Contesto dell'azione: ${context}.
      Rispondi con una breve frase enigmatica, cupa e suggestiva in Italiano. Massimo 15 parole.`,
    });
    return response.text || "Il bosco osserva il tuo fallimento...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Il silenzio della foresta è assordante.";
  }
};

export const getLevelIntro = async (level: number): Promise<string> => {
  try {
    const levels = [
      "Il Sentiero dei Sospiri",
      "La Palude delle Ossa",
      "La Radura del Sangue",
      "Il Cuore del Bosco Oscuro",
      "L'Abisso delle Radici"
    ];
    const levelName = levels[Math.min(level - 1, levels.length - 1)];
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sei il Custode della Foresta. Introduci il giocatore al livello ${level} chiamato "${levelName}". 
      Sii inquietante, breve e accogli il giocatore in questa nuova area del bosco. Massimo 25 parole in Italiano.`,
    });
    return response.text || `Benvenuto a ${levelName}. Pochi tornano da qui.`;
  } catch (error) {
    return "Il sentiero si stringe. Prosegui, se ne hai il coraggio.";
  }
};

export const generateRandomSpirit = async (): Promise<Partial<Card>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Genera un nuovo spirito della foresta per un gioco di carte. Dammi il nome, un'abilità breve e i valori (Attacco 0-4, Salute 1-5, Costo 0-3).",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            attack: { type: Type.INTEGER },
            health: { type: Type.INTEGER },
            cost: { type: Type.INTEGER },
          },
          required: ["name", "description", "attack", "health", "cost"]
        }
      }
    });
    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (error) {
    return {
      name: "Spirito Errante",
      description: "Non ha forma fissa.",
      attack: 1,
      health: 1,
      cost: 1
    };
  }
};
