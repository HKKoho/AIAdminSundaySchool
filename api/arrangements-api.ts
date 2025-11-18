// API endpoints for Vercel Serverless Functions
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

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

  let client: MongoClient | null = null;

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return res.status(500).json({
        success: false,
        error: 'MONGODB_URI not set'
      });
    }

    client = new MongoClient(uri);
    await client.connect();
    const db = client.db('churchadmin');
    const collection = db.collection('arrangements');

    switch (req.method) {
      case 'GET':
        if (req.query.export === 'true') {
          const arrangements = await collection.find({}).toArray();
          const jsonData = JSON.stringify(arrangements, null, 2);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', 'attachment; filename=arrangements.json');
          return res.status(200).send(jsonData);
        }
        const arrangements = await collection.find({}).toArray();
        return res.status(200).json({ success: true, data: arrangements });

      case 'POST':
        const newArrangement = req.body;
        await collection.insertOne(newArrangement);
        return res.status(201).json({ success: true, data: newArrangement });

      case 'PUT':
        const { id, ...updateData } = req.body;
        const result = await collection.findOneAndUpdate(
          { id },
          { $set: updateData },
          { returnDocument: 'after' }
        );
        if (!result) {
          return res.status(404).json({ success: false, error: 'Arrangement not found' });
        }
        return res.status(200).json({ success: true, data: result });

      case 'DELETE':
        const deleteId = req.query.id as string;
        if (!deleteId) {
          return res.status(400).json({ success: false, error: 'ID is required' });
        }
        const deleteResult = await collection.deleteOne({ id: deleteId });
        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ success: false, error: 'Arrangement not found' });
        }
        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return res.status(500).json({
      success: false,
      error: errorMessage,
      stack: errorStack
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
