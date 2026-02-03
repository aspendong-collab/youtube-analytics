import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function runMigrations() {
  const connectionString = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  console.log('🔗 Connecting to Neon database...');
  const maskedUrl = connectionString.replace(/\/\/[^@]+@/, '//***@');
  console.log('   ', maskedUrl);

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('\n🔄 Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigrations().catch(console.error);
