import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { logger } from '../utils/logger';
import { collections } from './mongodb';
import { generateText } from './ai';

type ConnectionState = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

interface WhatsAppSession {
  client: Client;
  state: ConnectionState;
  qrCode: string;
  phoneNumber?: string;
  pastoralId?: string;
  pastoralName?: string;
}

interface PastoralMember {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  createdAt: Date;
  lastActive?: Date;
}

// Store WhatsApp sessions - now supports multiple pastoral sessions
const sessions: Map<string, WhatsAppSession> = new Map();

// Bookkeeper session ID (singleton)
const BOOKKEEPER_SESSION_ID = 'bookkeeper';

// Event handlers storage
const messageHandlers: Map<string, (message: Message, sessionId: string) => Promise<void>> = new Map();

export async function initializeWhatsApp(): Promise<void> {
  // Initialize Bookkeeper session (always one)
  await initializeSession(BOOKKEEPER_SESSION_ID, 'bookkeeper');

  // Load existing pastoral sessions from MongoDB
  try {
    const pastoralSessions = await collections.whatsappSessions()
      .find({ sessionType: 'secretary', status: 'active' })
      .toArray();

    for (const session of pastoralSessions) {
      if (session.pastoralId) {
        logger.info(`Restoring pastoral session: ${session.pastoralId}`);
        await initializeSession(session.pastoralId, 'secretary', session.pastoralName);
      }
    }
  } catch (error) {
    logger.error('Failed to load existing pastoral sessions:', error);
  }

  logger.info('WhatsApp sessions initialized');
}

