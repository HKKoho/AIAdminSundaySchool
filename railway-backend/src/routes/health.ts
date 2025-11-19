import { Router } from 'express';
import { getDatabase } from '../services/mongodb';
import { getSessionStatus } from '../services/whatsapp';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Check MongoDB
    const db = getDatabase();
    await db.command({ ping: 1 });

    // Check WhatsApp sessions
    const secretaryStatus = getSessionStatus('secretary');
    const bookkeeperStatus = getSessionStatus('bookkeeper');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'connected',
        whatsapp: {
          secretary: secretaryStatus.state,
          bookkeeper: bookkeeperStatus.state
        }
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        GEMINI_KEY_SET: !!process.env.GEMINI_API_KEY,
        OPENAI_KEY_SET: !!process.env.OPENAI_API_KEY,
        OLLAMA_KEY_SET: !!process.env.OLLAMA_API_KEY
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
