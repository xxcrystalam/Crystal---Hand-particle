import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a cloud of 3D coordinates representing a specific shape using Gemini.
 */
export const generateParticleShape = async (description: string, count: number): Promise<Coordinates[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a highly aesthetic 3D point cloud shape representing: "${description}". 
      Return a JSON object containing an array of ${count} points. 
      Each point must be an array of 3 numbers [x, y, z]. 
      Normalize all coordinates to be between -3.0 and 3.0.
      Important:
      1. Distribute points evenly to create a solid sense of volume, not just a wireframe.
      2. If the object implies complexity (like a face or animal), ensure key features are recognizable.
      3. Create a visually pleasing composition suitable for a particle system.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            points: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }, // [x, y, z]
              },
            },
          },
          required: ["points"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    const data = JSON.parse(jsonText);
    
    // Validate that we got an array of arrays
    if (Array.isArray(data.points)) {
      // Cast to the correct type after basic validation
      return data.points as Coordinates[];
    }
    
    throw new Error("Invalid format returned");

  } catch (error) {
    console.error("Gemini Shape Generation Error:", error);
    // Fallback to a random cloud if AI fails
    return Array.from({ length: count }, () => [
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    ]);
  }
};