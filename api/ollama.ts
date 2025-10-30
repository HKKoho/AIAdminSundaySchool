import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Ollama API Proxy
 * Direct proxy to Ollama API without fallback logic
 */

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'https://api.ollama.cloud';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

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

  if (!OLLAMA_API_KEY) {
    return res.status(500).json({ error: 'OLLAMA_API_KEY not configured' });
  }

  try {
    const { model, messages, temperature, top_p, stream } = req.body;

    if (!model || !messages) {
      return res.status(400).json({ error: 'Missing required fields: model, messages' });
    }

    // Call Ollama API
    const response = await fetch(`${OLLAMA_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature || 0.7,
        top_p: top_p || 1.0,
        stream: stream || false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', errorText);
      return res.status(response.status).json({
        error: `Ollama API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Ollama proxy error:', error);
    return res.status(500).json({
      error: 'Failed to communicate with Ollama API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
