// API endpoints for Attendance Management with MongoDB
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, ObjectId } from 'mongodb';

interface AttendanceMember {
  id: string;
  name: string;
  present: boolean;
  timestamp: string;
}

interface AttendanceRecord {
  id?: string;
  _id?: ObjectId;
  eventType: string;
  eventDate: string;
  fileName: string;
  csvContent: string;
  members: AttendanceMember[];
  createdAt: string;
}

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
    const collection = db.collection('attendance');

    // Handle different actions based on query parameter
    const action = req.query.action as string;

    switch (req.method) {
      case 'GET':
        // Get records with optional filtering
        if (action === 'export-nas') {
          // Export to NAS - called by cron job at 22:00 on last day of month
          return await handleNasExport(collection, res);
        } else if (action === 'cleanup') {
          // Cleanup records older than 3 months
          return await handleCleanup(collection, res);
        } else if (action === 'participation-list') {
          // Get AI-constructed participation list
          const eventType = req.query.eventType as string;
          return await getParticipationList(collection, eventType, res);
        } else {
          // Get all records or filtered by eventType
          const eventType = req.query.eventType as string;
          let query: any = {};

          if (eventType) {
            if (eventType === 'calendar') {
              query.eventType = { $in: ['christmaseve', 'easterfriday', 'eastersunday'] };
            } else {
              query.eventType = eventType;
            }
          }

          const records = await collection
            .find(query)
            .sort({ eventDate: -1, createdAt: -1 })
            .toArray();

          return res.status(200).json({ success: true, data: records });
        }

      case 'POST':
        // Save new attendance record
        if (action === 'save') {
          const record: AttendanceRecord = req.body;

          // Generate unique ID
          const recordId = `${record.eventType}_${record.eventDate}_${Date.now()}`;
          const documentToInsert = {
            ...record,
            id: recordId,
            createdAt: record.createdAt || new Date().toISOString()
          };

          await collection.insertOne(documentToInsert);
          return res.status(201).json({ success: true, data: documentToInsert });
        }
        break;

      case 'DELETE':
        // Delete a specific record
        const deleteId = req.query.id as string;
        if (!deleteId) {
          return res.status(400).json({ success: false, error: 'ID is required' });
        }

        const deleteResult = await collection.deleteOne({ id: deleteId });
        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ success: false, error: 'Record not found' });
        }
        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Attendance API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Handle NAS export - called by cron job at 22:00 on last day of month
async function handleNasExport(collection: any, res: VercelResponse) {
  try {
    // Get current month's records
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const records = await collection.find({
      eventDate: {
        $gte: firstDayOfMonth.toISOString().split('T')[0],
        $lte: lastDayOfMonth.toISOString().split('T')[0]
      }
    }).toArray();

    // NAS configuration from environment variables
    const nasHost = process.env.NAS_HOST || 'synology.local';
    const nasPath = process.env.NAS_ATTENDANCE_PATH || '/volume1/ChurchData/Attendance';
    const nasUser = process.env.NAS_USER;
    const nasPassword = process.env.NAS_PASSWORD;

    // In production, you would use SMB/CIFS or WebDAV to write to NAS
    // For now, we'll return the data that would be exported
    const exportData = records.map((record: AttendanceRecord) => ({
      fileName: record.fileName,
      csvContent: record.csvContent,
      eventType: record.eventType,
      eventDate: record.eventDate
    }));

    // Log the export attempt
    console.log(`NAS Export: ${records.length} records to ${nasHost}${nasPath}`);

    return res.status(200).json({
      success: true,
      message: `Would export ${records.length} records to NAS`,
      nasPath: `${nasHost}${nasPath}`,
      records: exportData
    });
  } catch (error) {
    console.error('NAS Export Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export to NAS'
    });
  }
}

// Handle cleanup of records older than 3 months
async function handleCleanup(collection: any, res: VercelResponse) {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const cutoffDate = threeMonthsAgo.toISOString().split('T')[0];

    const result = await collection.deleteMany({
      eventDate: { $lt: cutoffDate }
    });

    console.log(`Cleanup: Deleted ${result.deletedCount} records older than ${cutoffDate}`);

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} records older than 3 months`,
      cutoffDate,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cleanup old records'
    });
  }
}

// Get participation list for AI-powered display
async function getParticipationList(collection: any, eventType: string, res: VercelResponse) {
  try {
    let query: any = {};

    if (eventType === 'calendar') {
      query.eventType = { $in: ['christmaseve', 'easterfriday', 'eastersunday'] };
    } else if (eventType) {
      query.eventType = eventType;
    }

    // Get records from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    query.eventDate = { $gte: threeMonthsAgo.toISOString().split('T')[0] };

    const records = await collection
      .find(query)
      .sort({ eventDate: -1 })
      .toArray();

    // Aggregate participation data by member
    const participationMap = new Map<string, { name: string; totalEvents: number; attended: number; lastAttended: string }>();

    records.forEach((record: AttendanceRecord) => {
      record.members.forEach((member) => {
        const existing = participationMap.get(member.name) || {
          name: member.name,
          totalEvents: 0,
          attended: 0,
          lastAttended: ''
        };

        existing.totalEvents++;
        if (member.present) {
          existing.attended++;
          if (!existing.lastAttended || record.eventDate > existing.lastAttended) {
            existing.lastAttended = record.eventDate;
          }
        }

        participationMap.set(member.name, existing);
      });
    });

    // Convert to array and calculate participation rate
    const participationList = Array.from(participationMap.values()).map(member => ({
      ...member,
      participationRate: member.totalEvents > 0
        ? Math.round((member.attended / member.totalEvents) * 100)
        : 0
    }));

    // Sort by participation rate (descending)
    participationList.sort((a, b) => b.participationRate - a.participationRate);

    return res.status(200).json({
      success: true,
      data: {
        eventType,
        totalRecords: records.length,
        participationList,
        csvFiles: records.map((r: AttendanceRecord) => ({
          fileName: r.fileName,
          eventDate: r.eventDate,
          eventType: r.eventType
        }))
      }
    });
  } catch (error) {
    console.error('Participation List Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get participation list'
    });
  }
}
