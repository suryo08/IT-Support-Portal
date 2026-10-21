import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getObject } from '@/lib/storage';

// In-memory buffer cache for fast repeat access (avoids ~550ms S3 latency per open)
const memoryCache = new Map();
const MAX_CACHE_ITEMS = 40;
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function getFromCache(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return item;
}

function setToCache(key, data, contentType) {
  if (memoryCache.size >= MAX_CACHE_ITEMS) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { data, contentType, timestamp: Date.now() });
}

export async function GET(req, { params }) {
  try {
    const { path } = await params;
    if (!path || path.length === 0) {
      return NextResponse.json({ detail: 'File path not provided' }, { status: 400 });
    }

    const fullPath = path.join('/');
    const cleanEtag = `"${Buffer.from(fullPath).toString('base64').substring(0, 27)}"`;

    // 1. Check HTTP 304 Not Modified
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch === cleanEtag) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': cleanEtag,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        }
      });
    }

    // 2. Check in-memory cache first (< 1ms)
    const cached = getFromCache(fullPath);
    if (cached) {
      return new Response(cached.data, {
        headers: {
          'Content-Type': cached.contentType || 'application/pdf',
          'Content-Disposition': 'inline',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'ETag': cleanEtag,
          'Accept-Ranges': 'bytes',
          'X-Cache': 'HIT-MEMORY'
        }
      });
    }

    // 3. Check if the pdf_path exists in active tutorials
    const res = await query(
      'SELECT id FROM tutorials WHERE pdf_path = $1 AND is_deleted = FALSE',
      [fullPath]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ detail: 'File not found' }, { status: 404 });
    }

    // 4. Retrieve file from object storage
    try {
      const { data, contentType } = await getObject(fullPath);
      
      // Store in memory cache for subsequent instant loads
      setToCache(fullPath, data, contentType);

      return new Response(data, {
        headers: {
          'Content-Type': contentType || 'application/pdf',
          'Content-Disposition': 'inline',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'ETag': cleanEtag,
          'Accept-Ranges': 'bytes',
          'X-Cache': 'MISS-S3'
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
