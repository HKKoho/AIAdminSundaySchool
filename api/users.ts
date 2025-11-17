import { getDatabase } from '../lib/mongodb';
import { User, UserRole, Department, Permission, ROLE_PERMISSIONS } from '../types/auth';

const COLLECTION_NAME = 'users';

export interface UserResponse {
  success: boolean;
  data?: User | User[];
  error?: string;
}

// Create a new user
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserResponse> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    // Get permissions based on role
    const permissions = ROLE_PERMISSIONS[userData.role] || [];

    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      permissions,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    await db.collection<User>(COLLECTION_NAME).insertOne(user);

    // Don't return sensitive data
    return { success: true, data: user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<UserResponse> {
  try {
    const db = await getDatabase();
    const user = await db.collection<User>(COLLECTION_NAME).findOne({ email });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<UserResponse> {
  try {
    const db = await getDatabase();
    const user = await db.collection<User>(COLLECTION_NAME).findOne({ id: userId });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

// Get all users (admin only)
export async function getAllUsers(): Promise<UserResponse> {
  try {
    const db = await getDatabase();
    const users = await db
      .collection<User>(COLLECTION_NAME)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

// Update user
export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<UserResponse> {
  try {
    const db = await getDatabase();

    // Update permissions if role changes
    if (updates.role) {
      updates.permissions = ROLE_PERMISSIONS[updates.role];
    }

    updates.updatedAt = new Date().toISOString();

    const result = await db
      .collection<User>(COLLECTION_NAME)
      .findOneAndUpdate(
        { id: userId },
        { $set: updates },
        { returnDocument: 'after' }
      );

    if (!result) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

// Update last login
export async function updateLastLogin(userId: string): Promise<UserResponse> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db
      .collection<User>(COLLECTION_NAME)
      .updateOne(
        { id: userId },
        { $set: { lastLogin: now } }
      );

    return { success: true };
  } catch (error) {
    console.error('Error updating last login:', error);
    return { success: false, error: 'Failed to update last login' };
  }
}

// Get users by department
export async function getUsersByDepartment(department: Department): Promise<UserResponse> {
  try {
    const db = await getDatabase();
    const users = await db
      .collection<User>(COLLECTION_NAME)
      .find({
        $or: [
          { departments: department },
          { departments: 'all' }
        ],
        isActive: true
      })
      .toArray();

    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users by department:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

// Get users by role
export async function getUsersByRole(role: UserRole): Promise<UserResponse> {
  try {
    const db = await getDatabase();
    const users = await db
      .collection<User>(COLLECTION_NAME)
      .find({ role, isActive: true })
      .toArray();

    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

// Deactivate user (soft delete)
export async function deactivateUser(userId: string): Promise<UserResponse> {
  try {
    const db = await getDatabase();
    await db
      .collection<User>(COLLECTION_NAME)
      .updateOne(
        { id: userId },
        { $set: { isActive: false, updatedAt: new Date().toISOString() } }
      );

    return { success: true };
  } catch (error) {
    console.error('Error deactivating user:', error);
    return { success: false, error: 'Failed to deactivate user' };
  }
}
