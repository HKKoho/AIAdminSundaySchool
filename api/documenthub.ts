import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAllDocuments,
  getDocumentById,
  createDocumentMetadata,
  updateDocumentMetadata,
  deleteDocumentMetadata,
} from './documents';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.id) {
          // Get single document
          const result = await getDocumentById(query.id as string);
          return res.status(result.success ? 200 : 404).json(result);
        } else {
          // Get all documents with optional filters
          const filters = {
            department: query.department as string,
            ministry: query.ministry as string,
            docType: query.docType as string,
            year: query.year ? parseInt(query.year as string) : undefined,
            status: query.status as string,
            searchTerm: query.searchTerm as string,
          };
          const result = await getAllDocuments(filters);
          return res.status(result.success ? 200 : 500).json(result);
        }

      case 'POST':
        // Create document metadata
        const createResult = await createDocumentMetadata(body);
        return res.status(createResult.success ? 201 : 500).json(createResult);

      case 'PUT':
        // Update document metadata
        if (!query.id) {
          return res.status(400).json({ success: false, error: 'Document ID required' });
        }
        const updateResult = await updateDocumentMetadata(query.id as string, body);
        return res.status(updateResult.success ? 200 : 404).json(updateResult);

      case 'DELETE':
        // Delete document metadata
        if (!query.id) {
          return res.status(400).json({ success: false, error: 'Document ID required' });
        }
        const deleteResult = await deleteDocumentMetadata(query.id as string);
        return res.status(deleteResult.success ? 200 : 404).json(deleteResult);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
