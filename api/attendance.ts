import { getDatabase } from '../lib/mongodb';
import { Department } from '../types/auth';

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
  // Access control fields
  ownerId: string;          // User who created this record
  department: Department;   // Which department this belongs to
  assignedTo?: string[];    // Specific users who can access (optional)
  isPublic: boolean;        // Whether all department members can see it
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
  record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string // Current user ID for ownership
): Promise<AttendanceResponse> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const attendanceRecord: AttendanceRecord = {
      id: `${record.eventType}_${record.eventDate}_${Date.now()}`,
      ...record,
      ownerId: userId,
      // Default to making records public within department if not specified
      isPublic: record.isPublic ?? true,
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

// Get attendance records by event type with access control
export async function getAttendanceByEventType(
  eventType: string,
  userId: string,
  userDepartments: Department[]
): Promise<AttendanceResponse> {
  try {
    const db = await getDatabase();

    // Build query with access control
    const query: any = { eventType };

    // If not super admin/senior pastor (doesn't have 'all' department)
    if (!userDepartments.includes('all')) {
      // User can see records that:
      // 1. They own, OR
      // 2. Are public and in their department, OR
      // 3. Are specifically assigned to them
      query.$or = [
        { ownerId: userId },
        { isPublic: true, department: { $in: userDepartments } },
        { assignedTo: userId }
      ];
    }

    const records = await db
      .collection<AttendanceRecord>(COLLECTION_NAME)
      .find(query)
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
