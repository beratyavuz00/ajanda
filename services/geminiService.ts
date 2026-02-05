import { GoogleGenAI, Type } from "@google/genai";
import { SmartTaskResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const parseSmartTask = async (userInput: string): Promise<SmartTaskResponse | null> => {
  if (!apiKey) {
    console.warn("API Key is missing.");
    return null;
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayName = today.toLocaleDateString('tr-TR', { weekday: 'long' });

  const prompt = `
    Bugünün tarihi: ${todayStr} (${dayName}).
    Kullanıcı girdisini analiz et ve yapılandırılmış bir görev nesnesi oluştur.
    Tarihleri her zaman YYYY-MM-DD formatına çevir. 
    Eğer kullanıcı "yarın" derse bugünün tarihine 1 gün ekle.
    Eğer saat belirtilmemişse null dön.
    Öncelik (priority) belirtilmemişse bağlama göre tahmin et veya MEDIUM dön.
    
    Kullanıcı girdisi: "${userInput}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Görevin kısa başlığı" },
            description: { type: Type.STRING, description: "Varsa ek detaylar" },
            date: { type: Type.STRING, description: "YYYY-MM-DD formatında tarih" },
            time: { type: Type.STRING, description: "HH:mm formatında saat veya null" },
            priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
          },
          required: ["title", "priority"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;

    return JSON.parse(jsonText) as SmartTaskResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
