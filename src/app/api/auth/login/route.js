import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createAccessToken, createRefreshToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ detail: 'Email dan password harus diisi' }, { status: 400 });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Query user
    const res = await query('SELECT * FROM users WHERE email = $1', [emailNormalized]);
    if (res.rows.length === 0) {
      return NextResponse.json({ detail: 'Email atau password salah' }, { status: 401 });
    }

    const user = res.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ detail: 'Email atau password salah' }, { status: 401 });
    }

    // Check approval status
    if (user.status === 'pending') {
      return NextResponse.json({ detail: 'Akun Anda masih menunggu persetujuan dari administrator' }, { status: 403 });
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ detail: 'Akun Anda ditolak oleh administrator' }, { status: 403 });
    }

    // Create tokens
    const accessToken = createAccessToken(user.id, user.email);
    const refreshToken = createRefreshToken(user.id);

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    });

    // Set cookies
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: false, // In preview/local environment, false is fine
      sameSite: 'lax',
      maxAge: 900, // 15 mins in seconds
      path: '/'
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 604800, // 7 days in seconds
      path: '/'
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
