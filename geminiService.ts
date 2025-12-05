import { GoogleGenAI, Type } from "@google/genai";
import { StylistResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getOutfitRecommendation = async (
  occasion: string,
  gender: string,
  preferences?: string
): Promise<StylistResponse> => {
  const modelId = "gemini-2.5-flash"; // Best for fast text generation
  
  const systemInstruction = `
    You are a world-class AI Fashion Stylist. 
    Your goal is to recommend elegant, stylish, and appropriate outfits based on the user's event or occasion and gender identity.
    
    Guidelines:
    - Focus on aesthetics, color coordination, and fabric textures.
    - Be descriptive but concise.
    - Do NOT generate images or links.
    - Your tone should be sophisticated, encouraging, and helpful.
    - Ensure the 'primary_outfit' is the absolute best recommendation for the specific request.
    - Provide 3 distinct 'additional_suggestions' (e.g., Casual, Trendy, Budget).
  `;

  const userPrompt = `
    I need an outfit recommendation for a ${gender} for the following occasion: "${occasion}".
    ${preferences ? `My preferences are: ${preferences}` : ""}
    
    Please provide a text-only recommendation structured exactly as requested.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primary_outfit: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                top: { type: Type.STRING },
                bottom: { type: Type.STRING },
                footwear: { type: Type.STRING },
                accessories: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                reasoning: { type: Type.STRING },
              },
              required: ["title", "top", "bottom", "footwear", "accessories", "reasoning"],
            },
            additional_suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  outfit_summary: { type: Type.STRING },
                },
                required: ["label", "outfit_summary"],
              },
            },
            styling_notes: { type: Type.STRING },
          },
          required: ["primary_outfit", "additional_suggestions", "styling_notes"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from AI Stylist.");
    }

    return JSON.parse(text) as StylistResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Unable to generate outfit recommendations at this time. Please try again.");
  }
};