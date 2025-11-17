# Access Control & Security Architecture

## Overview

The Church Admin system implements **Role-Based Access Control (RBAC)** with **row-level security** to ensure that different users (pastors, staff, volunteers) can only access data they're authorized to see.

## User Roles Hierarchy

### 1. **Super Admin** (`super_admin`)
- **Access**: Full system access
- **Departments**: All
- **Use Case**: IT administrator, system maintainer
- **Can**:
  - Manage all users
  - Access all departments
  - Modify system settings
  - Delete any data

### 2. **Senior Pastor** (`senior_pastor`)
- **Access**: All pastoral and administrative features
- **Departments**: All
- **Use Case**: Head pastor, church administrator
- **Can**:
  - View all attendance records
  - Manage class arrangements
  - Access all documents
  - View financial reports (read-only)
  - Manage WhatsApp secretary
  - View all users

### 3. **Pastor** (`pastor`)
- **Access**: Assigned departments only
- **Departments**: Assigned (e.g., Youth, Sunday School)
- **Use Case**: Youth pastor, children's pastor
- **Can**:
  - Manage attendance for their departments
  - Create class arrangements for their departments
  - Access department documents
  - Use WhatsApp AI for their ministries
- **Cannot**:
  - Access other departments' data
  - View financial records
  - Manage users

### 4. **Admin Staff** (`admin_staff`)
- **Access**: Administrative functions
- **Departments**: Administration, Finance
- **Use Case**: Church secretary, bookkeeper
- **Can**:
  - Manage documents
  - Access bookkeeping features
  - Create class arrangements
- **Cannot**:
  - Access pastoral care data
  - Manage attendance
  - Access WhatsApp secretary

### 5. **Ministry Leader** (`ministry_leader`)
- **Access**: Specific ministry data
- **Departments**: Assigned ministry
- **Use Case**: Small group leader, worship leader
- **Can**:
  - View and record attendance for their group
  - View class arrangements
  - Access ministry documents
- **Cannot**:
  - Edit arrangements
  - Access other ministries' data
  - Delete records

### 6. **Volunteer** (`volunteer`)
- **Access**: Limited read/write for assigned tasks
- **Departments**: Assigned area
- **Use Case**: Sunday school teacher, event helper
- **Can**:
  - View attendance lists
  - View class schedules
  - View documents
- **Cannot**:
  - Delete anything
  - Access financial data
  - Manage users

### 7. **Guest** (`guest`)
- **Access**: Read-only demo access
- **Departments**: None
- **Use Case**: Visitors, prospective users
- **Can**:
  - View sample attendance data
  - View class schedules
- **Cannot**:
  - Create or modify anything
  - Access real user data

## Departments (Data Segmentation)

```typescript
- sunday_school   // Children's Sunday School
- youth           // Youth Ministry
- worship         // Worship Team
- administration  // General admin
- finance         // Financial records
- pastoral_care   // Pastoral counseling
- events          // Church events
- outreach        // Outreach programs
- all             // Super admin/Senior pastor only
```

## Permissions System

### Permission Format: `resource:action`

```typescript
// Attendance
'attendance:read'    // View attendance records
'attendance:write'   // Create/edit attendance
'attendance:delete'  // Delete attendance records

// Class Arrangements
'arrangements:read'
'arrangements:write'
'arrangements:delete'

// Documents
'documents:read'
'documents:write'
'documents:delete'

// Bookkeeping
'bookkeeper:read'
'bookkeeper:write'
'bookkeeper:delete'

// WhatsApp Secretary
'whatsapp:read'
'whatsapp:write'

// User Management
'users:read'
'users:write'
'users:delete'

// System Settings
'settings:read'
'settings:write'
```

## Row-Level Security

Every data record includes:

```typescript
{
  ownerId: string,        // Who created it
  department: Department, // Which department
  assignedTo?: string[],  // Specific users (optional)
  isPublic: boolean       // Visible to all in department
}
```

### Access Rules:

1. **User can access a record if**:
   - They are the owner, OR
   - The record is public AND in their department, OR
   - The record is specifically assigned to them, OR
   - They have 'all' department access (super admin/senior pastor)

2. **Data Isolation**:
   - Youth Pastor sees ONLY youth department data
   - Finance Staff sees ONLY finance data
   - Sunday School volunteer sees ONLY Sunday School data

## Example Scenarios

