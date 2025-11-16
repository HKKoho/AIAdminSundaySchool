import { DocumentMetadata } from '../types';

// API endpoints
const VERCEL_API = import.meta.env.VITE_API_URL || '/api/documenthub';
const BRIDGE_API = import.meta.env.VITE_BRIDGE_URL || 'http://localhost:3001';

export interface DocumentFilters {
  department?: string;
  ministry?: string;
  docType?: string;
  year?: number;
  status?: string;
  searchTerm?: string;
}

/**
 * Fetch all documents with optional filters
 */
export async function fetchDocuments(filters?: DocumentFilters): Promise<DocumentMetadata[]> {
  try {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'All') {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${VERCEL_API}?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch documents');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

/**
 * Upload a document (metadata to Vercel API, file to bridge server)
 */
export async function uploadDocument(
  file: File,
  metadata: Omit<DocumentMetadata, 'id' | 'uploadDate' | 'fileName' | 'filePath' | 'fileSize' | 'mimeType'>
): Promise<DocumentMetadata> {
  try {
    // Step 1: Upload file to bridge server
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', metadata.department);
    formData.append('year', metadata.year.toString());
    formData.append('docType', metadata.docType);

    const bridgeResponse = await fetch(`${BRIDGE_API}/upload`, {
      method: 'POST',
      body: formData,
    });

    const bridgeResult = await bridgeResponse.json();

    if (!bridgeResult.success) {
      throw new Error(bridgeResult.error || 'Failed to upload file to NAS');
    }

    // Step 2: Save metadata to Vercel API
    const fullMetadata: DocumentMetadata = {
      id: `doc_${Date.now()}`,
      ...metadata,
      fileName: bridgeResult.data.fileName,
      filePath: bridgeResult.data.filePath,
      fileSize: bridgeResult.data.fileSize,
      mimeType: bridgeResult.data.mimeType,
      uploadDate: new Date().toISOString(),
    };

    const metadataResponse = await fetch(VERCEL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullMetadata),
    });

    const metadataResult = await metadataResponse.json();

    if (!metadataResult.success) {
      // If metadata save fails, we should ideally delete the file from NAS
      // For now, just throw error
      throw new Error(metadataResult.error || 'Failed to save document metadata');
    }

    return metadataResult.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Download a document from the bridge server
 */
export async function downloadDocument(filePath: string, fileName: string): Promise<void> {
  try {
    const url = `${BRIDGE_API}/download?filePath=${encodeURIComponent(filePath)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    // Create blob and trigger download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
}

/**
 * Delete a document (metadata from Vercel API, file from bridge server)
 */
export async function deleteDocument(id: string, filePath: string): Promise<void> {
  try {
    // Step 1: Delete file from bridge server
    const bridgeResponse = await fetch(
      `${BRIDGE_API}/delete?filePath=${encodeURIComponent(filePath)}`,
      { method: 'DELETE' }
    );

    const bridgeResult = await bridgeResponse.json();

    if (!bridgeResult.success) {
      throw new Error(bridgeResult.error || 'Failed to delete file from NAS');
    }

    // Step 2: Delete metadata from Vercel API
    const metadataResponse = await fetch(`${VERCEL_API}?id=${id}`, {
      method: 'DELETE',
    });

    const metadataResult = await metadataResponse.json();

    if (!metadataResult.success) {
      throw new Error(metadataResult.error || 'Failed to delete document metadata');
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Update document metadata
 */
export async function updateDocumentMetadata(
  id: string,
  updates: Partial<DocumentMetadata>
): Promise<DocumentMetadata> {
  try {
    const response = await fetch(`${VERCEL_API}?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update document metadata');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating document metadata:', error);
    throw error;
  }
}

/**
 * Check if bridge server is accessible
 */
export async function checkBridgeServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BRIDGE_API}/health`, {
      method: 'GET',
      // Don't wait too long
      signal: AbortSignal.timeout(3000),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Bridge server not accessible:', error);
    return false;
  }
}
