import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function checkConnection() {
  const connectionString = process.env.PGDATABASE_URL;

  if (!connectionString) {
    console.log('❌ PGDATABASE_URL is not set in environment variables');
    console.log('\nChecking other possible sources...');

    // Check if .env.local file exists
    const fs = require('fs');
    try {
      const envContent = fs.readFileSync('.env.local', 'utf-8');
      const match = envContent.match(/PGDATABASE_URL=(.+)/);
      if (match) {
        console.log('✅ Found in .env.local:');
        console.log('   ', match[1].replace(/\/\/[^@]+@/, '//***@'));
      }
    } catch (e) {
      console.log('❌ .env.local file not found');
    }
  } else {
    console.log('✅ PGDATABASE_URL is set in environment variables');
    const masked = connectionString.replace(/\/\/[^@]+@/, '//***@');
    console.log('   ', masked);

    // Test connection
    console.log('\n🔗 Testing connection...');
    const client = postgres(connectionString);
    try {
      const result = await client`SELECT 1`;
      console.log('✅ Connection successful');

      // Get database name
      const dbInfo = await client`SELECT current_database()`;
      console.log('📊 Database:', dbInfo[0].current_database);

      // List users
      const users = await client`
        SELECT email, name, role, status
        FROM users
        LIMIT 5
      `;
      console.log('\n👥 Users in database:');
      users.forEach((user: any) => {
        console.log(`  - ${user.email} (${user.name}) - ${user.role}/${user.status}`);
      });

    } catch (error) {
      console.error('❌ Connection failed:', error);
    } finally {
      await client.end();
    }
  }
}

checkConnection();
