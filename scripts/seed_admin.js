import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    // 1. Ensure extensions and types exist
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BUYER', 'PRODUCTION_MANAGER', 'FINANCE', 'VIEWER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Ensure users table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(120) UNIQUE NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
        "role_title" VARCHAR(80),
        "avatar_url" VARCHAR(500),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Upsert default Admin User
    const adminEmail = 'admin@znkpacking.com.br';
    const adminPassword = 'admin'; // Senha: admin
    const adminName = 'Helena Zink (Admin)';
    const adminRoleTitle = 'Diretora & Administradora Geral';

    const res = await client.query(`
      INSERT INTO "users" ("name", "email", "password_hash", "role", "role_title", "is_active")
      VALUES (
        $1,
        $2,
        crypt($3, gen_salt('bf', 10)),
        'ADMIN',
        $4,
        true
      )
      ON CONFLICT ("email") 
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "password_hash" = crypt($3, gen_salt('bf', 10)),
        "role" = 'ADMIN',
        "role_title" = EXCLUDED."role_title",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING "id", "name", "email", "role", "role_title";
    `, [adminName, adminEmail, adminPassword, adminRoleTitle]);

    console.log('✅ Usuário Admin criado/atualizado com sucesso no Supabase:');
    console.log(res.rows[0]);

  } catch (err) {
    console.error('Erro ao criar usuário no Supabase:', err);
  } finally {
    await client.end();
  }
}

main();
