import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { putObject } from '@/lib/storage';
import { embedText } from '@/lib/gemini';

// GET all tutorials
export async function GET() {
  try {
    const res = await query(
      'SELECT id, title, category, content, pdf_path, created_at FROM tutorials WHERE is_deleted = FALSE ORDER BY created_at DESC'
    );

    const tutorials = res.rows.map(t => ({
      ...t,
      created_at: t.created_at ? t.created_at.toISOString() : null
    }));

    return NextResponse.json(tutorials);
  } catch (err) {
    console.error('Fetch tutorials error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

// POST create tutorial
export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get('title');
    const category = formData.get('category');
    const content = formData.get('content');
    const pdfFile = formData.get('pdf_file');

    if (!title || !category || !content || !pdfFile) {
      return NextResponse.json({ detail: 'Semua field wajib diisi' }, { status: 400 });
    }

    const tutorialId = crypto.randomUUID();

    // Read PDF file data
    let pdfPath = null;
    try {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const originalName = pdfFile.name || 'document.pdf';
      const ext = originalName.split('.').pop() || 'pdf';
      const storagePath = `it-support-portal/tutorials/${tutorialId}.${ext}`;
      
      const storageResult = await putObject(storagePath, buffer, 'application/pdf');
      pdfPath = storageResult.path;
    } catch (uploadErr) {
      console.error('PDF upload failed:', uploadErr);
      return NextResponse.json({ detail: 'PDF upload failed' }, { status: 500 });
    }

    // Generate embedding
    let embedding = null;
    try {
      embedding = await embedText(content);
    } catch (embedErr) {
      console.error('Gemini embedding failed, using zero array:', embedErr);
    }

    if (!embedding) {
      embedding = new Array(768).fill(0.0);
    }

    // Save to DB
    const res = await query(`
      INSERT INTO tutorials (id, title, category, content, pdf_path, embedding, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, category, content, pdf_path, created_at
    `, [tutorialId, title, category, content, pdfPath, embedding, user.id]);

    const newTutorial = res.rows[0];
    return NextResponse.json({
      ...newTutorial,
      created_at: newTutorial.created_at ? newTutorial.created_at.toISOString() : null
    });
  } catch (err) {
    console.error('Create tutorial error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
