import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    const res = await query(`
      SELECT id, email, name, role, status, created_at 
      FROM users 
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `);

    const users = res.rows.map(u => ({
      ...u,
      created_at: u.created_at ? u.created_at.toISOString() : null
    }));

    return NextResponse.json(users);
  } catch (err) {
    console.error('Pending users error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
