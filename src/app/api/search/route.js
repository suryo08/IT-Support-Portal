import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { embedText } from '@/lib/gemini';

export async function POST(req) {
  try {
    const { query: searchQuery, limit = 10 } = await req.json();

    if (!searchQuery || !searchQuery.trim()) {
      return NextResponse.json([]);
    }

    const queryStr = searchQuery.trim();

    // Try vector search if Gemini is configured
    let embedding = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        embedding = await embedText(queryStr);
      } catch (err) {
        console.error('Vector search embedding failed, falling back to text search:', err);
      }
    }

    if (embedding) {
      // Perform cosine similarity search
      const sql = `
        SELECT id, title, category, content, pdf_path, cosine_similarity(embedding, $1) AS score
        FROM tutorials
        WHERE is_deleted = FALSE
        ORDER BY score DESC
        LIMIT $2
      `;
      const res = await query(sql, [embedding, limit]);
      
      const results = res.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        content: r.content,
        pdf_path: r.pdf_path,
        score: parseFloat(r.score) || 0.0
      }));
      return NextResponse.json(results);
    } else {
      // Fallback to keyword text search (ILIKE)
      const keyword = `%${queryStr}%`;
      const sql = `
        SELECT id, title, category, content, pdf_path
        FROM tutorials
        WHERE is_deleted = FALSE
        AND (title ILIKE $1 OR content ILIKE $1 OR category ILIKE $1)
        LIMIT $2
      `;
      const res = await query(sql, [keyword, limit]);

      const results = res.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        content: r.content,
        pdf_path: r.pdf_path,
        score: 0.5 // Default score for fallback keyword match
      }));
      return NextResponse.json(results);
    }
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json({ detail: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
