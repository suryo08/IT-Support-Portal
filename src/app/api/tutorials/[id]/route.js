import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { putObject } from '@/lib/storage';
import { embedText } from '@/lib/gemini';
import { optimizePdfBuffer } from '@/lib/pdfOptimizer';

// GET single tutorial
export async function GET(req, { params }) {
  try {
    const { id: tutorialId } = await params;
    const res = await query(
      'SELECT id, title, category, content, pdf_path, video_path, created_at FROM tutorials WHERE id = $1 AND is_deleted = FALSE',
      [tutorialId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ detail: 'Tutorial not found' }, { status: 404 });
    }

    const t = res.rows[0];
    return NextResponse.json({
      ...t,
      created_at: t.created_at ? t.created_at.toISOString() : null
    });
  } catch (err) {
    console.error('Get tutorial error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

// PUT update tutorial
export async function PUT(req, { params }) {
  try {
    const { id: tutorialId } = await params;
    
    const user = await getCurrentUser(req);
    if (!user || !['admin', 'super_admin'].includes(user.role) || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    // Check if tutorial exists
    const checkRes = await query('SELECT * FROM tutorials WHERE id = $1 AND is_deleted = FALSE', [tutorialId]);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ detail: 'Tutorial not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const title = formData.get('title');
    const category = formData.get('category');
    const content = formData.get('content');
    const pdfFile = formData.get('pdf_file');
    const videoFile = formData.get('video_file');
    const removeVideo = formData.get('remove_video') === 'true';

    if (!title || !category || !content) {
      return NextResponse.json({ detail: 'Judul, kategori, dan deskripsi wajib diisi' }, { status: 400 });
    }

    // Prepare asynchronous tasks: embedding, optional PDF upload, optional Video upload
    const tasks = [
      embedText(content).catch(embedErr => {
        console.error('Embedding generation failed during update:', embedErr);
        return null;
      })
    ];

    const hasNewPdf = pdfFile && pdfFile.name && pdfFile.size > 0;
    if (hasNewPdf) {
      const uploadPdfTask = (async () => {
        const buffer = Buffer.from(await pdfFile.arrayBuffer());
        const optimizedBuffer = await optimizePdfBuffer(buffer);
        const ext = pdfFile.name.split('.').pop() || 'pdf';
        const storagePath = `it-support-portal/tutorials/${tutorialId}.${ext}`;
        return putObject(storagePath, optimizedBuffer, 'application/pdf');
      })();
      tasks.push(uploadPdfTask);
    } else {
      tasks.push(Promise.resolve(null));
    }

    const hasNewVideo = videoFile && typeof videoFile.arrayBuffer === 'function' && videoFile.size > 0 && videoFile.name;
    if (hasNewVideo) {
      const uploadVideoTask = (async () => {
        const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
        const videoExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const videoStoragePath = `it-support-portal/tutorials/${tutorialId}_video.${videoExt}`;
        const videoContentType = videoFile.type || `video/${videoExt === 'mov' ? 'quicktime' : videoExt}`;
        const result = await putObject(videoStoragePath, videoBuffer, videoContentType);
        return result.path;
      })();
      tasks.push(uploadVideoTask);
    } else {
      tasks.push(Promise.resolve(null));
    }

    let embedding = null;
    let storageResult = null;
    let newVideoPath = null;

    try {
      const results = await Promise.all(tasks);
      embedding = results[0];
      storageResult = results[1];
      newVideoPath = results[2];
    } catch (uploadErr) {
      console.error('File update failed:', uploadErr);
      return NextResponse.json({ detail: 'Gagal mengunggah file baru' }, { status: 500 });
    }

    // Prepare update parameters
    let updateQuery = `
      UPDATE tutorials 
      SET title = $1, category = $2, content = $3
    `;
    const queryParams = [title, category, content];
    let paramCounter = 4;

    if (embedding) {
      updateQuery += `, embedding = $${paramCounter}`;
      queryParams.push(embedding);
      paramCounter++;
    }

    if (storageResult && storageResult.path) {
      updateQuery += `, pdf_path = $${paramCounter}`;
      queryParams.push(storageResult.path);
      paramCounter++;
    }

    if (newVideoPath) {
      updateQuery += `, video_path = $${paramCounter}`;
      queryParams.push(newVideoPath);
      paramCounter++;
    } else if (removeVideo) {
      updateQuery += `, video_path = NULL`;
    }

    updateQuery += ` WHERE id = $${paramCounter} RETURNING id, title, category, content, pdf_path, video_path, created_at`;
    queryParams.push(tutorialId);

    const updateRes = await query(updateQuery, queryParams);
    const updatedTutorial = updateRes.rows[0];

    return NextResponse.json({
      ...updatedTutorial,
      created_at: updatedTutorial.created_at ? updatedTutorial.created_at.toISOString() : null
    });
  } catch (err) {
    console.error('Update tutorial error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

// DELETE soft delete tutorial
export async function DELETE(req, { params }) {
  try {
    const { id: tutorialId } = await params;
    
    const user = await getCurrentUser(req);
    if (!user || !['admin', 'super_admin'].includes(user.role) || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    const res = await query(
      'UPDATE tutorials SET is_deleted = TRUE WHERE id = $1',
      [tutorialId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ detail: 'Tutorial not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tutorial deleted successfully' });
  } catch (err) {
    console.error('Delete tutorial error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
