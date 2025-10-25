import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Unified API Proxy for Multiple AI Providers
 * Supports: Ollama, Google Gemini, OpenAI
 * Provides automatic failover based on priority chain
 */

// Environment Variables
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'https://api.ollama.cloud';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Provider Priority Chain (in order of preference)
const PROVIDER_PRIORITY = ['ollama', 'gemini', 'openai'] as const;
type Provider = typeof PROVIDER_PRIORITY[number];

interface UnifiedMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ProviderResponse {
  success: boolean;
  data?: any;
  error?: string;
  provider?: Provider;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      messages,
      model,
      temperature = 0.7,
      top_p = 1.0,
      maxTokens = 2048,
      preferredProvider,
      enableFallback = true,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    console.log('🔄 Unified API Request:', {
      messageCount: messages.length,
      model,
      preferredProvider,
      enableFallback
    });

    // Determine provider order
    let providerOrder = [...PROVIDER_PRIORITY];
    if (preferredProvider) {
      // Move preferred provider to front
      providerOrder = [
        preferredProvider,
        ...PROVIDER_PRIORITY.filter(p => p !== preferredProvider)
      ];
    }

    // Try each provider in order
    for (const provider of providerOrder) {
      console.log(`🔄 Trying provider: ${provider}`);

      const result = await tryProvider(provider, {
        messages,
        model,
        temperature,
        top_p,
        maxTokens,
      });

      if (result.success) {
        console.log(`✅ Success with provider: ${provider}`);
        return res.status(200).json({
          ...result.data,
          _provider: provider,
          _fallbackUsed: preferredProvider && provider !== preferredProvider,
        });
      }

      console.log(`⚠️ Provider ${provider} failed:`, result.error);

      // If fallback is disabled, stop after first attempt
      if (!enableFallback) {
        return res.status(500).json({
          error: result.error,
          provider,
        });
      }

      // Continue to next provider
      console.log(`↪️ Falling back to next provider...`);
    }

    // All providers failed
    return res.status(500).json({
      error: 'All AI providers failed',
      details: 'Please check your API keys and network connection',
    });

  } catch (error) {
    console.error('Unified API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Try to get response from a specific provider
 */
async function tryProvider(
  provider: Provider,
  params: {
    messages: UnifiedMessage[];
    model?: string;
    temperature: number;
    top_p: number;
    maxTokens: number;
  }
): Promise<ProviderResponse> {
  try {
    switch (provider) {
      case 'ollama':
        return await callOllama(params);
      case 'gemini':
        return await callGemini(params);
      case 'openai':
        return await callOpenAI(params);
      default:
        return { success: false, error: `Unknown provider: ${provider}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider,
    };
  }
}

/**
 * Call Ollama API
 */
async function callOllama(params: {
  messages: UnifiedMessage[];
  model?: string;
  temperature: number;
  top_p: number;
  maxTokens: number;
}): Promise<ProviderResponse> {
  if (!OLLAMA_API_KEY) {
    return { success: false, error: 'OLLAMA_API_KEY not configured' };
  }

  const model = params.model || 'kimi-k2:1t-cloud';

  const response = await fetch(`${OLLAMA_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature: params.temperature,
      top_p: params.top_p,
      max_tokens: params.maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `Ollama API error: ${response.status} - ${errorText}`,
    };
  }

  const data = await response.json();

  // Convert to unified format (OpenAI-compatible)
  return {
    success: true,
    provider: 'ollama',
    data: {
      id: data.id || `ollama-${Date.now()}`,
      object: 'chat.completion',
      created: data.created || Math.floor(Date.now() / 1000),
      model: data.model || model,
      choices: data.choices || [{
        index: 0,
        message: {
          role: 'assistant',
          content: data.choices?.[0]?.message?.content || data.response || '',
        },
        finish_reason: data.choices?.[0]?.finish_reason || 'stop',
      }],
      usage: data.usage,
    },
  };
}

/**
 * Call Google Gemini API
 */
async function callGemini(params: {
  messages: UnifiedMessage[];
  model?: string;
  temperature: number;
  top_p: number;
  maxTokens: number;
}): Promise<ProviderResponse> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'GEMINI_API_KEY not configured' };
  }

  const model = params.model || 'gemini-2.0-flash-exp';

  // Convert messages to Gemini format
  const contents = params.messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  // Add system instruction if present
  const systemMsg = params.messages.find(msg => msg.role === 'system');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
        generationConfig: {
          temperature: params.temperature,
          topP: params.top_p,
          maxOutputTokens: params.maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `Gemini API error: ${response.status} - ${errorText}`,
    };
  }

  const data = await response.json();

  // Convert to unified format
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    success: true,
    provider: 'gemini',
    data: {
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: text,
        },
        finish_reason: data.candidates?.[0]?.finishReason?.toLowerCase() || 'stop',
      }],
      usage: {
        prompt_tokens: data.usageMetadata?.promptTokenCount,
        completion_tokens: data.usageMetadata?.candidatesTokenCount,
        total_tokens: data.usageMetadata?.totalTokenCount,
      },
    },
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(params: {
  messages: UnifiedMessage[];
  model?: string;
  temperature: number;
  top_p: number;
  maxTokens: number;
}): Promise<ProviderResponse> {
  if (!OPENAI_API_KEY) {
    return { success: false, error: 'OPENAI_API_KEY not configured' };
  }

  const model = params.model || 'gpt-4o';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature: params.temperature,
      top_p: params.top_p,
      max_tokens: params.maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `OpenAI API error: ${response.status} - ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    provider: 'openai',
    data,
  };
}
