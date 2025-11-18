import { MongoClient } from 'mongodb';
import { ClassArrangementInfo } from '../types';

const COLLECTION_NAME = 'arrangements';

async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  const client = new MongoClient(uri);
  await client.connect();
  return { db: client.db('churchadmin'), client };
}

export interface ArrangementResponse {
  success: boolean;
  data?: ClassArrangementInfo | ClassArrangementInfo[];
  error?: string;
}

// Get all arrangements
export async function getAllArrangements(): Promise<ArrangementResponse> {
  let client: MongoClient | null = null;
  try {
    const { db, client: mongoClient } = await getDatabase();
    client = mongoClient;
    const arrangements = await db
      .collection<ClassArrangementInfo>(COLLECTION_NAME)
      .find({})
      .toArray();

    return { success: true, data: arrangements };
  } catch (error) {
    console.error('Error fetching arrangements:', error);
    return { success: false, error: 'Failed to fetch arrangements' };
  } finally {
    if (client) await client.close();
  }
}

// Create a new arrangement
export async function createArrangement(
  arrangement: ClassArrangementInfo
): Promise<ArrangementResponse> {
  let client: MongoClient | null = null;
  try {
    const { db, client: mongoClient } = await getDatabase();
    client = mongoClient;
    await db.collection<ClassArrangementInfo>(COLLECTION_NAME).insertOne(arrangement);

    return { success: true, data: arrangement };
  } catch (error) {
    console.error('Error creating arrangement:', error);
    return { success: false, error: 'Failed to create arrangement' };
  } finally {
    if (client) await client.close();
  }
}

// Update an existing arrangement
export async function updateArrangement(
  id: string,
  arrangement: ClassArrangementInfo
): Promise<ArrangementResponse> {
  try {
    const db = await getDatabase();
    const result = await db
      .collection<ClassArrangementInfo>(COLLECTION_NAME)
      .findOneAndUpdate(
        { id },
        { $set: arrangement },
        { returnDocument: 'after' }
      );

    if (!result) {
      return { success: false, error: 'Arrangement not found' };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating arrangement:', error);
    return { success: false, error: 'Failed to update arrangement' };
  }
}

// Delete an arrangement
export async function deleteArrangement(id: string): Promise<ArrangementResponse> {
  try {
    const db = await getDatabase();
    const result = await db
      .collection<ClassArrangementInfo>(COLLECTION_NAME)
      .deleteOne({ id });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Arrangement not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting arrangement:', error);
    return { success: false, error: 'Failed to delete arrangement' };
  }
}

// Export all arrangements as JSON
export async function exportArrangementsAsJSON(): Promise<string> {
  const result = await getAllArrangements();
  if (result.success && result.data) {
    return JSON.stringify(result.data, null, 2);
  }
  return '[]';
}

// Import arrangements from JSON
export async function importArrangementsFromJSON(
  jsonData: string
): Promise<ArrangementResponse> {
  try {
    const arrangements = JSON.parse(jsonData) as ClassArrangementInfo[];
    const db = await getDatabase();

    // Clear existing arrangements (optional - you might want to skip this)
    // await db.collection(COLLECTION_NAME).deleteMany({});

    // Insert all arrangements
    if (arrangements.length > 0) {
      await db.collection<ClassArrangementInfo>(COLLECTION_NAME).insertMany(arrangements);
    }

    return { success: true, data: arrangements };
  } catch (error) {
    console.error('Error importing arrangements:', error);
    return { success: false, error: 'Failed to import arrangements' };
  }
}
