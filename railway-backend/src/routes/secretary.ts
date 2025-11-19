import { Router } from 'express';
import {
  getSessionStatus,
  sendMessage,
  sendBulkMessages,
  registerPastoralSession,
  removePastoralSession,
  getAllPastoralSessions,
  sessionExists
} from '../services/whatsapp';
import { generateText } from '../services/ai';
import { collections } from '../services/mongodb';
import { logger } from '../utils/logger';

const router = Router();

// ============================================
// Session Management Endpoints
// ============================================

// Register new pastoral member session
router.post('/register', async (req, res) => {
  try {
    const { pastoralId, pastoralName, email, role } = req.body;

    if (!pastoralId || !pastoralName) {
      return res.status(400).json({
        success: false,
        error: 'Missing pastoralId or pastoralName'
      });
    }

    const result = await registerPastoralSession(pastoralId, pastoralName, {
      email,
      role
    });

    if (result.success) {
      res.json({
        success: true,
        message: `Session registered for ${pastoralName}. Please scan QR code.`,
        pastoralId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error('Register session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove pastoral member session
router.delete('/session/:pastoralId', async (req, res) => {
  try {
    const { pastoralId } = req.params;

    const result = await removePastoralSession(pastoralId);

    if (result.success) {
      res.json({
        success: true,
        message: `Session ${pastoralId} removed`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error('Remove session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all pastoral sessions status
router.get('/sessions', (req, res) => {
  const sessions = getAllPastoralSessions();
  res.json({
    success: true,
    sessions,
    count: sessions.length
  });
});

// Get specific pastoral session status (with QR code if pending)
router.get('/status/:pastoralId', (req, res) => {
  const { pastoralId } = req.params;
  const status = getSessionStatus(pastoralId);

  res.json({
    pastoralId,
    connectionState: status.state,
    qrCode: status.qrCode,
    phoneNumber: status.phoneNumber,
    pastoralName: status.pastoralName
  });
});

// Legacy: Get default session status (first pastoral or error)
router.get('/status', (req, res) => {
  const sessions = getAllPastoralSessions();

  if (sessions.length === 0) {
    return res.json({
      connectionState: 'disconnected',
      qrCode: '',
      message: 'No pastoral sessions registered. Use POST /register to create one.'
    });
  }

  // Return first session for backward compatibility
  const firstSession = sessions[0];
  const status = getSessionStatus(firstSession.pastoralId);

  res.json({
    connectionState: status.state,
    qrCode: status.qrCode,
    phoneNumber: status.phoneNumber,
    pastoralId: firstSession.pastoralId,
    pastoralName: status.pastoralName
  });
});

// ============================================
// AI Generation Endpoints
// ============================================

// Generate report (can specify pastoral context)
router.post('/report', async (req, res) => {
  try {
    const { events, tasks, language = 'en', pastoralId } = req.body;

    let pastoralContext = '';
    if (pastoralId) {
      const status = getSessionStatus(pastoralId);
      if (status.pastoralName) {
        pastoralContext = language === 'zh-TW'
          ? `這是 ${status.pastoralName} 的報告。`
          : `This is a report for ${status.pastoralName}.`;
      }
    }

    const systemPrompt = language === 'zh-TW'
      ? `你是一位教會秘書助理。${pastoralContext}請根據提供的活動和任務生成一份簡潔的月度報告。使用繁體中文。`
      : `You are a church secretary assistant. ${pastoralContext}Generate a concise monthly report based on the events and tasks provided.`;

    const prompt = `Generate a monthly report for these events: ${JSON.stringify(events || [])} and tasks: ${JSON.stringify(tasks || [])}`;

    const report = await generateText(prompt, systemPrompt);

    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    logger.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate schedule
router.post('/schedule', async (req, res) => {
  try {
    const { events, language = 'en', pastoralId } = req.body;

    let pastoralContext = '';
    if (pastoralId) {
      const status = getSessionStatus(pastoralId);
      if (status.pastoralName) {
        pastoralContext = language === 'zh-TW'
          ? `這是 ${status.pastoralName} 的日程表。`
          : `This is the schedule for ${status.pastoralName}.`;
      }
    }

    const systemPrompt = language === 'zh-TW'
      ? `你是一位教會秘書助理。${pastoralContext}請根據提供的活動生成今日和明日的日程表。使用繁體中文。格式簡潔清晰。`
      : `You are a church secretary assistant. ${pastoralContext}Generate a concise daily schedule for today and tomorrow based on the events provided.`;

    const prompt = `Generate a daily schedule for these events: ${JSON.stringify(events || [])}`;

    const schedule = await generateText(prompt, systemPrompt, {
      temperature: 0.5,
      maxTokens: 1000
    });

    res.json({
      success: true,
      schedule
    });
  } catch (error: any) {
    logger.error('Schedule generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Pastoral AI assistant
router.post('/pastoral', async (req, res) => {
  try {
    const { prompt, language = 'en', pastoralId } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt'
      });
    }

    let pastoralContext = '';
    if (pastoralId) {
      const status = getSessionStatus(pastoralId);
      if (status.pastoralName) {
        pastoralContext = language === 'zh-TW'
          ? `你是 ${status.pastoralName} 的助理。`
          : `You are the assistant for ${status.pastoralName}.`;
      }
    }

    const systemPrompt = language === 'zh-TW'
      ? `${pastoralContext}你是一位教會牧養關懷助理。以溫暖、關懷的態度回應關於會友照顧、探訪和牧養的問題。使用繁體中文。`
      : `${pastoralContext}You are a pastoral care assistant. Respond with warmth and care to questions about member care, visitation, and pastoral support.`;

    const response = await generateText(prompt, systemPrompt);

    res.json({
      success: true,
      response
    });
  } catch (error: any) {
    logger.error('Pastoral AI error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Event management AI
router.post('/event', async (req, res) => {
  try {
    const { prompt, language = 'en' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt'
      });
    }

    const systemPrompt = language === 'zh-TW'
      ? `你是一位教會活動策劃助理。幫助規劃和管理教會活動、會議和聚會。使用繁體中文。`
      : `You are a church event planning assistant. Help plan and manage church events, meetings, and gatherings.`;

    const response = await generateText(prompt, systemPrompt);

    res.json({
      success: true,
      response
    });
  } catch (error: any) {
    logger.error('Event AI error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// WhatsApp Messaging Endpoints
// ============================================

// Send WhatsApp message from specific pastoral member
router.post('/send', async (req, res) => {
  try {
    const { pastoralId, to, message } = req.body;

    if (!pastoralId || !to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing pastoralId, recipient, or message'
      });
    }

    // Verify session exists
    if (!sessionExists(pastoralId)) {
      return res.status(404).json({
        success: false,
        error: `Pastoral session ${pastoralId} not found`
      });
    }

    const success = await sendMessage(pastoralId, to, message);

    res.json({
      success,
      error: success ? undefined : 'Failed to send message'
    });
  } catch (error: any) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send bulk messages (notifications) from specific pastoral member
router.post('/notify', async (req, res) => {
  try {
    const { pastoralId, recipients, message } = req.body;

    if (!pastoralId || !recipients || !Array.isArray(recipients) || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing pastoralId, recipients array, or message'
      });
    }

    // Verify session exists
    if (!sessionExists(pastoralId)) {
      return res.status(404).json({
        success: false,
        error: `Pastoral session ${pastoralId} not found`
      });
    }

    const result = await sendBulkMessages(pastoralId, recipients, message);

    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed
    });
  } catch (error: any) {
    logger.error('Bulk send error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Data Endpoints
// ============================================

// Get members from MongoDB
router.get('/members', async (req, res) => {
  try {
    const members = await collections.members().find({}).toArray();
    res.json({
      success: true,
      members
    });
  } catch (error: any) {
    logger.error('Get members error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get events from MongoDB
router.get('/events', async (req, res) => {
  try {
    const events = await collections.events().find({}).toArray();
    res.json({
      success: true,
      events
    });
  } catch (error: any) {
    logger.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get message history for pastoral member
router.get('/messages/:pastoralId', async (req, res) => {
  try {
    const { pastoralId } = req.params;

    const session = await collections.whatsappSessions().findOne({ pastoralId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      receivedMessages: session.receivedMessages || [],
      sentMessages: session.sentMessages || []
    });
  } catch (error: any) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
