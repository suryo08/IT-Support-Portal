import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'super_admin' || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Super Admin access required' }, { status: 403 });
    }

    const res = await query(`
      SELECT id, email, name, role, status, created_at, approved_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    const users = res.rows.map(u => ({
      ...u,
      created_at: u.created_at ? u.created_at.toISOString() : null,
      approved_at: u.approved_at ? u.approved_at.toISOString() : null
    }));

    return NextResponse.json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'super_admin' || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Super Admin access required' }, { status: 403 });
    }

    const { user_id, role } = await req.json();

    if (!user_id || !role) {
      return NextResponse.json({ detail: 'User ID and Role are required' }, { status: 400 });
    }

    if (!['super_admin', 'admin'].includes(role)) {
      return NextResponse.json({ detail: 'Invalid role' }, { status: 400 });
    }

    if (user_id === user.id) {
      return NextResponse.json({ detail: 'Anda tidak dapat mengubah peran Anda sendiri' }, { status: 400 });
    }

    const res = await query('UPDATE users SET role = $1 WHERE id = $2', [role, user_id]);

    if (res.rowCount === 0) {
      return NextResponse.json({ detail: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Peran user berhasil diperbarui' });
  } catch (err) {
    console.error('Update user role error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'super_admin' || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('id');

    if (!targetUserId) {
      return NextResponse.json({ detail: 'User ID required' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ detail: 'Anda tidak dapat menghapus akun Anda sendiri' }, { status: 400 });
    }

    const res = await query('DELETE FROM users WHERE id = $1', [targetUserId]);

    if (res.rowCount === 0) {
      return NextResponse.json({ detail: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
