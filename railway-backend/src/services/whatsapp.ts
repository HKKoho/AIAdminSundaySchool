import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { logger } from '../utils/logger';
import { collections } from './mongodb';
import { generateText } from './ai';

type SessionType = 'secretary' | 'bookkeeper';
type ConnectionState = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

interface WhatsAppSession {
  client: Client;
  state: ConnectionState;
  qrCode: string;
  phoneNumber?: string;
}

// Store WhatsApp sessions
const sessions: Map<SessionType, WhatsAppSession> = new Map();

// Event handlers storage
const messageHandlers: Map<SessionType, (message: Message) => Promise<void>> = new Map();

export async function initializeWhatsApp(): Promise<void> {
  // Initialize Secretary session
  await initializeSession('secretary');

  // Initialize Bookkeeper session
  await initializeSession('bookkeeper');

  logger.info('WhatsApp sessions initialized');
}

async function initializeSession(sessionType: SessionType): Promise<void> {
  const sessionName = sessionType === 'secretary'
    ? process.env.WHATSAPP_SECRETARY_SESSION || 'secretary-session'
    : process.env.WHATSAPP_BOOKKEEPER_SESSION || 'bookkeeper-session';

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: sessionName,
      dataPath: './whatsapp-sessions'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  const session: WhatsAppSession = {
    client,
    state: 'connecting',
    qrCode: ''
  };

  sessions.set(sessionType, session);

  // QR Code event
  client.on('qr', async (qr) => {
    logger.info(`QR Code received for ${sessionType}`);
    session.state = 'qr_ready';

    // Generate QR code as data URL
    try {
      session.qrCode = await qrcode.toDataURL(qr);
    } catch (error) {
      logger.error(`Failed to generate QR code for ${sessionType}:`, error);
    }
  });

  // Ready event
  client.on('ready', async () => {
    logger.info(`WhatsApp ${sessionType} client is ready`);
    session.state = 'connected';
    session.qrCode = '';

    const info = client.info;
    session.phoneNumber = info?.wid?.user;

    // Store session info in MongoDB
    try {
      await collections.whatsappSessions().updateOne(
        { sessionType },
        {
          $set: {
            sessionType,
            phoneNumber: session.phoneNumber,
            connectedAt: new Date(),
            status: 'connected'
          }
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error(`Failed to save ${sessionType} session info:`, error);
    }
  });

  // Disconnected event
  client.on('disconnected', (reason) => {
    logger.warn(`WhatsApp ${sessionType} disconnected: ${reason}`);
    session.state = 'disconnected';
  });

  // Authentication failure
  client.on('auth_failure', (message) => {
    logger.error(`WhatsApp ${sessionType} auth failure: ${message}`);
    session.state = 'disconnected';
  });

  // Message event
  client.on('message', async (message) => {
    logger.info(`New message for ${sessionType} from ${message.from}`);

    // Get custom handler if registered
    const handler = messageHandlers.get(sessionType);
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        logger.error(`Error handling message for ${sessionType}:`, error);
      }
    }
  });

  // Initialize client
  try {
    await client.initialize();
  } catch (error) {
    logger.error(`Failed to initialize ${sessionType} client:`, error);
    session.state = 'disconnected';
  }
}

// Get session status
export function getSessionStatus(sessionType: SessionType): {
  state: ConnectionState;
  qrCode: string;
  phoneNumber?: string;
} {
  const session = sessions.get(sessionType);
  if (!session) {
    return {
      state: 'disconnected',
      qrCode: ''
    };
  }

  return {
    state: session.state,
    qrCode: session.qrCode,
    phoneNumber: session.phoneNumber
  };
}

// Send message
export async function sendMessage(
  sessionType: SessionType,
  to: string,
  message: string
): Promise<boolean> {
  const session = sessions.get(sessionType);
  if (!session || session.state !== 'connected') {
    logger.warn(`Cannot send message: ${sessionType} not connected`);
    return false;
  }

  try {
    // Format phone number
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
    await session.client.sendMessage(chatId, message);
    logger.info(`Message sent via ${sessionType} to ${to}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send message via ${sessionType}:`, error);
    return false;
  }
}

// Send message to multiple recipients
export async function sendBulkMessages(
  sessionType: SessionType,
  recipients: string[],
  message: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const success = await sendMessage(sessionType, recipient, message);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Add delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return { sent, failed };
}

// Register custom message handler
export function registerMessageHandler(
  sessionType: SessionType,
  handler: (message: Message) => Promise<void>
): void {
  messageHandlers.set(sessionType, handler);
  logger.info(`Message handler registered for ${sessionType}`);
}

// Default Secretary message handler
export async function handleSecretaryMessage(message: Message): Promise<void> {
  const chat = await message.getChat();
  const contact = await message.getContact();

  // Log incoming message
  logger.info(`Secretary message from ${contact.pushname || contact.number}: ${message.body}`);

  // Store message in MongoDB
  try {
    await collections.whatsappSessions().updateOne(
      { sessionType: 'secretary' },
      {
        $push: {
          messages: {
            from: message.from,
            body: message.body,
            timestamp: new Date(),
            type: message.type
          } as any
        }
      }
    );
  } catch (error) {
    logger.error('Failed to store secretary message:', error);
  }

  // Process with AI if it's a question
  if (message.body.endsWith('?') || message.body.toLowerCase().startsWith('what') ||
      message.body.toLowerCase().startsWith('when') || message.body.toLowerCase().startsWith('who')) {
    try {
      const response = await generateText(
        message.body,
        `You are a helpful church secretary assistant. Answer questions about church events, members, and activities. Keep responses concise and friendly. If you don't know something, say so politely.`
      );

      await chat.sendMessage(response);
      logger.info(`Secretary AI response sent to ${message.from}`);
    } catch (error) {
      logger.error('Failed to generate secretary AI response:', error);
    }
  }
}

// Default Bookkeeper message handler
export async function handleBookkeeperMessage(message: Message): Promise<void> {
  const chat = await message.getChat();

  // Check if message has media (receipt/invoice)
  if (message.hasMedia) {
    try {
      const media = await message.downloadMedia();

      // Store document info
      await collections.documents().insertOne({
        filename: `${Date.now()}_${message.from}`,
        mimetype: media.mimetype,
        data: media.data,
        uploadedAt: new Date(),
        status: 'pending',
        source: 'whatsapp',
        from: message.from
      });

      await chat.sendMessage('Document received! I will classify it shortly.');
      logger.info(`Bookkeeper received document from ${message.from}`);
    } catch (error) {
      logger.error('Failed to process bookkeeper document:', error);
      await chat.sendMessage('Sorry, I could not process that document. Please try again.');
    }
  } else {
    // Text message - might be a question about finances
    logger.info(`Bookkeeper text message from ${message.from}: ${message.body}`);
  }
}

// Get client for advanced operations
export function getClient(sessionType: SessionType): Client | null {
  const session = sessions.get(sessionType);
  return session?.client || null;
}

// Graceful shutdown
export async function shutdownWhatsApp(): Promise<void> {
  for (const [sessionType, session] of sessions) {
    try {
      await session.client.destroy();
      logger.info(`WhatsApp ${sessionType} client destroyed`);
    } catch (error) {
      logger.error(`Failed to destroy ${sessionType} client:`, error);
    }
  }
  sessions.clear();
}
