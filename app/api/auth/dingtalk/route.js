import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { pool } from "../../../../lib/db";

export const runtime = "nodejs";

const APP_KEY = process.env.DINGTALK_APP_KEY;
const APP_SECRET = process.env.DINGTALK_APP_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || "my-super-secret-key-2024-abcdef";
const APP_URL = process.env.APP_URL || "http://121.43.251.177";

function generateToken(userId) {
  return jwt.sign({ userId, timestamp: Date.now() }, SESSION_SECRET, { expiresIn: "7d" });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return Response.redirect(APP_URL + "/?error=missing_code");
    }

    console.log("[钉钉登录] 收到回调, code:", code.substring(0, 10) + "...");

    // 1. 用 code 换取用户 accessToken（新版 OAuth 2.0）
    const tokenRes = await fetch("https://api.dingtalk.com/v1.0/oauth2/userAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: APP_KEY,
        clientSecret: APP_SECRET,
        code: code,
        grantType: "authorization_code"
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[钉钉登录] 获取 userAccessToken 失败:", err);
      return Response.redirect(APP_URL + "/?error=token_failed");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.accessToken;
    console.log("[钉钉登录] accessToken 获取成功");

    // 2. 用 accessToken 获取用户信息
    const userRes = await fetch("https://api.dingtalk.com/v1.0/contact/users/me", {
      headers: { "x-acs-dingtalk-access-token": accessToken }
    });

    if (!userRes.ok) {
      const err = await userRes.text();
      console.error("[钉钉登录] 获取用户信息失败:", err);
      return Response.redirect(APP_URL + "/?error=userinfo_failed");
    }

    const userInfo = await userRes.json();
    console.log("[钉钉登录] 用户信息:", userInfo.nick, userInfo.unionId);

    const dingtalkId = userInfo.unionId || userInfo.openId || ("dd-" + Date.now());
    const userName = userInfo.nick || "钉钉用户";
    const userEmail = userInfo.email || "";
    const userAvatar = userInfo.avatarUrl || "";

    // 3. 查找或创建用户
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE dingtalk_id = ?",
      [dingtalkId]
    );

    let user;
    if (existingUsers.length === 0) {
      const userId = "user-" + Date.now();
      await pool.execute(
        "INSERT INTO users (id, dingtalk_id, name, department, email, avatar_url, role, last_login) VALUES (?, ?, ?, ?, ?, ?, 'user', NOW())",
        [userId, dingtalkId, userName, "", userEmail, userAvatar]
      );
      const [newUsers] = await pool.execute("SELECT * FROM users WHERE id = ?", [userId]);
      user = newUsers[0];
      console.log("[钉钉登录] 新用户创建:", userName);
    } else {
      user = existingUsers[0];
      await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);
      console.log("[钉钉登录] 已有用户登录:", user.name);
    }

    // 4. 生成 JWT 并跳转
    const token = generateToken(user.id);
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      department: user.department || "",
      email: user.email || "",
      role: user.role,
      avatar: user.avatar_url || ""
    }));

    return Response.redirect(APP_URL + "/auth/success?token=" + token + "&user=" + userData);

  } catch (error) {
    console.error("[钉钉登录] 失败:", error.message);
    return Response.redirect(APP_URL + "/?error=dingtalk_failed");
  }
}
