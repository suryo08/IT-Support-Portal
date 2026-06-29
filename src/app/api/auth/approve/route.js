import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    const { user_id, approved } = await req.json();

    if (!user_id) {
      return NextResponse.json({ detail: 'User ID required' }, { status: 400 });
    }

    const status = approved ? 'approved' : 'rejected';

    const res = await query(
      'UPDATE users SET status = $1, approved_at = NOW() WHERE id = $2',
      [status, user_id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ detail: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `User ${status} successfully` });
  } catch (err) {
    console.error('Approve user error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
