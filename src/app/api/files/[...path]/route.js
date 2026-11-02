import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getObject } from '@/lib/storage';

// In-memory buffer cache for fast repeat access of lightweight files (PDFs, icons, etc.)
const memoryCache = new Map();
const MAX_CACHE_ITEMS = 40;
const MAX_CACHE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB max per cached item to prevent RAM pressure
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
  if (data.length > MAX_CACHE_FILE_SIZE) return;
  if (memoryCache.size >= MAX_CACHE_ITEMS) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { data, contentType, timestamp: Date.now() });
}

function resolveContentType(path, serverType) {
  const ext = (path || '').split('.').pop()?.toLowerCase();
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'mkv') return 'video/x-matroska';
  if (ext === 'pdf') return 'application/pdf';
  return serverType || 'application/octet-stream';
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

    // 2. Check if file is in memory cache
    let dataBuffer = null;
    let finalContentType = null;
    const cached = getFromCache(fullPath);

    if (cached) {
      dataBuffer = cached.data;
      finalContentType = resolveContentType(fullPath, cached.contentType);
    } else {
      // 3. Check if the file path exists in active tutorials (PDF or Video)
      const res = await query(
        'SELECT id FROM tutorials WHERE (pdf_path = $1 OR video_path = $1) AND is_deleted = FALSE',
        [fullPath]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ detail: 'File not found' }, { status: 404 });
      }

      // 4. Retrieve file from object storage
      try {
        const { data, contentType } = await getObject(fullPath);
        dataBuffer = data;
        finalContentType = resolveContentType(fullPath, contentType);
        
        // Cache if reasonable size
        setToCache(fullPath, dataBuffer, finalContentType);
      } catch (storageErr) {
        console.error('File retrieval from storage failed:', storageErr);
        return NextResponse.json({ detail: 'File retrieval failed' }, { status: 500 });
      }
    }

    // 5. Handle HTTP Range Requests (Essential for Video seeking and iOS Safari playback)
    const rangeHeader = req.headers.get('range');
    const totalSize = dataBuffer.length;

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (isNaN(start) || start >= totalSize || end >= totalSize || start > end) {
        return new Response(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
          },
        });
      }

      const chunk = dataBuffer.subarray(start, end + 1);
      return new Response(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunk.length),
          'Content-Type': finalContentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'ETag': cleanEtag,
        },
      });
    }

    // Standard 200 OK response
    return new Response(dataBuffer, {
      headers: {
        'Content-Type': finalContentType,
        'Content-Disposition': 'inline',
        'Content-Length': String(totalSize),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'ETag': cleanEtag,
        'Accept-Ranges': 'bytes',
        'X-Cache': cached ? 'HIT-MEMORY' : 'MISS-S3'
      }
    });
  } catch (err) {
    console.error('Serve file route error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
