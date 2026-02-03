import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

async function createUsersTableAndAdmin() {
  const connectionString = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  console.log('🔗 Connecting to Neon database...');
  const maskedUrl = connectionString.replace(/\/\/[^@]+@/, '//***@');
  console.log('   ', maskedUrl);

  const client = postgres(connectionString);

  try {
    // 1. 创建 users 表
    console.log('\n📝 Creating users table...');
    await client`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password" varchar(255) NOT NULL,
        "name" varchar(100) NOT NULL,
        "role" varchar(20) DEFAULT 'user' NOT NULL,
        "status" varchar(20) DEFAULT 'pending' NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone,
        "last_login_at" timestamp with time zone
      )
    `;
    console.log('✅ Users table created');

    // 2. 创建索引
    console.log('\n📝 Creating indexes...');
    await client`
      CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email")
    `;
    await client`
      CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users" USING btree ("status")
    `;
    await client`
      CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role")
    `;
    console.log('✅ Indexes created');

    // 3. 添加外键约束（如果 videos 表存在）
    console.log('\n📝 Adding foreign key constraint...');
    try {
      await client`
        ALTER TABLE "videos"
        ADD CONSTRAINT IF NOT EXISTS "videos_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action
      `;
      console.log('✅ Foreign key constraint added');
    } catch (e: any) {
      if (e.code === '42704') {
        console.log('⚠️  videos table does not have user_id column, skipping foreign key');
      } else {
        console.log('⚠️  Could not add foreign key:', e.message);
      }
    }

    // 4. 检查是否已有管理员
    const existingAdmin = await client`
      SELECT id FROM users WHERE email = 'admin@example.com'
    `;

    if (existingAdmin.length > 0) {
      console.log('\n✅ Admin account already exists');
    } else {
      // 5. 创建管理员账号
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

    // 6. 验证结果
    console.log('\n📊 Verifying results...');
    const users = await client`
      SELECT email, name, role, status FROM users
    `;
    console.log('👥 Total users:', users.length);
    users.forEach((user: any) => {
      console.log(`   - ${user.email} (${user.name}) - ${user.role}/${user.status}`);
    });

    const tables = await client`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `;
    console.log('\n📋 All tables:');
    tables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n✅ Setup completed successfully!');
    console.log('\n🔐 Admin credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123456');
    console.log('\n🚀 You can now login to https://youtube-analytics-opal.vercel.app/login');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

createUsersTableAndAdmin().catch(console.error);
