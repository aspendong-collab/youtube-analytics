import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import bcrypt from 'bcryptjs';

async function migrateAndSeed() {
  const connectionString = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  console.log('🔗 Connecting to Neon database...');
  const maskedUrl = connectionString.replace(/\/\/[^@]+@/, '//***@');
  console.log('   ', maskedUrl);

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // 1. 运行数据库迁移
    console.log('\n🔄 Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed');

    // 2. 检查是否已有管理员账号
    const existingAdmin = await client`
      SELECT id FROM users WHERE email = 'admin@example.com'
    `;

    if (existingAdmin.length > 0) {
      console.log('\n✅ Admin account already exists');
    } else {
      // 3. 创建管理员账号
      console.log('\n👤 Creating admin account...');
      const hashedPassword = await bcrypt.hash('admin123456', 10);

      await client`
        INSERT INTO users (id, email, password, name, role, status, is_active, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          'admin@example.com',
          ${hashedPassword},
          '系统管理员',
          'admin',
          'approved',
          true,
          NOW(),
          NOW()
        )
      `;
      console.log('✅ Admin account created');
    }

    // 4. 验证数据
    console.log('\n📊 Verifying database...');
    const users = await client`
      SELECT email, name, role, status FROM users
    `;
    console.log('👥 Users:', users.length);
    users.forEach((user: any) => {
      console.log(`   - ${user.email} (${user.name}) - ${user.role}/${user.status}`);
    });

    const tables = await client`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `;
    console.log('📋 Tables:', tables.length);
    tables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n🔐 Admin credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123456');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrateAndSeed().catch(console.error);
