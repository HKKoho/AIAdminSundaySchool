// Test endpoint to verify MongoDB connection and create sample data
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return res.status(500).json({
        success: false,
        error: 'MONGODB_URI not set',
        mongodbUri: 'NOT SET'
      });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('churchadmin');

    // Test 1: List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Test 2: Try to insert a test document if POST request
    if (req.method === 'POST') {
      // Insert test arrangement
      const testArrangement = {
        id: `test-${Date.now()}`,
        time: '主日 11:30 AM',
        beginningDate: '2026年1月5日',
        duration: '1 小時',
        place: '測試地點',
        teacher: 'MongoDB 測試',
        focusLevel: '測試連接',
        group: '測試班',
        createdAt: new Date().toISOString()
      };

      await db.collection('arrangements').insertOne(testArrangement);

      // Insert test attendance
      const testAttendance = {
        id: `test-attendance-${Date.now()}`,
        eventType: 'worship',
        eventDate: new Date().toISOString().split('T')[0],
        members: [
          { id: 'test1', name: '測試成員', present: true, timestamp: new Date().toISOString() }
        ],
        ownerId: 'user_admin_001',
        department: 'sunday_school',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.collection('attendance').insertOne(testAttendance);

      // Refresh collections list
      const newCollections = await db.listCollections().toArray();
      const newCollectionNames = newCollections.map(c => c.name);

      return res.status(200).json({
        success: true,
        message: 'MongoDB is working! Test documents created.',
        database: 'churchadmin',
        collectionsBeforeTest: collectionNames,
        collectionsAfterTest: newCollectionNames,
        testDataInserted: {
          arrangement: testArrangement,
          attendance: testAttendance
        }
      });
    }

    // GET request - just show status
    const response = {
      success: true,
      message: 'MongoDB connection successful!',
      database: 'churchadmin',
      collections: collectionNames,
      hint: 'Send POST request to this endpoint to create test data'
    };

    await client.close();
    return res.status(200).json(response);

  } catch (error) {
    console.error('MongoDB test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return res.status(500).json({
      success: false,
      error: errorMessage,
      stack: errorStack,
      mongodbUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
      hint: 'Check that MONGODB_URI environment variable is set in Vercel'
    });
  }
}
