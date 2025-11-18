import { getDatabase } from '../lib/mongodb';
import { DocumentMetadata } from '../types';

const COLLECTION_NAME = 'documents';

export interface DocumentResponse {
  success: boolean;
  data?: DocumentMetadata | DocumentMetadata[];
  error?: string;
}

// Get all documents with optional filtering
export async function getAllDocuments(filters?: {
  department?: string;
  ministry?: string;
  docType?: string;
  year?: number;
  status?: string;
  searchTerm?: string;
}): Promise<DocumentResponse> {
  try {
    const db = await getDatabase();
    const query: any = {};

    // Build query based on filters
    if (filters) {
      if (filters.department && filters.department !== 'All') {
        query.department = filters.department;
      }
      if (filters.ministry && filters.ministry !== 'All') {
        query.ministry = filters.ministry;
      }
      if (filters.docType && filters.docType !== 'All') {
        query.docType = filters.docType;
      }
      if (filters.year) {
        query.year = filters.year;
      }
      if (filters.status && filters.status !== 'All') {
        query.status = filters.status;
      }
      if (filters.searchTerm) {
        query.$or = [
          { title: { $regex: filters.searchTerm, $options: 'i' } },
          { fileName: { $regex: filters.searchTerm, $options: 'i' } },
        ];
      }
    }

    const documents = await db
      .collection<DocumentMetadata>(COLLECTION_NAME)
      .find(query)
      .sort({ uploadDate: -1 })
      .toArray();

    return { success: true, data: documents };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { success: false, error: 'Failed to fetch documents' };
  }
}

// Get a single document by ID
export async function getDocumentById(id: string): Promise<DocumentResponse> {
  try {
    const db = await getDatabase();
    const document = await db
      .collection<DocumentMetadata>(COLLECTION_NAME)
      .findOne({ id });

    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    return { success: true, data: document };
  } catch (error) {
    console.error('Error fetching document:', error);
    return { success: false, error: 'Failed to fetch document' };
  }
}

// Create document metadata (actual file upload handled by bridge server)
export async function createDocumentMetadata(
  metadata: DocumentMetadata
): Promise<DocumentResponse> {
  try {
    const db = await getDatabase();
    await db.collection<DocumentMetadata>(COLLECTION_NAME).insertOne(metadata);

    return { success: true, data: metadata };
  } catch (error) {
    console.error('Error creating document metadata:', error);
    return { success: false, error: 'Failed to create document metadata' };
  }
}

// Update document metadata
export async function updateDocumentMetadata(
  id: string,
  metadata: Partial<DocumentMetadata>
): Promise<DocumentResponse> {
  try {
    const db = await getDatabase();
    const result = await db
      .collection<DocumentMetadata>(COLLECTION_NAME)
      .findOneAndUpdate(
        { id },
        { $set: metadata },
        { returnDocument: 'after' }
      );

    if (!result) {
      return { success: false, error: 'Document not found' };
    }

    return { success: true, data: result as DocumentMetadata };
  } catch (error) {
    console.error('Error updating document metadata:', error);
    return { success: false, error: 'Failed to update document metadata' };
  }
}

// Delete document metadata (actual file deletion handled by bridge server)
export async function deleteDocumentMetadata(id: string): Promise<DocumentResponse> {
  try {
    const db = await getDatabase();
    const result = await db
      .collection<DocumentMetadata>(COLLECTION_NAME)
      .deleteOne({ id });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Document not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting document metadata:', error);
    return { success: false, error: 'Failed to delete document metadata' };
  }
}