async function initializeSession(
  sessionId: string,
  sessionType: 'secretary' | 'bookkeeper',
  pastoralName?: string
): Promise<void> {
  // Check if session already exists
  if (sessions.has(sessionId)) {
    logger.warn(`Session ${sessionId} already exists`);
    return;
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: sessionId,
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
    qrCode: '',
    pastoralId: sessionType === 'secretary' ? sessionId : undefined,
    pastoralName
  };

  sessions.set(sessionId, session);

  // QR Code event
  client.on('qr', async (qr) => {
    logger.info(`QR Code received for ${sessionId}`);
    session.state = 'qr_ready';

    try {
      session.qrCode = await qrcode.toDataURL(qr);
    } catch (error) {
      logger.error(`Failed to generate QR code for ${sessionId}:`, error);
    }
  });

  // Ready event
  client.on('ready', async () => {
    logger.info(`WhatsApp ${sessionId} client is ready`);
    session.state = 'connected';
    session.qrCode = '';

    const info = client.info;
    session.phoneNumber = info?.wid?.user;

    // Store session info in MongoDB
    try {
      await collections.whatsappSessions().updateOne(
        { sessionId },
        {
          $set: {
            sessionId,
            sessionType,
            pastoralId: session.pastoralId,
            pastoralName: session.pastoralName,
            phoneNumber: session.phoneNumber,
            connectedAt: new Date(),
            status: 'active'
          }
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error(`Failed to save ${sessionId} session info:`, error);
    }
  });

  // Disconnected event
  client.on('disconnected', async (reason) => {
    logger.warn(`WhatsApp ${sessionId} disconnected: ${reason}`);
    session.state = 'disconnected';

    // Update status in MongoDB
    try {
      await collections.whatsappSessions().updateOne(
        { sessionId },
        { $set: { status: 'disconnected', disconnectedAt: new Date() } }
      );
    } catch (error) {
      logger.error(`Failed to update ${sessionId} disconnect status:`, error);
    }
  });

  // Authentication failure
  client.on('auth_failure', (message) => {
    logger.error(`WhatsApp ${sessionId} auth failure: ${message}`);
    session.state = 'disconnected';
  });

  // Message event
  client.on('message', async (message) => {
    logger.info(`New message for ${sessionId} from ${message.from}`);

    // Get custom handler if registered
    const handler = messageHandlers.get(sessionType);
    if (handler) {
      try {
        await handler(message, sessionId);
      } catch (error) {
        logger.error(`Error handling message for ${sessionId}:`, error);
      }
    }
  });

  // Initialize client
  try {
    await client.initialize();
  } catch (error) {
    logger.error(`Failed to initialize ${sessionId} client:`, error);
    session.state = 'disconnected';
  }
}

// Register new pastoral member and create their WhatsApp session
export async function registerPastoralSession(
  pastoralId: string,
  pastoralName: string,
  additionalInfo?: Partial<PastoralMember>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if pastoral member already exists
    const existing = sessions.get(pastoralId);
    if (existing) {
      return {
        success: false,
        error: `Pastoral session ${pastoralId} already exists`
      };
    }

    // Store pastoral member info in MongoDB
    await collections.whatsappSessions().updateOne(
      { pastoralId },
      {
        $set: {
          pastoralId,
          pastoralName,
          sessionType: 'secretary',
          ...additionalInfo,
          createdAt: new Date(),
          status: 'pending'
        }
      },
      { upsert: true }
    );

    // Initialize WhatsApp session
    await initializeSession(pastoralId, 'secretary', pastoralName);

    logger.info(`Pastoral session registered: ${pastoralId} (${pastoralName})`);

    return { success: true };
  } catch (error: any) {
    logger.error(`Failed to register pastoral session ${pastoralId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Remove pastoral session
export async function removePastoralSession(
  pastoralId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = sessions.get(pastoralId);
    if (!session) {
      return {
        success: false,
        error: `Session ${pastoralId} not found`
      };
    }

    // Destroy WhatsApp client
    await session.client.destroy();
    sessions.delete(pastoralId);

    // Update MongoDB
    await collections.whatsappSessions().updateOne(
      { pastoralId },
      { $set: { status: 'removed', removedAt: new Date() } }
    );

    logger.info(`Pastoral session removed: ${pastoralId}`);

    return { success: true };
  } catch (error: any) {
    logger.error(`Failed to remove pastoral session ${pastoralId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get all pastoral sessions status
export function getAllPastoralSessions(): Array<{
  pastoralId: string;
  pastoralName?: string;
  state: ConnectionState;
  phoneNumber?: string;
}> {
  const pastoralSessions: Array<{
    pastoralId: string;
    pastoralName?: string;
    state: ConnectionState;
    phoneNumber?: string;
  }> = [];

  for (const [sessionId, session] of sessions) {
    if (session.pastoralId) {
      pastoralSessions.push({
        pastoralId: session.pastoralId,
        pastoralName: session.pastoralName,
        state: session.state,
        phoneNumber: session.phoneNumber
      });
    }
  }

  return pastoralSessions;
}

// Get session status (works for both bookkeeper and pastoral)
export function getSessionStatus(sessionId: string): {
  state: ConnectionState;
  qrCode: string;
  phoneNumber?: string;
  pastoralName?: string;
} {
  const session = sessions.get(sessionId);
  if (!session) {
    return {
      state: 'disconnected',
      qrCode: ''
    };
  }

  return {
    state: session.state,
    qrCode: session.qrCode,
    phoneNumber: session.phoneNumber,
    pastoralName: session.pastoralName
  };
}

// Get bookkeeper session status (convenience function)
export function getBookkeeperStatus(): {
  state: ConnectionState;
  qrCode: string;
  phoneNumber?: string;
} {
  return getSessionStatus(BOOKKEEPER_SESSION_ID);
}

// Send message from specific session
export async function sendMessage(
  sessionId: string,
  to: string,
  message: string
): Promise<boolean> {
  const session = sessions.get(sessionId);
  if (!session || session.state !== 'connected') {
    logger.warn(`Cannot send message: ${sessionId} not connected`);
    return false;
  }

  try {
    // Format phone number
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
    await session.client.sendMessage(chatId, message);
    logger.info(`Message sent via ${sessionId} to ${to}`);

    // Log message in MongoDB
    try {
      await collections.whatsappSessions().updateOne(
        { sessionId },
        {
          $push: {
            sentMessages: {
              to,
              message: message.substring(0, 100),
              timestamp: new Date()
            } as any
          },
          $set: { lastActive: new Date() }
        }
      );
    } catch (e) {
      // Ignore logging errors
    }

    return true;
  } catch (error) {
    logger.error(`Failed to send message via ${sessionId}:`, error);
    return false;
  }
}

// Send message from pastoral member
export async function sendPastoralMessage(
  pastoralId: string,
  to: string,
  message: string
): Promise<boolean> {
  return sendMessage(pastoralId, to, message);
}

// Send message from bookkeeper
export async function sendBookkeeperMessage(
  to: string,
  message: string
): Promise<boolean> {
  return sendMessage(BOOKKEEPER_SESSION_ID, to, message);
}

// Send message to multiple recipients from specific pastoral member
export async function sendBulkMessages(
  sessionId: string,
  recipients: string[],
  message: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const success = await sendMessage(sessionId, recipient, message);
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
  sessionType: 'secretary' | 'bookkeeper',
  handler: (message: Message, sessionId: string) => Promise<void>
): void {
  messageHandlers.set(sessionType, handler);
  logger.info(`Message handler registered for ${sessionType}`);
}

// Default Secretary message handler (now includes sessionId)
export async function handleSecretaryMessage(message: Message, sessionId: string): Promise<void> {
  const chat = await message.getChat();
  const contact = await message.getContact();
  const session = sessions.get(sessionId);

  logger.info(`Secretary message for ${sessionId} from ${contact.pushname || contact.number}: ${message.body}`);

  // Store message in MongoDB
  try {
    await collections.whatsappSessions().updateOne(
      { sessionId },
      {
        $push: {
          receivedMessages: {
            from: message.from,
            body: message.body,
            timestamp: new Date(),
            type: message.type
          } as any
        },
        $set: { lastActive: new Date() }
      }
    );
  } catch (error) {
    logger.error('Failed to store secretary message:', error);
  }

  // Process with AI if it's a question
  if (message.body.endsWith('?') || message.body.toLowerCase().startsWith('what') ||
      message.body.toLowerCase().startsWith('when') || message.body.toLowerCase().startsWith('who')) {
    try {
      const pastoralContext = session?.pastoralName
        ? `You are the assistant for ${session.pastoralName}.`
        : '';

      const response = await generateText(
        message.body,
        `${pastoralContext} You are a helpful church secretary assistant. Answer questions about church events, members, and activities. Keep responses concise and friendly. If you don't know something, say so politely.`
      );

      await chat.sendMessage(response);
      logger.info(`Secretary AI response sent from ${sessionId} to ${message.from}`);
    } catch (error) {
      logger.error('Failed to generate secretary AI response:', error);
    }
  }
}

// Default Bookkeeper message handler
export async function handleBookkeeperMessage(message: Message, sessionId: string): Promise<void> {
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
    logger.info(`Bookkeeper text message from ${message.from}: ${message.body}`);
  }
}

// Get client for advanced operations
export function getClient(sessionId: string): Client | null {
  const session = sessions.get(sessionId);
  return session?.client || null;
}

// Check if session exists
export function sessionExists(sessionId: string): boolean {
  return sessions.has(sessionId);
}

// Graceful shutdown
export async function shutdownWhatsApp(): Promise<void> {
  for (const [sessionId, session] of sessions) {
    try {
      await session.client.destroy();
      logger.info(`WhatsApp ${sessionId} client destroyed`);
    } catch (error) {
      logger.error(`Failed to destroy ${sessionId} client:`, error);
    }
  }
  sessions.clear();
}

// Export constants
export { BOOKKEEPER_SESSION_ID };
