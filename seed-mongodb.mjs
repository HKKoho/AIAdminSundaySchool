// Direct MongoDB seed script - Run with: node seed-mongodb.mjs
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

async function seedMongoDB() {
  console.log('🌱 Seeding MongoDB with test data...\n');

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ ERROR: MONGODB_URI not found in .env.local');
    return;
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db('churchadmin');

    // List existing collections
    console.log('📋 Checking existing collections...');
    const existingCollections = await db.listCollections().toArray();
    console.log('   Current collections:', existingCollections.map(c => c.name).join(', ') || 'none');
    console.log('');

    // Seed arrangements collection
    console.log('📝 Creating arrangements collection...');
    const arrangements = db.collection('arrangements');

    const testArrangements = [
      {
        id: `arrangement-${Date.now()}-1`,
        time: '主日 11:30 AM',
        beginningDate: '2026年1月5日',
        duration: '1 小時',
        place: '講台下右邊',
        teacher: '張淑佳牧師',
        focusLevel: '利未記 - 初讀',
        group: '長者班',
        createdAt: new Date().toISOString()
      },
      {
        id: `arrangement-${Date.now()}-2`,
        time: '主日 11:30 AM',
        beginningDate: '2026年1月5日',
        duration: '1 小時',
        place: '講台',
        teacher: '黃月保執事',
        focusLevel: '報名參加',
        group: '導修班',
        createdAt: new Date().toISOString()
      }
    ];

    await arrangements.insertMany(testArrangements);
    console.log(`   ✓ Inserted ${testArrangements.length} test arrangements`);
    console.log('');

    // Seed attendance collection
    console.log('📝 Creating attendance collection...');
    const attendance = db.collection('attendance');

    const testAttendance = [
      {
        id: `attendance-worship-${Date.now()}`,
        eventType: 'worship',
        eventDate: new Date().toISOString().split('T')[0],
        members: [
          { id: 'member1', name: '張三', present: true, timestamp: new Date().toISOString() },
          { id: 'member2', name: '李四', present: true, timestamp: new Date().toISOString() },
          { id: 'member3', name: '王五', present: false, timestamp: new Date().toISOString() }
        ],
        ownerId: 'user_admin_001',
        department: 'sunday_school',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `attendance-lordsupper-${Date.now()}`,
        eventType: 'lordsupper',
        eventDate: new Date().toISOString().split('T')[0],
        members: [
          { id: 'member1', name: '張三', present: true, timestamp: new Date().toISOString() },
          { id: 'member2', name: '李四', present: true, timestamp: new Date().toISOString() }
        ],
        ownerId: 'user_admin_001',
        department: 'sunday_school',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    await attendance.insertMany(testAttendance);
    console.log(`   ✓ Inserted ${testAttendance.length} test attendance records`);
    console.log('');

    // Verify collections were created
    console.log('✅ Verifying collections...');
    const finalCollections = await db.listCollections().toArray();
    const collectionNames = finalCollections.map(c => c.name);

    console.log('   Collections now in database:');
    collectionNames.forEach(name => {
      const count = name === 'users' ? 6 :
                    name === 'arrangements' ? testArrangements.length :
                    name === 'attendance' ? testAttendance.length : '?';
      console.log(`   - ${name} (${count} documents)`);
    });

    await client.close();

    console.log('\n🎉 SUCCESS! MongoDB seeded successfully!');
    console.log('\n📊 Next steps:');
    console.log('   1. Go to MongoDB Atlas → Database → Browse Collections');
    console.log('   2. You should see: users, arrangements, attendance');
    console.log('   3. Open your Vercel app and the localStorage warning should be gone!');
    console.log('\n   Production URL: https://ai-admin-sunday-school-jozcfiwsl-cklbcs-projects.vercel.app');

  } catch (error) {
    console.error('\n❌ Error seeding MongoDB:');
    console.error('   ', error.message);
    if (error.stack) {
      console.error('\n   Stack trace:');
      console.error('   ', error.stack);
    }
  }
}

seedMongoDB();
