
import { GoogleGenAI } from "@google/genai";
import { ImageGenConfig } from "../types";

// Always create a new GoogleGenAI instance right before making an API call 
// to ensure it uses the most up-to-date API key from the aistudio dialog.
export const generateOrnamentTexture = async (config: ImageGenConfig): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: config.prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio,
          imageSize: config.imageSize,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Error:", error);
    throw error;
  }
};
