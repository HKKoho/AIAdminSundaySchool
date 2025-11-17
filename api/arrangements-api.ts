// API endpoints for Vercel Serverless Functions
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAllArrangements,
  createArrangement,
  updateArrangement,
  deleteArrangement,
  exportArrangementsAsJSON,
} from './arrangements';
import { ClassArrangementInfo } from '../types';

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

  try {
    switch (req.method) {
      case 'GET':
        if (req.query.export === 'true') {
          const jsonData = await exportArrangementsAsJSON();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', 'attachment; filename=arrangements.json');
          return res.status(200).send(jsonData);
        }
        const allArrangements = await getAllArrangements();
        return res.status(200).json(allArrangements);

      case 'POST':
        const newArrangement = req.body as ClassArrangementInfo;
        const created = await createArrangement(newArrangement);
        return res.status(created.success ? 201 : 400).json(created);

      case 'PUT':
        const { id, ...updateData } = req.body as ClassArrangementInfo & { id: string };
        const updated = await updateArrangement(id, updateData as ClassArrangementInfo);
        return res.status(updated.success ? 200 : 404).json(updated);

      case 'DELETE':
        const deleteId = req.query.id as string;
        if (!deleteId) {
          return res.status(400).json({ success: false, error: 'ID is required' });
        }
        const deleted = await deleteArrangement(deleteId);
        return res.status(deleted.success ? 200 : 404).json(deleted);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
