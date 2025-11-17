import { getDatabase } from '../lib/mongodb';

const COLLECTION_NAME = 'attendance';

export interface AttendanceRecord {
  id: string;
  eventType: 'worship' | 'lordsupper' | 'christmaseve' | 'easterfriday' | 'eastersunday';
  eventDate: string;
  members: Array<{
    id: string;
    name: string;
    present: boolean;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceResponse {
  success: boolean;
  data?: AttendanceRecord | AttendanceRecord[];
  error?: string;
}

// Save attendance record
export async function saveAttendanceRecord(
  record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AttendanceResponse> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const attendanceRecord: AttendanceRecord = {
      id: `${record.eventType}_${record.eventDate}_${Date.now()}`,
      ...record,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection<AttendanceRecord>(COLLECTION_NAME).insertOne(attendanceRecord);

    return { success: true, data: attendanceRecord };
  } catch (error) {
    console.error('Error saving attendance record:', error);
    return { success: false, error: 'Failed to save attendance record' };
  }
}

// Get attendance records by event type
export async function getAttendanceByEventType(
  eventType: string
): Promise<AttendanceResponse> {
  try {
    const db = await getDatabase();
    const records = await db
      .collection<AttendanceRecord>(COLLECTION_NAME)
      .find({ eventType })
      .sort({ eventDate: -1 })
      .toArray();

    return { success: true, data: records };
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return { success: false, error: 'Failed to fetch attendance records' };
  }
}

// Get all attendance records
export async function getAllAttendanceRecords(): Promise<AttendanceResponse> {
  try {
    const db = await getDatabase();
    const records = await db
      .collection<AttendanceRecord>(COLLECTION_NAME)
      .find({})
      .sort({ eventDate: -1 })
      .toArray();

    return { success: true, data: records };
  } catch (error) {
    console.error('Error fetching all attendance records:', error);
    return { success: false, error: 'Failed to fetch attendance records' };
  }
}

// Get attendance record by ID
export async function getAttendanceById(id: string): Promise<AttendanceResponse> {
  try {
    const db = await getDatabase();
    const record = await db
      .collection<AttendanceRecord>(COLLECTION_NAME)
      .findOne({ id });

    if (!record) {
      return { success: false, error: 'Attendance record not found' };
    }

    return { success: true, data: record };
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    return { success: false, error: 'Failed to fetch attendance record' };
  }
}

// Delete attendance record
export async function deleteAttendanceRecord(id: string): Promise<AttendanceResponse> {
  try {
    const db = await getDatabase();
    const result = await db
      .collection<AttendanceRecord>(COLLECTION_NAME)
      .deleteOne({ id });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Attendance record not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return { success: false, error: 'Failed to delete attendance record' };
  }
}
