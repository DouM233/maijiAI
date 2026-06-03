/**
 * 钉钉扫码登录回调 API
 * 处理钉钉 OAuth 2.0 授权回调
 */
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { pool } = require('../../../../lib/db');

const DINGTALK_APP_KEY = process.env.DINGTALK_APP_KEY;
const DINGTALK_APP_SECRET = process.env.DINGTALK_APP_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || 'my-super-secret-key-2024-abcdef';

// 获取钉钉 access_token
async function getAccessToken() {
  const response = await axios.get('https://oapi.dingtalk.com/gettoken', {
    params: { appkey: DINGTALK_APP_KEY, appsecret: DINGTALK_APP_SECRET }
  });
  if (response.data.errcode !== 0) throw new Error(response.data.errmsg);
  return response.data.access_token;
}

// 通过 code 获取用户信息
async function getUserInfo(accessToken, code) {
  const response = await axios.get('https://oapi.dingtalk.com/v1/user/getuserinfo', {
    params: { access_token: accessToken, code: code }
  });
  if (response.data.errcode !== 0) throw new Error(response.data.errmsg);
  return response.data;
}

// 获取用户详细信息
async function getDingtalkUserDetail(accessToken, userid) {
  const response = await axios.get('https://oapi.dingtalk.com/v1/user/get', {
    params: { access_token: accessToken, userid: userid }
  });
  if (response.data.errcode !== 0) throw new Error(response.data.errmsg);
  return response.data;
}

// 生成 JWT token
function generateToken(userId) {
  return jwt.sign({ userId, timestamp: Date.now() }, SESSION_SECRET, { expiresIn: '7d' });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return Response.redirect(new URL('/?error=missing_code', request.url));
    }

    console.log('[钉钉登录] 收到回调，code:', code.substring(0, 10) + '...');

    // 1. 获取 access_token
    const accessToken = await getAccessToken();
    console.log('[钉钉登录] access_token 获取成功');

    // 2. 通过 code 获取用户信息
    const userInfo = await getUserInfo(accessToken, code);
    console.log('[钉钉登录] 用户信息获取成功, userid:', userInfo.userid);

    // 3. 获取用户详细信息
    const userDetail = await getDingtalkUserDetail(accessToken, userInfo.userid);
    console.log('[钉钉登录] 用户详情获取成功, name:', userDetail.name);

    // 4. 查找或创建用户
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE dingtalk_id = ?',
      [userInfo.userid]
    );

    let user;
    if (existingUsers.length === 0) {
      const userId = 'user-' + Date.now();
      await pool.execute(
        `INSERT INTO users (id, dingtalk_id, name, department, email, avatar_url, role, last_login)
         VALUES (?, ?, ?, ?, ?, ?, 'user', NOW())`,
        [userId, userInfo.userid, userDetail.name || '未知用户', userDetail.department || '', userDetail.email || '', userDetail.avatar || '']
      );
      const [newUsers] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
      user = newUsers[0];
      console.log('[钉钉登录] 新用户创建成功');
    } else {
      user = existingUsers[0];
      await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
      console.log('[钉钉登录] 已有用户登录');
    }

    // 5. 生成 token
    const token = generateToken(user.id);

    // 6. 重定向到成功页面
    const userData = JSON.stringify({
      id: user.id,
      name: user.name,
      department: user.department,
      email: user.email,
      role: user.role,
      avatar: user.avatar_url
    });

    const successUrl = new URL('/auth/success', request.url);
    successUrl.searchParams.set('token', token);
    successUrl.searchParams.set('user', encodeURIComponent(userData));

    return Response.redirect(successUrl);

  } catch (error) {
    console.error('[钉钉登录] 失败:', error.message);
    return Response.redirect(new URL('/?error=dingtalk_failed', request.url));
  }
}
