// Setup script to create demo users in MongoDB
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const demoUsers = [
  {
    id: 'user_admin_001',
    email: 'admin@church.com',
    name: 'Church Administrator',
    role: 'super_admin',
    departments: ['all'],
    permissions: [
      'attendance:read', 'attendance:write', 'attendance:delete',
      'arrangements:read', 'arrangements:write', 'arrangements:delete',
      'documents:read', 'documents:write', 'documents:delete',
      'bookkeeper:read', 'bookkeeper:write', 'bookkeeper:delete',
      'whatsapp:read', 'whatsapp:write',
      'users:read', 'users:write', 'users:delete',
      'settings:read', 'settings:write'
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user_pastor_001',
    email: 'pastor@church.com',
    name: 'Senior Pastor',
    role: 'senior_pastor',
    departments: ['all'],
    permissions: [
      'attendance:read', 'attendance:write',
      'arrangements:read', 'arrangements:write',
      'documents:read', 'documents:write',
      'bookkeeper:read',
      'whatsapp:read', 'whatsapp:write',
      'users:read'
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user_youth_001',
    email: 'youth.pastor@church.com',
    name: 'Youth Pastor',
    role: 'pastor',
    departments: ['youth', 'sunday_school'],
    permissions: [
      'attendance:read', 'attendance:write',
      'arrangements:read', 'arrangements:write',
      'documents:read', 'documents:write',
      'whatsapp:read', 'whatsapp:write'
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user_bookkeeper_001',
    email: 'bookkeeper@church.com',
    name: 'Church Bookkeeper',
    role: 'admin_staff',
    departments: ['finance', 'administration'],
    permissions: [
      'arrangements:read', 'arrangements:write',
      'documents:read', 'documents:write', 'documents:delete',
      'bookkeeper:read', 'bookkeeper:write'
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user_volunteer_001',
    email: 'volunteer@church.com',
    name: 'Sunday School Volunteer',
    role: 'volunteer',
    departments: ['sunday_school'],
    permissions: [
      'attendance:read',
      'arrangements:read',
      'documents:read'
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user_guest_001',
    email: 'guest@demo.com',
    name: 'Guest User',
    role: 'guest',
    departments: [],
    permissions: [
      'attendance:read',
      'arrangements:read'
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function setupDemoUsers() {
  console.log('🔧 Setting up demo users in MongoDB...\n');

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ ERROR: MONGODB_URI not found in .env.local');
    return;
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db('churchadmin');
    const usersCollection = db.collection('users');

    // Check if users already exist
    const existingCount = await usersCollection.countDocuments();

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing users.`);
      console.log('Would you like to:');
      console.log('  1. Keep existing users (do nothing)');
      console.log('  2. Delete and recreate all users\n');
      console.log('For now, keeping existing users...\n');

      const users = await usersCollection.find({}).toArray();
      console.log('📋 Current users:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    } else {
      // Insert demo users
      console.log('📝 Creating demo users...\n');
      await usersCollection.insertMany(demoUsers);

      console.log('✅ Created 6 demo users:\n');
      demoUsers.forEach(user => {
        console.log(`   ✓ ${user.email}`);
        console.log(`     Role: ${user.role}`);
        console.log(`     Departments: ${user.departments.join(', ')}`);
        console.log('');
      });

      console.log('🔑 All users use password: demo123\n');
    }

    await client.close();

    console.log('✅ Setup complete!');
    console.log('\n📝 You can now log in with any of these accounts:');
    console.log('   - admin@church.com (Full access)');
    console.log('   - pastor@church.com (All departments)');
    console.log('   - youth.pastor@church.com (Youth only)');
    console.log('   - bookkeeper@church.com (Finance only)');
    console.log('   - volunteer@church.com (Read-only)');
    console.log('   - guest@demo.com (Demo access)');
    console.log('\n   Password for all: demo123');

  } catch (error) {
    console.error('\n❌ Setup failed!');
    console.error('Error:', error.message);
  }
}

setupDemoUsers();
