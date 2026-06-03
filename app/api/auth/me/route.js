/**
 * 获取当前登录用户信息
 */
const jwt = require('jsonwebtoken');
const { pool } = require('../../../../lib/db');

const SESSION_SECRET = process.env.SESSION_SECRET || 'my-super-secret-key-2024-abcdef';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: '未登录', loggedIn: false }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SESSION_SECRET);
    } catch (error) {
      return Response.json({ error: '登录已过期', loggedIn: false }, { status: 401 });
    }

    const [users] = await pool.execute(
      'SELECT id, name, department, email, avatar_url, role, last_login FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return Response.json({ error: '用户不存在', loggedIn: false }, { status: 404 });
    }

    const user = users[0];
    return Response.json({
      success: true,
      loggedIn: true,
      user: {
        id: user.id,
        name: user.name,
        department: user.department,
        email: user.email,
        role: user.role,
        avatar: user.avatar_url,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('[获取用户] 失败:', error.message);
    return Response.json({ error: '服务器错误', loggedIn: false }, { status: 500 });
  }
}
