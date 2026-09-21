import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// PATCH update feedback status (e.g. read / unread)
export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !['admin', 'super_admin'].includes(user.role) || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['read', 'unread'].includes(status)) {
      return NextResponse.json({ detail: 'Status tidak valid' }, { status: 400 });
    }

    await query('UPDATE feedbacks SET status = $1 WHERE id = $2', [status, id]);

    return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (err) {
    console.error('Update feedback error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

// DELETE feedback
export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !['admin', 'super_admin'].includes(user.role) || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    await query('DELETE FROM feedbacks WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Pesan berhasil dihapus' });
  } catch (err) {
    console.error('Delete feedback error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
