import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { pool } from "../../../lib/db";

export const runtime = "nodejs";

const SECRET = process.env.SESSION_SECRET || "my-super-secret-key-2024-abcdef";

function getUserId(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, SECRET);
    return decoded.userId || null;
  } catch { return null; }
}

// GET /api/conversations — 获取用户的对话列表
export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows] = await pool.execute(
    "SELECT id, title, agent_id, model, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50",
    [userId]
  );
  return NextResponse.json({ conversations: rows });
}

// POST /api/conversations — 创建或更新对话，保存消息
export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { conversationId, title, agentId, model, messages } = body;
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  // upsert conversation
  await pool.execute(
    "INSERT INTO conversations (id, user_id, title, agent_id, model) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), agent_id = VALUES(agent_id), model = VALUES(model), updated_at = NOW()",
    [conversationId, userId, title || "", agentId || "", model || ""]
  );

  // save new messages
  if (Array.isArray(messages) && messages.length > 0) {
    for (const msg of messages) {
      if (msg.role && msg.content) {
        await pool.execute(
          "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
          [conversationId, msg.role, msg.content]
        );
      }
    }
  }

  return NextResponse.json({ ok: true, conversationId });
}

// DELETE /api/conversations?id=xxx — 删除对话及其所有消息
export async function DELETE(request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const convId = searchParams.get("id");
  if (!convId) return NextResponse.json({ error: "id required" }, { status: 400 });

  // 确认该对话属于当前用户
  const [rows] = await pool.execute(
    "SELECT id FROM conversations WHERE id = ? AND user_id = ?",
    [convId, userId]
  );
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await pool.execute("DELETE FROM messages WHERE conversation_id = ?", [convId]);
  await pool.execute("DELETE FROM conversations WHERE id = ?", [convId]);

  return NextResponse.json({ ok: true });
}
