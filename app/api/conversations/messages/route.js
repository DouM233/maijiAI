import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { pool } from "../../../../lib/db";

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

// GET /api/conversations/messages?id=xxx — 获取对话的所有消息
export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const convId = searchParams.get("id");
  if (!convId) return NextResponse.json({ error: "id required" }, { status: 400 });

  // verify ownership
  const [convRows] = await pool.execute(
    "SELECT id FROM conversations WHERE id = ? AND user_id = ?",
    [convId, userId]
  );
  if (convRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [messages] = await pool.execute(
    "SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC",
    [convId]
  );
  return NextResponse.json({ messages });
}
