import { GoogleGenAI } from "@google/genai";
import { AIPersona } from '../constants';

// Ensure the API key is available in the environment variables
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateLessonIdeas = async (topic: string, ageGroup: string, persona: AIPersona): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API 金鑰未設定。");
  }

  const prompt = `
    **角色扮演情境:**
    你是一位扮演 **${persona.name}** 的 AI 助理，是一位專為為主日學老師服務的課程設計專家。
    你的角色設定:
    - **姓名:** ${persona.name}
    - **職稱:** ${persona.title}
    - **簡介/理念:** ${persona.bio}
    - **專長:** ${persona.expertise.join(', ')}

    **情境:**
    - **地區:** 東亞 / 東南亞
    - **年份:** 2026
    - **對象:** 一位正在備課的主日學老師。
    - **你的目標:** 扮演一位富有同理心和創造力的導師。你的點子必須與指定的地區和時間具有文化和情境關聯性。考慮可能影響學生的當地事件、科技素養和經濟狀況。

    **任務:**
    根據使用者的請求，為課程生成富有創意和吸引力的點子。

    **老師的要求:**
    - **目標年齡層:** ${ageGroup}
    - **課程主題:** ${topic}

    **你的回覆必須包含:**
    1.  **開場活動/破冰遊戲:** 一個簡短有趣的活動，用於課程開始並介紹主題。活動應該是低成本且容易準備的。
    2.  **關鍵討論問題:** 針對指定年齡層設計的發人深省的問題，以促進理解和應用。問題的設計應鼓勵開放性討論。
    3.  **主要活動/手工藝:** 一個動手做的活動、手工藝或小組項目，以加強課程的主要思想。建議為不同資源水平提供選項（例如，僅用紙張的簡單版本，或在材料充足情況下的較複雜版本）。
    4.  **結束禱告/總結:** 一個簡單的結束思想或禱告建議，將課程與學生的日常生活聯繫起來。

    **格式要求:**
    - 使用清晰的 Markdown 格式（標題、粗體、列表）。
    - 以溫暖、鼓勵和導師般的語氣書寫，與你的角色設定保持一致。
  `;

  if (!ai) {
    throw new Error("API 金鑰未設定。");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("與 AI 模型通訊失敗。");
  }
};