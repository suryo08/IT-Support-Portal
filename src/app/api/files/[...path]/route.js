import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getObject } from '@/lib/storage';

export async function GET(req, { params }) {
  try {
    const { path } = await params;
    if (!path || path.length === 0) {
      return NextResponse.json({ detail: 'File path not provided' }, { status: 400 });
    }

    const fullPath = path.join('/');

    // Check if the pdf_path exists in active tutorials
    const res = await query(
      'SELECT * FROM tutorials WHERE pdf_path = $1 AND is_deleted = FALSE',
      [fullPath]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ detail: 'File not found' }, { status: 404 });
    }

    // Retrieve file from object storage
    try {
      const { data, contentType } = await getObject(fullPath);
      
      // Return binary response
      return new Response(data, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'inline'
        }
      });
    } catch (storageErr) {
      console.error('File retrieval from storage failed:', storageErr);
      return NextResponse.json({ detail: 'File retrieval failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('Serve file route error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
