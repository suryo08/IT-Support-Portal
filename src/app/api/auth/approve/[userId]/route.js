import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ message: 'User ID not provided' }, { status: 400 });
    }

    const res = await query(
      "UPDATE users SET status = 'approved', approved_at = NOW() WHERE id = $1",
      [userId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User berhasil disetujui! User sekarang dapat login.' });
  } catch (err) {
    console.error('Simple approval link error:', err);
    return NextResponse.json({ message: `Error: ${err.message}` }, { status: 500 });
  }
}
