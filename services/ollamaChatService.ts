import { OllamaModel } from '../types';

/**
 * Ollama Chat Service
 * Provides direct interaction with Ollama models
 * Mirrors Gemini service interface for consistency
 */

const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: OllamaModel;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

/**
 * Chat class for maintaining conversation history
 */
export class Chat {
  private history: Message[] = [];
  private model: OllamaModel;
  private temperature: number;
  private topP: number;

  constructor(options: ChatOptions = {}) {
    this.model = options.model || 'kimi-k2:1t-cloud';
    this.temperature = options.temperature ?? 0.7;
    this.topP = options.topP ?? 1.0;
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(userMessage: string): Promise<string> {
    // Add user message to history
    this.history.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await fetch(`${API_URL}/api/ollama`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.history,
          temperature: this.temperature,
          top_p: this.topP,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Add assistant response to history
      this.history.push({
        role: 'assistant',
        content: assistantMessage,
      });

      return assistantMessage;
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.history];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Set system instruction
   */
  setSystemInstruction(instruction: string): void {
    // Remove existing system message if any
    this.history = this.history.filter(msg => msg.role !== 'system');

    // Add new system message at the beginning
    this.history.unshift({
      role: 'system',
      content: instruction,
    });
  }
}

/**
 * Perform a web search (delegated to Gemini as Ollama doesn't have native search)
 */
export async function performSearch(
  query: string,
  options: ChatOptions = {}
): Promise<string> {
  const chat = new Chat(options);

  // Since Ollama doesn't have native web search, we'll just process the query
  // For actual web search with sources, the multi-provider service will use Gemini
  const prompt = `Please provide information about: ${query}`;

  return await chat.sendMessage(prompt);
}

/**
 * Analyze an image using vision-capable Ollama models
 */
export async function analyzeImage(
  imageData: string,
  prompt: string,
  options: ChatOptions = {}
): Promise<string> {
  // Use a vision-capable model
  const visionModel = options.model || 'llava:34b';

  try {
    const response = await fetch(`${API_URL}/api/ollama`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                },
              },
            ],
          },
        ],
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 1.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Ollama image analysis error:', error);
    throw error;
  }
}

/**
 * Analyze text using Ollama
 */
export async function analyzeText(
  text: string,
  instruction: string,
  options: ChatOptions = {}
): Promise<string> {
  const chat = new Chat(options);
  chat.setSystemInstruction(instruction);
  return await chat.sendMessage(text);
}

/**
 * Generate lesson ideas using Ollama
 */
export async function generateLessonIdeas(
  topic: string,
  ageGroup: string,
  persona: {
    name: string;
    title: string;
    bio: string;
    expertise: string[];
  },
  options: ChatOptions = {}
): Promise<string> {
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

  const chat = new Chat({
    model: options.model || 'kimi-k2:1t-cloud',
    temperature: options.temperature ?? 0.7,
    topP: options.topP ?? 1.0,
  });

  return await chat.sendMessage(prompt);
}

/**
 * List available Ollama models
 */
export async function listModels(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/api/ollama/models`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error listing Ollama models:', error);
    return [];
  }
}

export default {
  Chat,
  performSearch,
  analyzeImage,
  analyzeText,
  generateLessonIdeas,
  listModels,
};
