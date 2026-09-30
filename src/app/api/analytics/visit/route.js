import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const visitorId = body.visitor_id || body.deviceId || 'anonymous';
    const path = (body.path || '/').substring(0, 255);

    // Get client IP and User-Agent
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');
    const userAgent = (req.headers.get('user-agent') || '').substring(0, 500);

    // Throttle check: avoid counting rapid page refreshes from the same visitor within 15 minutes
    if (visitorId !== 'anonymous') {
      const recentCheck = await query(`
        SELECT id FROM site_visits
        WHERE visitor_id = $1
        AND created_at >= NOW() - INTERVAL '15 minutes'
        LIMIT 1
      `, [visitorId]);

      if (recentCheck.rows.length > 0) {
        return NextResponse.json({ success: true, throttled: true });
      }
    }

    const visitId = crypto.randomUUID();
    await query(`
      INSERT INTO site_visits (id, visitor_id, path, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [visitId, visitorId, path, ipAddress, userAgent]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Track visit error:', err);
    return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
  }
}
