import { Router } from 'express';
import { callAI, generateText } from '../services/ai';
import { logger } from '../utils/logger';

const router = Router();

// Unified AI chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const {
      messages,
      temperature,
      maxTokens,
      preferredProvider
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid messages array'
      });
    }

    const result = await callAI({
      messages,
      temperature,
      maxTokens,
      preferredProvider
    });

    if (result.success) {
      res.json({
        success: true,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: result.content
          },
          finish_reason: 'stop'
        }],
        provider: result.provider,
        usage: result.usage
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple text generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { prompt, systemPrompt, temperature, maxTokens } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt'
      });
    }

    const result = await generateText(prompt, systemPrompt, {
      temperature,
      maxTokens
    });

    res.json({
      success: true,
      content: result
    });
  } catch (error: any) {
    logger.error('AI generate error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
