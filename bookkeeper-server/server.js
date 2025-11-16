import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import qrCodeTerminal from 'qrcode-terminal';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Store QR code and connection state
let currentQRCode = null;
let connectionState = 'disconnected'; // disconnected, connecting, qr_ready, connected
let whatsappClient = null;
let receivedDocuments = [];

// Initialize WhatsApp client with QR code authentication
const initializeWhatsApp = async () => {
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: './whatsapp-session'
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

  // QR Code event
  whatsappClient.on('qr', async (qr) => {
    console.log('QR Code received');
    connectionState = 'qr_ready';

    // Generate QR code as data URL for frontend
    try {
      currentQRCode = await QRCode.toDataURL(qr);
      console.log('QR Code generated successfully');

      // Also display in terminal for convenience
      qrCodeTerminal.generate(qr, { small: true });
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  });

  // Authentication events
  whatsappClient.on('authenticated', () => {
    console.log('WhatsApp authenticated successfully!');
    connectionState = 'connecting';
    currentQRCode = null;
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
    connectionState = 'disconnected';
    currentQRCode = null;
  });

  // Ready event
  whatsappClient.on('ready', () => {
    console.log('WhatsApp client is ready!');
    connectionState = 'connected';
    currentQRCode = null;
  });

  // Disconnected event
  whatsappClient.on('disconnected', (reason) => {
    console.log('WhatsApp client disconnected:', reason);
    connectionState = 'disconnected';
    currentQRCode = null;
  });

  // Loading screen
  whatsappClient.on('loading_screen', (percent, message) => {
    console.log(`Loading... ${percent}% - ${message}`);
  });

  // Message event - Handle incoming messages with media
  whatsappClient.on('message', async (message) => {
    console.log('Message received from:', message.from);

    // Check if message has media
    if (message.hasMedia) {
      try {
        console.log('Downloading media...');
        const media = await message.downloadMedia();

        if (!media) {
          console.log('Failed to download media');
          return;
        }

        // Check if it's an image or PDF
        const isImage = media.mimetype.startsWith('image/');
        const isPDF = media.mimetype === 'application/pdf';

        if (isImage || isPDF) {
          // Get contact info
          const contact = await message.getContact();
          const chat = await message.getChat();

          const document = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            filename: media.filename || `document_${Date.now()}.${media.mimetype.split('/')[1]}`,
            data: media.data, // base64 encoded data
            mimetype: media.mimetype,
            size: media.data.length,
            uploadedAt: new Date().toISOString(),
            status: 'pending',
            from: {
              number: message.from,
              name: contact.pushname || contact.name || 'Unknown',
              isGroup: chat.isGroup,
              chatName: chat.name
            },
            caption: message.body || ''
          };

          receivedDocuments.unshift(document);
          console.log(`Document received: ${document.filename} from ${document.from.name}`);

          // Send confirmation message
          await message.reply('✅ Document received! Processing for bookkeeping...');
        }
      } catch (err) {
        console.error('Error processing media:', err);
        await message.reply('❌ Sorry, there was an error processing your document.');
      }
    }
  });

  // Initialize the client
  console.log('Initializing WhatsApp client...');
  connectionState = 'connecting';
  whatsappClient.initialize();
};

// API Endpoints

// Get connection status and QR code
app.get('/api/status', (req, res) => {
  res.json({
    connectionState,
    qrCode: currentQRCode,
    hasClient: !!whatsappClient
  });
});

// Get received documents
app.get('/api/documents', (req, res) => {
  res.json({
    documents: receivedDocuments
  });
});

// Clear a document from the list
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  receivedDocuments = receivedDocuments.filter(doc => doc.id !== id);
  res.json({ success: true });
});

// Classify a document using Gemini AI
app.post('/api/classify/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the document
    const document = receivedDocuments.find(doc => doc.id === id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!genAI) {
      return res.status(500).json({ error: 'Gemini AI not configured' });
    }

    // Update status to classifying
    document.status = 'classifying';

    // Use Gemini Vision to classify the document
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this financial document and extract the following information:
    1. Document Type (Receipt, Invoice, Bank Statement, etc.)
    2. Vendor/Company Name
    3. Total Amount
    4. Date
    5. Invoice/Receipt Number
    6. Payment Method
    7. Category (Office Supplies, Utilities, Salary, Donation, etc.)

    Return the result in JSON format with keys: documentType, vendor, amount, date, invoiceNumber, paymentMethod, category, confidence (0-100)`;

    const imagePart = {
      inlineData: {
        data: document.data,
        mimeType: document.mimetype
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from response
    let classification;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      classification = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
    } catch (e) {
      // If parsing fails, create a basic classification
      classification = {
        documentType: 'Unknown',
        confidence: 50,
        rawResponse: text
      };
    }

    // Update document with classification
    document.status = 'classified';
    document.type = classification.documentType || 'Unknown';
    document.vendor = classification.vendor;
    document.amount = parseFloat(classification.amount) || undefined;
    document.classificationConfidence = classification.confidence;
    document.classifiedAt = new Date().toISOString();
    document.extractedData = classification;

    res.json({
      success: true,
      classification
    });

  } catch (error) {
    console.error('Classification error:', error);

    // Update document status to failed
    const document = receivedDocuments.find(doc => doc.id === req.params.id);
    if (document) {
      document.status = 'rejected';
      document.errorMessage = error.message;
    }

    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', whatsappConnected: connectionState === 'connected' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 WhatsApp Bookkeeper Server running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   - GET  /api/status       - Connection status & QR code`);
  console.log(`   - GET  /api/documents    - Get received documents`);
  console.log(`   - POST /api/classify/:id - Classify a document`);
  console.log(`   - GET  /health           - Health check`);
  console.log(`\n🔄 Initializing WhatsApp connection...\n`);

  // Initialize WhatsApp
  initializeWhatsApp();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});
