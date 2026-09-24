import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function POST(req, { params }) {
  try {
    const { id: tutorialId } = await params;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ detail: 'Format data tidak valid' }, { status: 400 });
    }

    const { helpful } = body || {};
    const isHelpful = Boolean(helpful);

    // Verify tutorial exists
    const checkRes = await query(
      'SELECT id, helpful_count, unhelpful_count FROM tutorials WHERE id = $1 AND is_deleted = FALSE',
      [tutorialId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ detail: 'Tutorial tidak ditemukan' }, { status: 404 });
    }

    // Insert record in tutorial_reviews
    const reviewId = crypto.randomUUID();
    await query(
      'INSERT INTO tutorial_reviews (id, tutorial_id, is_helpful) VALUES ($1, $2, $3)',
      [reviewId, tutorialId, isHelpful]
    );

    // Update count in tutorials
    if (isHelpful) {
      await query(
        'UPDATE tutorials SET helpful_count = COALESCE(helpful_count, 0) + 1 WHERE id = $1',
        [tutorialId]
      );
    } else {
      await query(
        'UPDATE tutorials SET unhelpful_count = COALESCE(unhelpful_count, 0) + 1 WHERE id = $1',
        [tutorialId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review berhasil dicatat. Terima kasih atas masukan Anda!'
    });
  } catch (err) {
    console.error('Record tutorial review error:', err);
    return NextResponse.json({ detail: 'Gagal mencatat review. Silakan coba lagi.' }, { status: 500 });
  }
}
