import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import qrCodeTerminal from 'qrcode-terminal';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Store QR code, pairing code and connection state
let currentQRCode = null;
let currentPairingCode = null;
let connectionState = 'disconnected'; // disconnected, connecting, qr_ready, pairing_code_ready, connected
let whatsappClient = null;
let receivedDocuments = [];
let userPhoneNumber = null;

// Initialize WhatsApp client with QR code authentication
const initializeWhatsApp = async () => {
  whatsappClient = new Client({
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
      console.log('QR Code generated successfully for frontend display');

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
    currentPairingCode = null;
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

  // Add more debugging events
  whatsappClient.on('loading_screen', (percent, message) => {
    console.log(`Loading... ${percent}% - ${message}`);
  });

  whatsappClient.on('change_state', state => {
    console.log('WhatsApp state changed:', state);
  });

  // Message event - Handle incoming messages with media (images, PDFs, etc.)
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
            status: 'pending_classification',
            from: {
              number: message.from,
              name: contact.pushname || contact.name || 'Unknown',
              isGroup: chat.isGroup,
              chatName: chat.name
            },
            caption: message.body || ''
          };

          receivedDocuments.push(document);
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

// Get connection status, QR code, and pairing code
app.get('/api/status', (req, res) => {
  res.json({
    connectionState,
    qrCode: currentQRCode,
    pairingCode: currentPairingCode,
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

    // Check if Gemini API key is configured
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      return res.status(500).json({
        error: 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.'
      });
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prepare the image data for Gemini
    const imagePart = {
      inlineData: {
        data: document.data,
        mimeType: document.mimetype
      }
    };

    // Create a comprehensive prompt for document classification
    const prompt = `You are an AI assistant specializing in bookkeeping and financial document classification.

Analyze this image and determine:

1. IS THIS A BOOKKEEPING/FINANCIAL DOCUMENT?
   - Valid types: Invoice, Receipt, Bank Transfer, Payment Note, Utility Bill, Bank Statement, Purchase Order, Expense Report, Tax Document
   - Invalid types: Personal photos, screenshots, memes, artwork, nature photos, selfies, random images, etc.

2. If it IS a bookkeeping document, extract:
   - Document type (Invoice/Receipt/Bank Transfer/Payment Note/Utility Bill/Bank Statement/Other)
   - Document title or description
   - Vendor/Company name
   - Total amount (numeric value only)
   - Date (ISO format: YYYY-MM-DD)
   - Invoice/Receipt number
   - Payment method (if visible)
   - Keywords (important terms from the document)

3. If it IS NOT a bookkeeping document:
   - Explain why it was rejected (e.g., "This is a personal photo", "This is a meme", "This is a screenshot of a chat")

RESPOND ONLY IN VALID JSON FORMAT (no markdown, no code blocks):

For VALID bookkeeping documents:
{
  "isBookkeepingDocument": true,
  "documentType": "Invoice|Receipt|Bank Transfer|Payment Note|Utility Bill|Bank Statement|Other",
  "confidence": 0-100,
  "extractedData": {
    "documentTitle": "string",
    "vendor": "string",
    "totalAmount": number,
    "date": "YYYY-MM-DD",
    "invoiceNumber": "string",
    "paymentMethod": "string",
    "keywords": ["string"]
  }
}

For INVALID/NON-BOOKKEEPING images:
{
  "isBookkeepingDocument": false,
  "rejectionReason": "Detailed explanation of why this is not a bookkeeping document",
  "imageType": "Brief description of what the image actually contains"
}`;

    // Call Gemini AI
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let classification;
    try {
      classification = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return res.status(500).json({
        error: 'Failed to parse AI response',
        rawResponse: text
      });
    }

    // Return the classification result
    res.json({
      success: true,
      classification
    });

  } catch (error) {
    console.error('Error classifying document:', error);
    res.status(500).json({
      error: 'Failed to classify document',
      message: error.message
    });
  }
});

// Process instruction with OpenAI GPT-4o
app.post('/api/process-instruction', async (req, res) => {
  try {
    const { instruction } = req.body;

    if (!instruction || !instruction.trim()) {
      return res.status(400).json({ error: 'Instruction is required' });
    }

    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
      return res.status(500).json({
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    // Call OpenAI GPT-4o to comprehend the instruction
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that comprehends bookkeeping instructions and transforms them into structured commands for an automated bookkeeping system.

Your task is to:
1. Understand the user's natural language instruction
2. Extract key information (categories, vendors, amounts, date ranges, actions, etc.)
3. Transform it into a clear, actionable command that can be executed by a bookkeeping AI agent

Format your response as a structured command that includes:
- Action: What needs to be done (categorize, reconcile, report, search, etc.)
- Target: What documents/transactions to act on
- Parameters: Specific criteria (vendor names, amounts, dates, categories)
- Constraints: Any conditions or filters

Be precise and specific. If the instruction is ambiguous, make reasonable assumptions based on bookkeeping best practices.

Example:
User: "Categorize all invoices from ACME Corp as office expenses"
Command: "ACTION: Categorize | TARGET: Invoices | FILTER: vendor='ACME Corp' | CATEGORY: Office Expenses | APPLY: All matching documents"

User: "Show me all receipts over $500 from last month"
Command: "ACTION: Search and Display | TARGET: Receipts | FILTER: amount>500, date_range='last_month' | SORT: amount DESC"`
        },
        {
          role: 'user',
          content: instruction
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, deterministic outputs
      max_tokens: 500
    });

    const comprehendedCommand = completion.choices[0].message.content;

    res.json({
      success: true,
      comprehendedCommand
    });

  } catch (error) {
    console.error('Error processing instruction:', error);
    res.status(500).json({
      error: 'Failed to process instruction',
      message: error.message
    });
  }
});

// Logout and disconnect
app.post('/api/logout', async (req, res) => {
  if (whatsappClient) {
    try {
      await whatsappClient.logout();
      await whatsappClient.destroy();
      whatsappClient = null;
      connectionState = 'disconnected';
      currentQRCode = null;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.json({ success: true });
  }
});

// Reconnect
app.post('/api/reconnect', (req, res) => {
  if (whatsappClient) {
    whatsappClient.destroy();
  }
  initializeWhatsApp();
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 WhatsApp Bookkeeper AI Backend`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/status       - Connection status and QR code`);
  console.log(`  GET  /api/documents    - Received documents`);
  console.log(`  POST /api/logout       - Logout from WhatsApp`);
  console.log(`  POST /api/reconnect    - Reconnect to WhatsApp\n`);
  console.log(`Initializing WhatsApp client...\n`);

  // Initialize WhatsApp client automatically
  initializeWhatsApp();
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});
