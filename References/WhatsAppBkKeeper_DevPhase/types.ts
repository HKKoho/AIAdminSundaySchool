export type ConnectionState = 'connected' | 'disconnected' | 'connecting';

export type DocumentStatus = 'pending_classification' | 'classifying' | 'classified' | 'classification_failed' | 'rejected';

export type ReviewStatus = 'not_yet' | 'confirmed' | 'reclassified_by_human' | 'reclassified_by_machine';

export interface ExtractedEntities {
  documentTitle?: string;
  vendor?: string;
  totalAmount?: number;
  date?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  keywords?: string[];
}

export interface Document {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  mimetype: string;
  size: number;
  uploadedAt: string;
  status: DocumentStatus;
  documentType?: string;
  classificationConfidence?: number;
  classifiedAt?: string;
  errorMessage?: string;
  rejectionReason?: string;
  extractedEntities?: ExtractedEntities;
  isManuallyClassified?: boolean;
  reviewStatus: ReviewStatus;
  reviewedAt?: string;
  reviewedBy?: 'human' | 'machine';
}

export interface QueueStatus {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  rejected: number;
}

export interface Instruction {
  id: string;
  userInput: string;
  comprehendedCommand: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  error?: string;
}
