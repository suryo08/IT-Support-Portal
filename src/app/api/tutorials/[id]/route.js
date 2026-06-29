import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { putObject } from '@/lib/storage';
import { embedText } from '@/lib/gemini';

// PUT update tutorial
export async function PUT(req, { params }) {
  try {
    const { id: tutorialId } = await params;
    
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'admin' || user.status !== 'approved') {
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

    if (!title || !category || !content) {
      return NextResponse.json({ detail: 'Title, category, and content are required' }, { status: 400 });
    }

    // Generate new embedding
    let embedding = null;
    try {
      embedding = await embedText(content);
    } catch (embedErr) {
      console.error('Embedding generation failed during update:', embedErr);
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

    // Upload new PDF if provided
    if (pdfFile && pdfFile.name) {
      try {
        const buffer = Buffer.from(await pdfFile.arrayBuffer());
        const ext = pdfFile.name.split('.').pop() || 'pdf';
        const storagePath = `it-support-portal/tutorials/${tutorialId}.${ext}`;
        const storageResult = await putObject(storagePath, buffer, 'application/pdf');
        
        updateQuery += `, pdf_path = $${paramCounter}`;
        queryParams.push(storageResult.path);
        paramCounter++;
      } catch (uploadErr) {
        console.error('PDF update failed:', uploadErr);
        return NextResponse.json({ detail: 'PDF upload failed' }, { status: 500 });
      }
    }

    updateQuery += ` WHERE id = $${paramCounter} RETURNING id, title, category, content, pdf_path, created_at`;
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
    if (!user || user.role !== 'admin' || user.status !== 'approved') {
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
