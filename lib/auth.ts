/**
 * Authorization Middleware and Helper Functions
 * Implements Role-Based Access Control (RBAC)
 */

import { User, Permission, Department, hasPermission, hasDepartmentAccess } from '../types/auth';
import { getUserById, getUserByEmail } from '../api/users';

// Simulated session storage (in production, use JWT or session cookies)
let currentUser: User | null = null;

/**
 * Set current user (called after login)
 */
export function setCurrentUser(user: User) {
  currentUser = user;
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  if (currentUser) return currentUser;

  // Try to restore from localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
  }

  return null;
}

/**
 * Clear current user (logout)
 */
export function clearCurrentUser() {
  currentUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
}

/**
 * Check if user has specific permission
 */
export function checkPermission(permission: Permission): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return hasPermission(user, permission);
}

/**
 * Check if user has access to department
 */
export function checkDepartmentAccess(department: Department): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return hasDepartmentAccess(user, department);
}

/**
 * Require permission (throws error if not authorized)
 */
export function requirePermission(permission: Permission): void {
  if (!checkPermission(permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Require department access (throws error if not authorized)
 */
export function requireDepartmentAccess(department: Department): void {
  if (!checkDepartmentAccess(department)) {
    throw new Error(`Access denied to department: ${department}`);
  }
}

/**
 * Filter data by user's department access
 * Used for row-level security
 */
export function filterByDepartmentAccess<T extends { department?: Department }>(
  data: T[]
): T[] {
  const user = getCurrentUser();
  if (!user) return [];

  // Super admins and senior pastors see all
  if (user.departments.includes('all')) {
    return data;
  }

  // Filter by user's departments
  return data.filter(item => {
    if (!item.department) return true; // No department restriction
    return user.departments.includes(item.department);
  });
}

/**
 * Check if user can access specific record
 * Implements row-level security
 */
export function canAccessRecord(record: {
  ownerId?: string;
  department?: Department;
  assignedTo?: string[];
  isPublic?: boolean;
}): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Super admin has access to everything
  if (user.role === 'super_admin') return true;

  // Check if user is the owner
  if (record.ownerId === user.id) return true;

  // Check if record is assigned to user
  if (record.assignedTo?.includes(user.id)) return true;

  // Check department access
  if (record.department && !hasDepartmentAccess(user, record.department)) {
    return false;
  }

  // If record is public within department, allow access
  if (record.isPublic && record.department) {
    return hasDepartmentAccess(user, record.department);
  }

  return false;
}

/**
 * Get user by email (for login)
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // In production, verify password hash
  // For demo, we accept 'demo123' for any email
  if (password !== 'demo123') {
    return null;
  }

  const result = await getUserByEmail(email);
  if (!result.success || !result.data) {
    return null;
  }

  const user = Array.isArray(result.data) ? result.data[0] : result.data;
  setCurrentUser(user);
  return user;
}

/**
 * Create demo users for testing
 */
export async function createDemoUsers() {
  const { createUser } = await import('../api/users');

  const demoUsers = [
    {
      email: 'admin@church.com',
      name: 'Church Administrator',
      role: 'super_admin' as const,
      departments: ['all' as const]
    },
    {
      email: 'pastor@church.com',
      name: 'Senior Pastor',
      role: 'senior_pastor' as const,
      departments: ['all' as const]
    },
    {
      email: 'youth.pastor@church.com',
      name: 'Youth Pastor',
      role: 'pastor' as const,
      departments: ['youth' as const, 'sunday_school' as const]
    },
    {
      email: 'bookkeeper@church.com',
      name: 'Church Bookkeeper',
      role: 'admin_staff' as const,
      departments: ['finance' as const, 'administration' as const]
    },
    {
      email: 'volunteer@church.com',
      name: 'Sunday School Volunteer',
      role: 'volunteer' as const,
      departments: ['sunday_school' as const]
    },
    {
      email: 'guest@demo.com',
      name: 'Guest User',
      role: 'guest' as const,
      departments: []
    }
  ];

  for (const userData of demoUsers) {
    await createUser(userData);
  }
}
