import { OllamaModel } from '../types';

/**
 * Multi-Provider Chat Service with Automatic Fallback
 *
 * Priority Chain:
 * 1. Ollama kimi-k2:1t-cloud (Primary)
 * 2. Ollama qwen-coder:480b-cloud (Secondary)
 * 3. Google Gemini gemini-2.0-flash-exp (Tertiary)
 * 4. OpenAI gpt-4o (Quaternary)
 *
 * Features:
 * - Automatic failover if a provider is unavailable
 * - Conversation history management
 * - Vision analysis support
 * - Web search with grounding sources (Gemini only)
 */

const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  enableFallback?: boolean;
}

type Provider = 'ollama' | 'gemini' | 'openai';

/**
 * Provider configuration with models
 */
const PROVIDER_CONFIG = {
  ollama: {
    primary: 'kimi-k2:1t-cloud',
    secondary: 'qwen-coder:480b-cloud',
    vision: 'llava:34b',
  },
  gemini: {
    primary: 'gemini-2.0-flash-exp',
    vision: 'gemini-2.0-flash-exp',
  },
  openai: {
    primary: 'gpt-4o',
    vision: 'gpt-4o',
  },
};

/**
 * Chat class with automatic provider failover
 */
export class Chat {
  private history: Message[] = [];
  private temperature: number;
  private topP: number;
  private maxTokens: number;
  private enableFallback: boolean;
  private currentProvider: Provider | null = null;

  constructor(options: ChatOptions = {}) {
    this.temperature = options.temperature ?? 0.7;
    this.topP = options.topP ?? 1.0;
    this.maxTokens = options.maxTokens ?? 2048;
    this.enableFallback = options.enableFallback ?? true;
  }

  /**
   * Send a message with automatic fallback
   */
  async sendMessage(userMessage: string): Promise<string> {
    this.history.push({
      role: 'user',
      content: userMessage,
    });

    const providers: Array<{ provider: Provider; model: string }> = [
      { provider: 'ollama', model: PROVIDER_CONFIG.ollama.primary },
      { provider: 'ollama', model: PROVIDER_CONFIG.ollama.secondary },
      { provider: 'gemini', model: PROVIDER_CONFIG.gemini.primary },
      { provider: 'openai', model: PROVIDER_CONFIG.openai.primary },
    ];

    for (let i = 0; i < providers.length; i++) {
      const { provider, model } = providers[i];

      try {
        console.log(`🔄 Trying ${provider} (${model})...`);

        const response = await this.callProvider(provider, model);

        console.log(`✅ Success with ${provider}`);
        this.currentProvider = provider;

        // Add assistant response to history
        this.history.push({
          role: 'assistant',
          content: response,
        });

        return response;
      } catch (error) {
        console.log(`⚠️ ${provider} failed:`, error instanceof Error ? error.message : 'Unknown error');

        if (!this.enableFallback || i === providers.length - 1) {
          throw error;
        }

        console.log(`↪️ Falling back to next provider...`);
      }
    }

    throw new Error('All AI providers failed');
  }

