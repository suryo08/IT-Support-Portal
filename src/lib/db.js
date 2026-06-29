import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://gilang:gilang1234@31.97.187.38:999/gilang';

const pool = new Pool({
  connectionString,
  ssl: false
});

let isInitialized = false;

export async function query(text, params) {
  await initDb();
  return pool.query(text, params);
}

export async function initDb() {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    console.log('Initializing database schema...');

    // 1. Create cosine_similarity helper function if not exists
    await client.query(`
      CREATE OR REPLACE FUNCTION cosine_similarity(a double precision[], b double precision[])
      RETURNS double precision AS $$
      DECLARE
        dot_product double precision := 0;
        norm_a double precision := 0;
        norm_b double precision := 0;
        i integer;
      BEGIN
        IF array_length(a, 1) IS NULL OR array_length(b, 1) IS NULL OR array_length(a, 1) <> array_length(b, 1) THEN
          RETURN 0;
        END IF;
        FOR i IN 1..array_length(a, 1) LOOP
          dot_product := dot_product + a[i] * b[i];
          norm_a := norm_a + a[i] * a[i];
          norm_b := norm_b + b[i] * b[i];
        END LOOP;
        IF norm_a = 0 OR norm_b = 0 THEN
          RETURN 0;
        END IF;
        RETURN dot_product / (sqrt(norm_a) * sqrt(norm_b));
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `);
    console.log('PL/pgSQL cosine_similarity function verified.');

    // 2. Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('users table verified.');

    // 3. Create tutorials table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tutorials (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        pdf_path VARCHAR(512),
        embedding double precision[],
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      );
    `);
    console.log('tutorials table verified.');

    // 4. Seed default admin account
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@itsupport.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = 'Admin IT';

    const checkAdmin = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (checkAdmin.rows.length === 0) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      const adminId = 'default-admin-id';
      await client.query(`
        INSERT INTO users (id, email, password_hash, name, role, status, approved_at)
        VALUES ($1, $2, $3, $4, 'admin', 'approved', NOW())
      `, [adminId, adminEmail, hashed, adminName]);
      console.log(`Default admin account seeded: ${adminEmail}`);
    } else {
      const admin = checkAdmin.rows[0];
      const match = await bcrypt.compare(adminPassword, admin.password_hash);
      if (!match) {
        const hashed = await bcrypt.hash(adminPassword, 10);
        await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashed, adminEmail]);
        console.log('Admin password updated based on configuration');
      }
    }

    isInitialized = true;
    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
