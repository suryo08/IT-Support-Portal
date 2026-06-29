import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ detail: 'Data registrasi tidak lengkap' }, { status: 400 });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Check if user exists
    const checkRes = await query('SELECT * FROM users WHERE email = $1', [emailNormalized]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ detail: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Insert user
    await query(`
      INSERT INTO users (id, email, password_hash, name, role, status)
      VALUES ($1, $2, $3, $4, 'admin', 'pending')
    `, [userId, emailNormalized, passwordHash, name]);

    // Construct approval link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const approvalLink = `${appUrl}/api/auth/approve/${userId}`;

    console.log(`New admin registration: ${emailNormalized} (ID: ${userId})`);
    console.log(`Approval needed by: gilang.suryo@chitraparatama.co.id`);
    console.log(`Approval link: ${approvalLink}`);

    return NextResponse.json({
      message: 'Registrasi berhasil! Akun Anda menunggu persetujuan dari administrator.',
      status: 'pending',
      user_id: userId
    });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
