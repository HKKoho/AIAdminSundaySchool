import { Router } from 'express';
import multer from 'multer';
import { getSessionStatus, sendMessage } from '../services/whatsapp';
import { generateText } from '../services/ai';
import { collections } from '../services/mongodb';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get WhatsApp connection status
router.get('/status', (req, res) => {
  const status = getSessionStatus('bookkeeper');
  res.json({
    connectionState: status.state,
    qrCode: status.qrCode,
    phoneNumber: status.phoneNumber
  });
});

// Get all documents
router.get('/documents', async (req, res) => {
  try {
    const documents = await collections.documents()
      .find({})
      .sort({ uploadedAt: -1 })
      .limit(50)
      .toArray();

    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id?.toString() || doc.id,
        filename: doc.filename,
        type: doc.type,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
        amount: doc.amount,
        vendor: doc.vendor
      }))
    });
  } catch (error: any) {
    logger.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload document for classification
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const docId = uuidv4();

    // Store document
    await collections.documents().insertOne({
      id: docId,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      data: req.file.buffer.toString('base64'),
      uploadedAt: new Date(),
      status: 'pending',
      source: 'upload'
    });

    res.json({
      success: true,
      id: docId,
      filename: req.file.originalname
    });
  } catch (error: any) {
    logger.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Classify document with AI
router.post('/classify/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get document
    const doc = await collections.documents().findOne({
      $or: [{ id }, { _id: id }]
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Update status to classifying
    await collections.documents().updateOne(
      { $or: [{ id }, { _id: id }] },
      { $set: { status: 'classifying' } }
    );

    // Use AI to classify
    const systemPrompt = `You are a financial document classifier for a church. Analyze the document and extract:
1. Document type (invoice, receipt, bank statement, donation record, expense report)
2. Vendor/Payee name
3. Amount (in the original currency)
4. Date
5. Category (utilities, supplies, maintenance, salary, donation, other)

Respond in JSON format:
{
  "type": "string",
  "vendor": "string",
  "amount": number,
  "currency": "string",
  "date": "YYYY-MM-DD",
  "category": "string",
  "confidence": number (0-1)
}`;

    const prompt = `Classify this document: ${doc.filename}. MIME type: ${doc.mimetype}`;

    const result = await generateText(prompt, systemPrompt, {
      temperature: 0.3,
      maxTokens: 500
    });

    // Parse AI response
    let classification;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      logger.error('Failed to parse classification:', parseError);
      classification = {
        type: 'unknown',
        vendor: 'Unknown',
        amount: 0,
        category: 'other',
        confidence: 0
      };
    }

    // Update document with classification
    await collections.documents().updateOne(
      { $or: [{ id }, { _id: id }] },
      {
        $set: {
          status: 'classified',
          type: classification.type,
          vendor: classification.vendor,
          amount: classification.amount,
          currency: classification.currency,
          documentDate: classification.date,
          category: classification.category,
          confidence: classification.confidence,
          classifiedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      classification
    });
  } catch (error: any) {
    logger.error('Classification error:', error);

    // Update status to rejected on error
    await collections.documents().updateOne(
      { $or: [{ id: req.params.id }, { _id: req.params.id }] },
      { $set: { status: 'rejected' } }
    );

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get financial summary
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query: any = { status: 'classified' };

    if (startDate || endDate) {
      query.documentDate = {};
      if (startDate) query.documentDate.$gte = startDate;
      if (endDate) query.documentDate.$lte = endDate;
    }

    const documents = await collections.documents().find(query).toArray();

    // Calculate summary
    const summary = {
      totalDocuments: documents.length,
      totalAmount: 0,
      byCategory: {} as Record<string, number>,
      byVendor: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };

    for (const doc of documents) {
      const amount = doc.amount || 0;
      summary.totalAmount += amount;

      // By category
      const category = doc.category || 'other';
      summary.byCategory[category] = (summary.byCategory[category] || 0) + amount;

      // By vendor
      const vendor = doc.vendor || 'Unknown';
      summary.byVendor[vendor] = (summary.byVendor[vendor] || 0) + amount;

      // By type
      const type = doc.type || 'unknown';
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    }

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    logger.error('Summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate financial report
router.post('/report', async (req, res) => {
  try {
    const { startDate, endDate, language = 'en' } = req.body;

    // Get classified documents
    const query: any = { status: 'classified' };
    if (startDate || endDate) {
      query.documentDate = {};
      if (startDate) query.documentDate.$gte = startDate;
      if (endDate) query.documentDate.$lte = endDate;
    }

    const documents = await collections.documents().find(query).toArray();

    const systemPrompt = language === 'zh-TW'
      ? `你是一位教會財務報表生成器。根據提供的財務文件數據，生成一份清晰、專業的財務摘要報告。使用繁體中文。`
      : `You are a church financial report generator. Generate a clear, professional financial summary report based on the document data provided.`;

    const prompt = `Generate a financial report for these ${documents.length} documents: ${JSON.stringify(documents.map(d => ({
      type: d.type,
      vendor: d.vendor,
      amount: d.amount,
      category: d.category,
      date: d.documentDate
    })))}`;

    const report = await generateText(prompt, systemPrompt, {
      temperature: 0.5,
      maxTokens: 2000
    });

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

// Delete document
router.delete('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await collections.documents().deleteOne({
      $or: [{ id }, { _id: id }]
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true
    });
  } catch (error: any) {
    logger.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
