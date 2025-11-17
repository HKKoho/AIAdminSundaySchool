// Quick test script to verify MongoDB connection
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...\n');

  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('USERNAME') || uri.includes('PASSWORD')) {
    console.error('❌ ERROR: Please update MONGODB_URI in .env.local with your actual credentials!');
    console.log('\nYour current MONGODB_URI looks incomplete.');
    console.log('Make sure you replaced USERNAME and PASSWORD with real values.\n');
    return;
  }

  console.log('📝 Connection string format looks good!\n');

  try {
    const client = new MongoClient(uri);

    console.log('🔌 Attempting to connect...');
    await client.connect();

    console.log('✅ Connected successfully to MongoDB Atlas!\n');

    // Get database
    const db = client.db('churchadmin');
    console.log('📂 Database: churchadmin');

    // List existing collections
    const collections = await db.listCollections().toArray();
    console.log(`📊 Existing collections: ${collections.length}`);

    if (collections.length > 0) {
      console.log('   Collections:');
      collections.forEach(col => console.log(`   - ${col.name}`));
    } else {
      console.log('   (No collections yet - they will be created when you save data)');
    }

    await client.close();
    console.log('\n✅ Connection test completed successfully!');
    console.log('\n🎉 Your database is ready to use!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your app: npm run dev');
    console.log('   2. Log in with: guest@demo.com / demo123');
    console.log('   3. Try saving attendance - it will create the collection!');

  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your username and password in .env.local');
    console.log('2. Verify Network Access is set to 0.0.0.0/0 in MongoDB Atlas');
    console.log('3. Make sure your cluster is fully deployed (not in "Creating" status)');
    console.log('4. Check if the database name is "churchadmin" in the connection string\n');
  }
}

testConnection();
