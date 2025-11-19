import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { collections } from './mongodb';

type AIProvider = 'gemini' | 'openai' | 'ollama';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  preferredProvider?: AIProvider;
}

interface AIResponse {
  success: boolean;
  content?: string;
  provider?: AIProvider;
  error?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// Initialize AI clients
let geminiClient: GoogleGenerativeAI | null = null;
let openaiClient: OpenAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Provider implementations
async function callGemini(request: AIRequest): Promise<AIResponse> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Convert messages to Gemini format
    const systemMsg = request.messages.find(m => m.role === 'system');
    const chatMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const chat = model.startChat({
      history: chatMessages.slice(0, -1) as any,
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 2048,
      },
    });

    // Add system instruction to the last message if present
    const lastMessage = request.messages[request.messages.length - 1];
    const prompt = systemMsg
      ? `${systemMsg.content}\n\n${lastMessage.content}`
      : lastMessage.content;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Get usage metadata if available
    const usageMetadata = (response as any).usageMetadata;

    return {
      success: true,
      content: text,
      provider: 'gemini',
      usage: usageMetadata ? {
        promptTokens: usageMetadata.promptTokenCount,
        completionTokens: usageMetadata.candidatesTokenCount,
        totalTokens: usageMetadata.totalTokenCount
      } : undefined
    };
  } catch (error: any) {
    logger.error('Gemini API error:', error);
    return {
      success: false,
      provider: 'gemini',
      error: error.message
    };
  }
}

async function callOpenAI(request: AIRequest): Promise<AIResponse> {
  try {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2048
    });

    return {
      success: true,
      content: response.choices[0]?.message?.content || '',
      provider: 'openai',
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens
      }
    };
  } catch (error: any) {
    logger.error('OpenAI API error:', error);
    return {
      success: false,
      provider: 'openai',
      error: error.message
    };
  }
}

async function callOllama(request: AIRequest): Promise<AIResponse> {
  try {
    const apiUrl = process.env.OLLAMA_API_URL || 'https://api.ollama.cloud';
    const apiKey = process.env.OLLAMA_API_KEY;

    if (!apiKey) throw new Error('OLLAMA_API_KEY not configured');

    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'kimi-k2:1t-cloud',
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2048
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    return {
      success: true,
      content: data.choices?.[0]?.message?.content || '',
      provider: 'ollama',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined
    };
  } catch (error: any) {
    logger.error('Ollama API error:', error);
    return {
      success: false,
      provider: 'ollama',
      error: error.message
    };
  }
}

// Main AI service with failover
export async function callAI(request: AIRequest): Promise<AIResponse> {
  // Determine provider priority
  const defaultPriority: AIProvider[] = ['gemini', 'openai', 'ollama'];
  let providerOrder = process.env.AI_PROVIDER_PRIORITY
    ? process.env.AI_PROVIDER_PRIORITY.split(',') as AIProvider[]
    : defaultPriority;

  // Move preferred provider to front
  if (request.preferredProvider) {
    providerOrder = [
      request.preferredProvider,
      ...providerOrder.filter(p => p !== request.preferredProvider)
    ];
  }

  // Try each provider in order
  let lastError: string = '';

  for (const provider of providerOrder) {
    logger.info(`Trying AI provider: ${provider}`);

    let result: AIResponse;

    switch (provider) {
      case 'gemini':
        result = await callGemini(request);
        break;
      case 'openai':
        result = await callOpenAI(request);
        break;
      case 'ollama':
        result = await callOllama(request);
        break;
      default:
        continue;
    }

    if (result.success) {
      // Log successful request
      try {
        await collections.aiLogs().insertOne({
          provider: result.provider,
          timestamp: new Date(),
          usage: result.usage,
          success: true
        });
      } catch (e) {
        // Ignore logging errors
      }

      logger.info(`AI request successful with provider: ${provider}`);
      return result;
    }

    lastError = result.error || 'Unknown error';
    logger.warn(`Provider ${provider} failed: ${lastError}`);
  }

  // All providers failed
  return {
    success: false,
    error: `All AI providers failed. Last error: ${lastError}`
  };
}

// Convenience functions for common tasks
export async function generateText(
  prompt: string,
  systemPrompt?: string,
  options?: Partial<AIRequest>
): Promise<string> {
  const messages: AIMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const result = await callAI({
    messages,
    ...options
  });

  if (!result.success) {
    throw new Error(result.error || 'AI generation failed');
  }

  return result.content || '';
}

export async function chat(
  messages: AIMessage[],
  options?: Partial<AIRequest>
): Promise<string> {
  const result = await callAI({
    messages,
    ...options
  });

  if (!result.success) {
    throw new Error(result.error || 'AI chat failed');
  }

  return result.content || '';
}
