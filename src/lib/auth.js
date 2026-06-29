import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

export function createAccessToken(userId, email) {
  return jwt.sign(
    { sub: userId, email, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function createRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function getCurrentUser(req) {
  // Try to get token from cookies or Authorization header
  let token = null;

  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = {};
  cookieHeader.split(';').forEach(c => {
    const parts = c.split('=');
    if (parts.length === 2) {
      cookies[parts[0].trim()] = parts[1].trim();
    }
  });

  token = cookies['access_token'];

  if (!token) {
    const authHeader = req.headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      return null;
    }

    const res = await query('SELECT id, email, name, role, status FROM users WHERE email = $1', [decoded.email]);
    if (res.rows.length === 0) {
      return null;
    }

    return res.rows[0];
  } catch (err) {
    return null;
  }
}
