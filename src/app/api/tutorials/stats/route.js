import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !['admin', 'super_admin'].includes(user.role) || user.status !== 'approved') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 });
    }

    // 1. Total tutorials
    const totalRes = await query('SELECT COUNT(*) FROM tutorials WHERE is_deleted = FALSE');
    const total = parseInt(totalRes.rows[0].count, 10);

    // 2. Tutorials by category
    const categoryRes = await query(`
      SELECT category, COUNT(*) as count 
      FROM tutorials 
      WHERE is_deleted = FALSE 
      GROUP BY category 
      ORDER BY count DESC
    `);
    const byCategory = categoryRes.rows.map(r => ({
      category: r.category,
      count: parseInt(r.count, 10)
    }));

    // 3. Recent uploads (last 7 days)
    const recentRes = await query(`
      SELECT COUNT(*) 
      FROM tutorials 
      WHERE is_deleted = FALSE 
      AND created_at >= NOW() - INTERVAL '7 days'
    `);
    const recent = parseInt(recentRes.rows[0].count, 10);

    // 4. Site visits in the last 7 days
    const visitsRes = await query(`
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_id) as unique_devices
      FROM site_visits 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const visits7Days = parseInt(visitsRes.rows[0]?.total_visits || 0, 10);
    const uniqueDevices7Days = parseInt(visitsRes.rows[0]?.unique_devices || 0, 10);

    return NextResponse.json({
      total_tutorials: total,
      by_category: byCategory,
      recent_uploads: recent,
      visits_7_days: visits7Days,
      unique_devices_7_days: uniqueDevices7Days
    });
  } catch (err) {
    console.error('Tutorial stats error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