### Scenario 1: Multiple Pastors Using WhatsApp AI

**Setup:**
- Youth Pastor (youth@church.com) - Department: Youth
- Children's Pastor (children@church.com) - Department: Sunday School
- Senior Pastor (senior@church.com) - Department: All

**Result:**
```typescript
// Youth Pastor creates attendance record
{
  eventType: 'worship',
  department: 'youth',
  ownerId: 'youth-pastor-id',
  isPublic: true
}

// Who can see it?
✅ Youth Pastor (owner)
✅ Senior Pastor (has 'all' department)
✅ Other youth ministry staff (isPublic + same department)
❌ Children's Pastor (different department)
❌ Finance Staff (different department)
```

### Scenario 2: Financial Data

**Setup:**
- Bookkeeper (bookkeeper@church.com) - Department: Finance
- Senior Pastor (senior@church.com) - Department: All
- Youth Pastor (youth@church.com) - Department: Youth

**Result:**
```typescript
// Bookkeeper creates financial record
{
  type: 'expense',
  department: 'finance',
  ownerId: 'bookkeeper-id',
  isPublic: false  // Sensitive data
}

// Who can see it?
✅ Bookkeeper (owner)
✅ Senior Pastor (has 'all' department)
❌ Youth Pastor (different department)
❌ Volunteers (no finance access)
```

### Scenario 3: Shared Ministry Data

**Setup:**
- Youth Pastor creates event
- Wants to share with specific volunteers

**Result:**
```typescript
{
  eventType: 'youth_retreat',
  department: 'youth',
  ownerId: 'youth-pastor-id',
  assignedTo: ['volunteer-1-id', 'volunteer-2-id'],
  isPublic: false  // Not public, but assigned
}

// Who can see it?
✅ Youth Pastor (owner)
✅ Volunteer 1 (assigned)
✅ Volunteer 2 (assigned)
✅ Senior Pastor (has 'all')
❌ Other volunteers (not assigned)
```

## Implementation

### 1. Authentication (SignInPage.tsx)
```typescript
// User logs in
const user = await authenticateUser(email, password);
setCurrentUser(user);
```

### 2. Save Data with Access Control
```typescript
// When saving attendance
const attendanceData = {
  eventType: 'worship',
  eventDate: '2025-01-15',
  members: [...],
  department: currentUser.departments[0], // User's department
  ownerId: currentUser.id,
  isPublic: true
};

await saveAttendanceRecord(attendanceData, currentUser.id);
```

### 3. Fetch Data with Filtering
```typescript
// API automatically filters by user's departments
const records = await getAttendanceByEventType(
  'worship',
  currentUser.id,
  currentUser.departments
);
// Only returns records user is authorized to see
```

### 4. UI Permission Checks
```typescript
// Show/hide UI elements based on permissions
{checkPermission('attendance:write') && (
  <Button onClick={handleSave}>Save</Button>
)}

{checkPermission('users:delete') && (
  <Button onClick={handleDelete}>Delete User</Button>
)}
```

## Demo Users

For testing, the following demo users are available:

| Email | Role | Departments | Use Case |
|-------|------|-------------|----------|
| admin@church.com | Super Admin | All | System administration |
| pastor@church.com | Senior Pastor | All | Church oversight |
| youth.pastor@church.com | Pastor | Youth, Sunday School | Youth ministry |
| bookkeeper@church.com | Admin Staff | Finance, Admin | Financial management |
| volunteer@church.com | Volunteer | Sunday School | Teaching assistance |
| guest@demo.com | Guest | None | Demo access |

**Password for all**: `demo123`

## Security Best Practices

1. **Always check permissions** before showing UI elements
2. **Validate access** on both client and server
3. **Filter data** based on user's departments
4. **Log access attempts** for audit trail
5. **Use secure sessions** (JWT tokens in production)
6. **Hash passwords** (bcrypt in production)
7. **Implement rate limiting** to prevent abuse
8. **Regular access reviews** to remove stale permissions

## Future Enhancements

- [ ] JWT token authentication
- [ ] Password hashing (bcrypt)
- [ ] Two-factor authentication (2FA)
- [ ] Audit logs for data access
- [ ] Time-based access (e.g., volunteers only on Sundays)
- [ ] IP allowlisting for admin accounts
- [ ] Session management and timeout
- [ ] Password policies and expiration
