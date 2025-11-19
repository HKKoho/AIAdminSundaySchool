import { Router } from 'express';
import { getSessionStatus, sendMessage, sendBulkMessages } from '../services/whatsapp';
import { generateText } from '../services/ai';
import { collections } from '../services/mongodb';
import { logger } from '../utils/logger';

const router = Router();

// Get WhatsApp connection status
router.get('/status', (req, res) => {
  const status = getSessionStatus('secretary');
  res.json({
    connectionState: status.state,
    qrCode: status.qrCode,
    phoneNumber: status.phoneNumber
  });
});

// Generate report
router.post('/report', async (req, res) => {
  try {
    const { events, tasks, language = 'en' } = req.body;

    const systemPrompt = language === 'zh-TW'
      ? `你是一位教會秘書助理。請根據提供的活動和任務生成一份簡潔的月度報告。使用繁體中文。`
      : `You are a church secretary assistant. Generate a concise monthly report based on the events and tasks provided.`;

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
    const { events, language = 'en' } = req.body;

    const systemPrompt = language === 'zh-TW'
      ? `你是一位教會秘書助理。請根據提供的活動生成今日和明日的日程表。使用繁體中文。格式簡潔清晰。`
      : `You are a church secretary assistant. Generate a concise daily schedule for today and tomorrow based on the events provided.`;

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
    const { prompt, language = 'en' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt'
      });
    }

    const systemPrompt = language === 'zh-TW'
      ? `你是一位教會牧養關懷助理。以溫暖、關懷的態度回應關於會友照顧、探訪和牧養的問題。使用繁體中文。`
      : `You are a pastoral care assistant. Respond with warmth and care to questions about member care, visitation, and pastoral support.`;

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

// Send WhatsApp message
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing recipient or message'
      });
    }

    const success = await sendMessage('secretary', to, message);

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

// Send bulk messages (notifications)
router.post('/notify', async (req, res) => {
  try {
    const { recipients, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing recipients array or message'
      });
    }

    const result = await sendBulkMessages('secretary', recipients, message);

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

export default router;
