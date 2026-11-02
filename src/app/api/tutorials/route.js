import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { putObject } from '@/lib/storage';
import { embedText } from '@/lib/gemini';
import { optimizePdfBuffer } from '@/lib/pdfOptimizer';

// GET all tutorials
export async function GET() {
  try {
    const res = await query(
      'SELECT id, title, category, content, pdf_path, video_path, created_at FROM tutorials WHERE is_deleted = FALSE ORDER BY created_at DESC'
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
    if (!user || !['admin', 'super_admin'].includes(user.role) || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get('title');
    const category = formData.get('category');
    const content = formData.get('content');
    const pdfFile = formData.get('pdf_file');
    const videoFile = formData.get('video_file');

    if (!title || !category || !content || !pdfFile) {
      return NextResponse.json({ detail: 'Judul, kategori, deskripsi, dan file PDF wajib diisi' }, { status: 400 });
    }

    const tutorialId = crypto.randomUUID();

    // Prepare PDF buffer and storage path
    let buffer;
    try {
      buffer = Buffer.from(await pdfFile.arrayBuffer());
    } catch (readErr) {
      console.error('Failed to read PDF buffer:', readErr);
      return NextResponse.json({ detail: 'Gagal membaca file PDF' }, { status: 400 });
    }

    const originalName = pdfFile.name || 'document.pdf';
    const ext = originalName.split('.').pop() || 'pdf';
    const storagePath = `it-support-portal/tutorials/${tutorialId}.${ext}`;

    // Optimize PDF before storage upload to ensure lightweight loading
    const optimizedBuffer = await optimizePdfBuffer(buffer);

    // Optional video upload task
    let videoPromise = Promise.resolve(null);
    if (videoFile && typeof videoFile.arrayBuffer === 'function' && videoFile.size > 0 && videoFile.name) {
      const videoExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
      const videoStoragePath = `it-support-portal/tutorials/${tutorialId}_video.${videoExt}`;
      const videoContentType = videoFile.type || `video/${videoExt === 'mov' ? 'quicktime' : videoExt}`;

      videoPromise = (async () => {
        const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
        const result = await putObject(videoStoragePath, videoBuffer, videoContentType);
        return result.path;
      })();
    }

    // Run S3 uploads and Gemini embedding concurrently
    let pdfPath = null;
    let videoPath = null;
    let embedding = null;

    try {
      const [storageResult, embeddingResult, uploadedVideoPath] = await Promise.all([
        putObject(storagePath, optimizedBuffer, 'application/pdf'),
        embedText(content).catch(embedErr => {
          console.error('Gemini embedding failed, using zero array:', embedErr);
          return null;
        }),
        videoPromise
      ]);

      pdfPath = storageResult.path;
      embedding = embeddingResult || new Array(768).fill(0.0);
      videoPath = uploadedVideoPath || null;
    } catch (uploadErr) {
      console.error('File upload to storage failed:', uploadErr);
      return NextResponse.json({ detail: 'Gagal mengunggah file ke penyimpanan cloud' }, { status: 500 });
    }

    // Save to DB
    const res = await query(`
      INSERT INTO tutorials (id, title, category, content, pdf_path, video_path, embedding, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, category, content, pdf_path, video_path, created_at
    `, [tutorialId, title, category, content, pdfPath, videoPath, embedding, user.id]);

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
