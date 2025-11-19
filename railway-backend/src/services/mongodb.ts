import { MongoClient, Db, Collection } from 'mongodb';
import { logger } from '../utils/logger';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('churchadmin');

    // Verify connection
    await db.command({ ping: 1 });
    logger.info('MongoDB connection established');

    return db;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectMongoDB() first.');
  }
  return db;
}

export function getCollection(name: string): Collection {
  return getDatabase().collection(name);
}

export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB connection closed');
  }
}

// Collections helper
export const collections = {
  attendance: () => getCollection('attendance'),
  arrangements: () => getCollection('arrangements'),
  members: () => getCollection('members'),
  events: () => getCollection('events'),
  documents: () => getCollection('documents'),
  financials: () => getCollection('financials'),
  whatsappSessions: () => getCollection('whatsapp_sessions'),
  aiLogs: () => getCollection('ai_logs')
};
