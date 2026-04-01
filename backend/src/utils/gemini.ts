import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { logger } from "./logger";

const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

export async function chatCompletionGemini(
  prompt: string,
  gameId: string,
  botId: string,
): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 40,
      },
    });
    return response.text || null;
  } catch (e: any) {
    logger.error({ gameId, botId, error: e }, `[Bot] Gemini generation error`);
    return null;
  }
}
