/**
 * Authentication and Authorization Types
 * Role-Based Access Control (RBAC) for Church Admin System
 */

// User Roles (Hierarchical)
export type UserRole =
  | 'super_admin'      // Full system access
  | 'senior_pastor'    // Access to all pastoral and admin features
  | 'pastor'           // Access to assigned departments/ministries
  | 'admin_staff'      // Administrative access (bookkeeping, documents)
  | 'ministry_leader'  // Access to specific ministry data
  | 'volunteer'        // Limited access to assigned tasks
  | 'guest';           // Read-only demo access

// Departments/Ministries for data segmentation
export type Department =
  | 'sunday_school'
  | 'youth'
  | 'worship'
  | 'administration'
  | 'finance'
  | 'pastoral_care'
  | 'events'
  | 'outreach'
  | 'all'; // Super admin only

// Permissions for specific features
export type Permission =
  | 'attendance:read'
  | 'attendance:write'
  | 'attendance:delete'
  | 'arrangements:read'
  | 'arrangements:write'
  | 'arrangements:delete'
  | 'documents:read'
  | 'documents:write'
  | 'documents:delete'
  | 'bookkeeper:read'
  | 'bookkeeper:write'
  | 'bookkeeper:delete'
  | 'whatsapp:read'
  | 'whatsapp:write'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'settings:read'
  | 'settings:write';

// User Profile
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departments: Department[];  // Which departments they can access
  permissions: Permission[];  // Explicit permissions
  assignedTo?: string;        // For pastoral care: which pastor they report to
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

// Role-Permission Mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'attendance:read', 'attendance:write', 'attendance:delete',
    'arrangements:read', 'arrangements:write', 'arrangements:delete',
    'documents:read', 'documents:write', 'documents:delete',
    'bookkeeper:read', 'bookkeeper:write', 'bookkeeper:delete',
    'whatsapp:read', 'whatsapp:write',
    'users:read', 'users:write', 'users:delete',
    'settings:read', 'settings:write'
  ],
  senior_pastor: [
    'attendance:read', 'attendance:write',
    'arrangements:read', 'arrangements:write',
    'documents:read', 'documents:write',
    'bookkeeper:read',
    'whatsapp:read', 'whatsapp:write',
    'users:read'
  ],
  pastor: [
    'attendance:read', 'attendance:write',
    'arrangements:read', 'arrangements:write',
    'documents:read', 'documents:write',
    'whatsapp:read', 'whatsapp:write'
  ],
  admin_staff: [
    'arrangements:read', 'arrangements:write',
    'documents:read', 'documents:write', 'documents:delete',
    'bookkeeper:read', 'bookkeeper:write'
  ],
  ministry_leader: [
    'attendance:read', 'attendance:write',
    'arrangements:read',
    'documents:read'
  ],
  volunteer: [
    'attendance:read',
    'arrangements:read',
    'documents:read'
  ],
  guest: [
    'attendance:read',
    'arrangements:read'
  ]
};

// Department-Role Mapping (which roles can access which departments)
export const ROLE_DEPARTMENTS: Record<UserRole, Department[]> = {
  super_admin: ['all'],
  senior_pastor: ['all'],
  pastor: [], // Assigned dynamically
  admin_staff: ['administration', 'finance'],
  ministry_leader: [], // Assigned dynamically
  volunteer: [], // Assigned dynamically
  guest: [] // No department access
};

// Session/Token
export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  departments: Department[];
  permissions: Permission[];
  expiresAt: string;
}

// Helper function to check permission
export function hasPermission(user: User, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

// Helper function to check department access
export function hasDepartmentAccess(user: User, department: Department): boolean {
  if (user.departments.includes('all')) return true;
  return user.departments.includes(department);
}

// Data ownership for multi-tenancy
export interface OwnedData {
  ownerId: string;          // User who created the record
  department: Department;   // Which department this belongs to
  assignedTo?: string[];    // Which users can access this
  isPublic?: boolean;       // Whether all users in department can see it
}