  /**
   * Call a specific provider
   */
  private async callProvider(provider: Provider, model: string): Promise<string> {
    const response = await fetch(`${API_URL}/api/unified`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: this.history,
        model,
        temperature: this.temperature,
        top_p: this.topP,
        maxTokens: this.maxTokens,
        preferredProvider: provider,
        enableFallback: false, // We handle fallback at this level
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
    this.currentProvider = null;
  }

  /**
   * Set system instruction
   */
  setSystemInstruction(instruction: string): void {
    this.history = this.history.filter(msg => msg.role !== 'system');
    this.history.unshift({
      role: 'system',
      content: instruction,
    });
  }

  /**
   * Get the current provider being used
   */
  getCurrentProvider(): Provider | null {
    return this.currentProvider;
  }
}

/**
 * Perform web search with automatic fallback
 * Priority: Gemini (has native search) > Ollama > OpenAI
 */
export async function performSearch(
  query: string,
  options: ChatOptions = {}
): Promise<{ content: string; sources?: any[] }> {
  // Try Gemini first (has native web search with sources)
  const providers: Array<{ provider: Provider; model: string; hasSearch: boolean }> = [
    { provider: 'gemini', model: PROVIDER_CONFIG.gemini.primary, hasSearch: true },
    { provider: 'ollama', model: PROVIDER_CONFIG.ollama.primary, hasSearch: false },
    { provider: 'ollama', model: PROVIDER_CONFIG.ollama.secondary, hasSearch: false },
    { provider: 'openai', model: PROVIDER_CONFIG.openai.primary, hasSearch: false },
  ];

  for (let i = 0; i < providers.length; i++) {
    const { provider, model, hasSearch } = providers[i];

    try {
      console.log(`🔄 Trying search with ${provider}...`);

      const searchPrompt = hasSearch
        ? `Search the web and provide information about: ${query}`
        : `Please provide information about: ${query}`;

      const response = await fetch(`${API_URL}/api/unified`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: searchPrompt }],
          model,
          temperature: options.temperature ?? 0.7,
          top_p: options.topP ?? 1.0,
          maxTokens: options.maxTokens ?? 2048,
          preferredProvider: provider,
          enableFallback: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Search successful with ${provider}`);

      return {
        content: data.choices[0].message.content,
        sources: data.groundingMetadata?.groundingChunks, // Only available for Gemini
      };
    } catch (error) {
      console.log(`⚠️ Search failed with ${provider}:`, error instanceof Error ? error.message : 'Unknown error');

      if (!options.enableFallback || i === providers.length - 1) {
        throw error;
      }

      console.log(`↪️ Falling back to next provider...`);
    }
  }

  throw new Error('All AI providers failed for search');
}

/**
 * Analyze image with automatic fallback
 * Priority: Gemini (best vision) > OpenAI > Ollama
 */
export async function analyzeImage(
  imageData: string,
  prompt: string,
  options: ChatOptions = {}
): Promise<string> {
  const providers: Array<{ provider: Provider; model: string }> = [
    { provider: 'gemini', model: PROVIDER_CONFIG.gemini.vision },
    { provider: 'openai', model: PROVIDER_CONFIG.openai.vision },
    { provider: 'ollama', model: PROVIDER_CONFIG.ollama.vision },
  ];

  for (let i = 0; i < providers.length; i++) {
    const { provider, model } = providers[i];

    try {
      console.log(`🔄 Trying image analysis with ${provider}...`);

      const response = await fetch(`${API_URL}/api/unified`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageData } },
              ],
            },
          ],
          model,
          temperature: options.temperature ?? 0.7,
          top_p: options.topP ?? 1.0,
          maxTokens: options.maxTokens ?? 2048,
          preferredProvider: provider,
          enableFallback: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Image analysis successful with ${provider}`);

      return data.choices[0].message.content;
    } catch (error) {
      console.log(`⚠️ Image analysis failed with ${provider}:`, error instanceof Error ? error.message : 'Unknown error');

      if (!options.enableFallback || i === providers.length - 1) {
        throw error;
      }

      console.log(`↪️ Falling back to next provider...`);
    }
  }

  throw new Error('All AI providers failed for image analysis');
}

/**
 * Analyze text with automatic fallback
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
 * Generate lesson ideas with automatic fallback
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
    temperature: options.temperature ?? 0.7,
    topP: options.topP ?? 1.0,
    maxTokens: options.maxTokens ?? 2048,
    enableFallback: options.enableFallback ?? true,
  });

  return await chat.sendMessage(prompt);
}

/**
 * Test provider availability
 */
export async function testProviders(): Promise<{
  ollama: boolean;
  gemini: boolean;
  openai: boolean;
}> {
  const results = {
    ollama: false,
    gemini: false,
    openai: false,
  };

  const testMessage = 'Hello, respond with OK';

  // Test Ollama
  try {
    const response = await fetch(`${API_URL}/api/unified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: testMessage }],
        model: PROVIDER_CONFIG.ollama.primary,
        preferredProvider: 'ollama',
        enableFallback: false,
        maxTokens: 10,
      }),
    });
    results.ollama = response.ok;
  } catch {
    results.ollama = false;
  }

  // Test Gemini
  try {
    const response = await fetch(`${API_URL}/api/unified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: testMessage }],
        model: PROVIDER_CONFIG.gemini.primary,
        preferredProvider: 'gemini',
        enableFallback: false,
        maxTokens: 10,
      }),
    });
    results.gemini = response.ok;
  } catch {
    results.gemini = false;
  }

  // Test OpenAI
  try {
    const response = await fetch(`${API_URL}/api/unified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: testMessage }],
        model: PROVIDER_CONFIG.openai.primary,
        preferredProvider: 'openai',
        enableFallback: false,
        maxTokens: 10,
      }),
    });
    results.openai = response.ok;
  } catch {
    results.openai = false;
  }

  return results;
}

export default {
  Chat,
  performSearch,
  analyzeImage,
  analyzeText,
  generateLessonIdeas,
  testProviders,
};
