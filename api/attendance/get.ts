import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAttendanceByEventType, getAllAttendanceRecords } from '../attendance';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { eventType } = req.query;

    if (eventType && typeof eventType === 'string') {
      const result = await getAttendanceByEventType(eventType);
      return res.status(result.success ? 200 : 400).json(result);
    } else {
      const result = await getAllAttendanceRecords();
      return res.status(result.success ? 200 : 400).json(result);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
