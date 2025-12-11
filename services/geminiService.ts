import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Product, SaleRecord, Machine } from '../types';

// Helper to get a fresh client instance every time to avoid API key race conditions
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from process.env");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBusinessInsight = async (
  query: string,
  contextData: { products: Product[], sales: SaleRecord[], machines: Machine[] }
): Promise<string> => {
  
  const prompt = `
    You are the VendNexus AI Assistant, a specialized business analyst for a vending machine network.
    
    Context Data:
    - Machines: ${JSON.stringify(contextData.machines)}
    - Inventory Summary: ${JSON.stringify(contextData.products.map(p => ({ name: p.name, qty: p.quantity, machine: p.machineId })))}
    - Recent Sales (Last 50): ${JSON.stringify(contextData.sales.slice(0, 50))}

    User Query: ${query}

    Instructions:
    1. Answer specifically based on the provided data.
    2. Be concise but professional.
    3. If asked about revenue, calculate it from the sales data provided.
    4. If asked for recommendations, identify low stock items or high-margin products.
    5. Do not hallucinate data not present in the context.
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for reasoning capability
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, // Moderate thinking for analysis
      }
    });
    return response.text || "I couldn't analyze the data at this moment.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Sorry, I encountered an error analyzing your business data.";
  }
};

export const suggestOptimalPrice = async (
  product: Product,
  recentSales: SaleRecord[]
): Promise<{ suggestedPrice: number; reasoning: string } | null> => {
  const productSales = recentSales.filter(s => s.productId === product.id);
  const salesCount = productSales.length;
  const revenue = productSales.reduce((acc, s) => acc + s.revenue, 0);

  const prompt = `
    Analyze pricing for: "${product.name}" (${product.category}).
    - Cost: $${product.cost}
    - Current Price: $${product.price}
    - Stock: ${product.quantity} (Min: ${product.min_quantity})
    - Sales (Last 30d): ${salesCount} units, $${revenue.toFixed(2)} revenue.
    - Expiry: ${new Date(product.expiryDate).toLocaleDateString()}
    
    Goal: Maximize profit margin while maintaining turnover. Consider expiration risk.
    Return JSON with 'suggestedPrice' (number) and 'reasoning' (string).
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPrice: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Price Suggestion Error:", error);
    return null;
  }
};

export const generateSpeechFromText = async (text: string): Promise<ArrayBuffer | null> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const generateProductImage = async (productName: string): Promise<string | null> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional, commercial product photography shot of ${productName}, isolated on a clean white background, studio lighting, high resolution, 4k.` }],
      },
    });
    
    // Iterate through parts to find the image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};


export const chatWithAgent = async (
  history: { role: 'user' | 'model', text: string }[],
  currentMessage: string,
  contextData: any
): Promise<{ text: string, audio?: ArrayBuffer }> => {
  
  const systemInstruction = `
    You are VendNexus AI, an intelligent vending machine operations assistant.
    You have access to real-time inventory, sales, and machine status.
    
    Current System State:
    ${JSON.stringify(contextData)}

    Your goal is to help the owner optimize profits, manage stock, and fix issues.
    If the user asks about expanding the business or market trends, you can provide general advice.
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: currentMessage }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        // Using Thinking Config as requested. 
        // Note: 'tools' are disabled to avoid conflicts with 'thinkingConfig' in this preview model.
        thinkingConfig: { thinkingBudget: 32768 } 
      }
    });

    const responseText = response.text || "I'm not sure how to respond to that.";

    // Generate audio for the response automatically
    // Truncate for audio generation speed
    let audioBuffer: ArrayBuffer | null = null;
    try {
      audioBuffer = await generateSpeechFromText(responseText.substring(0, 300));
    } catch (e) {
      console.warn("Audio generation skipped due to error", e);
    }
    
    // Check for grounding (if available in response metadata)
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let finalResponse = responseText;
    if (grounding) {
       const sources = grounding.map((g: any) => g.web?.uri).filter(Boolean).join('\n');
       if (sources) finalResponse += `\n\nSources:\n${sources}`;
    }

    return {
      text: finalResponse,
      audio: audioBuffer || undefined
    };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "I'm having trouble connecting to the VendNexus network. Please try again." };
  }
};
