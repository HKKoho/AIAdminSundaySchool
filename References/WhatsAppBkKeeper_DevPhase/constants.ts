import type { Document } from './types';

export const MOCK_QR_CODE = '2@fakedataforqrcode-thisisnotreal-dontscsan-aBcDeFgHiJkLmNoPqRsTuVwXyZ==';

export const DOCUMENT_TYPES = [
  'Receipt', 
  'Invoice', 
  'Bank Transfer', 
  'Payment Note', 
  'Utility Bill', 
  'Bank Statement', 
  'Other'
];

// Generate more realistic and varied dates for documents
const now = Date.now();
const minutes = (m: number) => m * 60 * 1000;
const hours = (h: number) => h * 60 * minutes(1);
const days = (d: number) => d * 24 * hours(1);

export const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'doc_1',
    filename: 'starbucks_coffee.jpg',
    url: 'https://picsum.photos/seed/doc_1/400/600',
    thumbnailUrl: 'https://picsum.photos/seed/doc_1/80/80',
    mimetype: 'image/jpeg',
    size: 145000,
    uploadedAt: new Date(now - minutes(5)).toISOString(),
    status: 'classified',
    documentType: 'Receipt',
    classificationConfidence: 99.2,
    classifiedAt: new Date(now - minutes(4)).toISOString(),
    reviewStatus: 'not_yet',
    extractedEntities: {
      vendor: 'Starbucks',
      totalAmount: 7.85,
      date: '2024-05-20',
      keywords: ['coffee', 'latte']
    },
  },
  {
    id: 'doc_2',
    filename: 'invoice_web_dev_project.pdf',
    url: 'https://picsum.photos/seed/doc_2/400/600',
    thumbnailUrl: 'https://picsum.photos/seed/doc_2/80/80',
    mimetype: 'application/pdf',
    size: 312000,
    uploadedAt: new Date(now - hours(2)).toISOString(),
    status: 'classified',
    documentType: 'Invoice',
    classificationConfidence: 96.8,
    classifiedAt: new Date(now - hours(2) + minutes(1)).toISOString(),
    reviewStatus: 'confirmed',
    reviewedAt: new Date(now - hours(1)).toISOString(),
    reviewedBy: 'human',
    extractedEntities: {
      vendor: 'Creative Solutions LLC',
      documentTitle: 'Web Development Services',
      totalAmount: 1500.00,
      date: '2024-05-18',
      invoiceNumber: 'CS-2024-0015',
    },
  },
  {
    id: 'doc_3',
    filename: 'electric_bill_jan.pdf',
    url: 'https://picsum.photos/seed/doc_3/400/600',
    thumbnailUrl: 'https://picsum.photos/seed/doc_3/80/80',
    mimetype: 'application/pdf',
    size: 189000,
    uploadedAt: new Date(now - days(1)).toISOString(),
    status: 'classified',
    documentType: 'Utility Bill',
    classificationConfidence: 97.5,
    classifiedAt: new Date(now - days(1) + minutes(2)).toISOString(),
    reviewStatus: 'not_yet',
    extractedEntities: {
        vendor: 'City Power & Light',
        totalAmount: 85.50,
        date: '2024-01-28',
    },
  },
  {
    id: 'doc_4',
    filename: 'transfer_to_landlord.png',
    url: 'https://picsum.photos/seed/doc_4/400/600',
    thumbnailUrl: 'https://picsum.photos/seed/doc_4/80/80',
    mimetype: 'image/png',
    size: 450000,
    uploadedAt: new Date(now - days(3)).toISOString(),
    status: 'classified',
    documentType: 'Bank Transfer',
    classificationConfidence: 91.0,
    classifiedAt: new Date(now - days(3) + minutes(1)).toISOString(),
    reviewStatus: 'reclassified_by_human',
    reviewedAt: new Date(now - days(2)).toISOString(),
    reviewedBy: 'human',
    extractedEntities: {
        documentTitle: 'Transfer Confirmation',
        totalAmount: 2200.00,
        date: '2024-05-01',
        keywords: ['Rent Payment', 'Transfer Successful']
    }
  },
  {
    id: 'doc_5',
    filename: 'payment_confirmation_cli.png',
    url: 'https://picsum.photos/seed/doc_5/400/600',
    thumbnailUrl: 'https://picsum.photos/seed/doc_5/80/80',
    mimetype: 'image/png',
    size: 210000,
    uploadedAt: new Date(now - days(5)).toISOString(),
    status: 'classified',
    documentType: 'Payment Note',
    classificationConfidence: 94.3,
    classifiedAt: new Date(now - days(5) + minutes(1)).toISOString(),
    reviewStatus: 'not_yet',
    extractedEntities: {
        documentTitle: 'Payment Received',
        totalAmount: 500.00,
        date: '2024-04-15',
    }
  },
  {
    id: 'doc_6',
    filename: 'grocery_run.jpeg',
    url: 'https://picsum.photos/seed/doc_6/400/600',
    thumbnailUrl: 'https://picsum.photos/seed/doc_6/80/80',
    mimetype: 'image/jpeg',
    size: 198000,
    uploadedAt: new Date(now - days(7)).toISOString(),
    status: 'classified',
    documentType: 'Receipt',
    classificationConfidence: 100.0, // Manually set
    classifiedAt: new Date(now - days(7) + minutes(3)).toISOString(),
    isManuallyClassified: true,
    reviewStatus: 'reclassified_by_human',
    reviewedAt: new Date(now - days(6)).toISOString(),
    reviewedBy: 'human',
    extractedEntities: {
        vendor: 'Fresh Market',
        totalAmount: 123.45,
        date: '2024-04-12',
    }
  },
  {
    id: 'doc_7',
    filename: 'IMG_6001.png',
    url: 'https://picsum.photos/seed/doc_7/400/600',
    thumbnailUrl: 'https://picsum.photos/seed/doc_7/80/80',
    mimetype: 'image/png',
    size: 512000,
    uploadedAt: new Date(now - minutes(1)).toISOString(),
    status: 'pending_classification',
    reviewStatus: 'not_yet',
  },
];
