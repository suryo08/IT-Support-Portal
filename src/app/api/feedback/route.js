import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET all feedbacks (Admin only)
export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !['admin', 'super_admin'].includes(user.role) || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    const res = await query(
      'SELECT id, name, contact, category, title, message, status, created_at FROM feedbacks ORDER BY created_at DESC'
    );

    const feedbacks = res.rows.map(f => ({
      ...f,
      created_at: f.created_at ? f.created_at.toISOString() : null
    }));

    const unreadCount = feedbacks.filter(f => f.status === 'unread').length;

    return NextResponse.json({
      feedbacks,
      unreadCount
    });
  } catch (err) {
    console.error('Fetch feedbacks error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

// POST new feedback (Public)
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, contact, category, title, message } = body;

    if (!name || !title || !message) {
      return NextResponse.json({ detail: 'Nama, judul, dan pesan wajib diisi' }, { status: 400 });
    }

    const feedbackId = crypto.randomUUID();
    const validCategory = category || 'request_tutorial';

    await query(
      `INSERT INTO feedbacks (id, name, contact, category, title, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'unread')`,
      [feedbackId, name.trim(), contact?.trim() || null, validCategory, title.trim(), message.trim()]
    );

    return NextResponse.json({
      success: true,
      message: 'Saran & masukan Anda berhasil dikirim. Terima kasih!'
    });
  } catch (err) {
    console.error('Create feedback error:', err);
    return NextResponse.json({ detail: 'Gagal mengirim saran. Silakan coba lagi nanti.' }, { status: 500 });
  }
}
