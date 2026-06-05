import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export const runtime = "nodejs";

const SECRET = process.env.SESSION_SECRET || "my-super-secret-key-2024-abcdef";

function getUser(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

async function isAdmin(request) {
  const decoded = getUser(request);
  if (!decoded?.userId) return false;
  const [rows] = await pool.execute(
    "SELECT role FROM users WHERE id = ?", [decoded.userId]
  );
  return rows[0]?.role === "admin";
}

// GET /api/agents — 所有用户可访问，返回启用的智能体列表
export async function GET() {
  const [rows] = await pool.execute(
    `SELECT id, name, description, system_prompt, opening_message, placeholder,
            summary_prompt, direct_entry, allow_model_switch, icon_emoji, category, sort_order
     FROM agents WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC`
  );
  return NextResponse.json({ agents: rows });
}

// POST /api/agents — 管理员创建新智能体
export async function POST(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "仅管理员可操作" }, { status: 403 });
  }
  const body = await request.json();
  const {
    id, name, description = "", system_prompt = "", opening_message = "",
    placeholder = "", summary_prompt = "", direct_entry = 0,
    allow_model_switch = 1, icon_emoji = "🤖", category = "工作工具", sort_order = 0
  } = body;

  if (!id || !name) {
    return NextResponse.json({ error: "id 和 name 必填" }, { status: 400 });
  }

  await pool.execute(
    `INSERT INTO agents (id, name, description, system_prompt, opening_message, placeholder,
       summary_prompt, direct_entry, allow_model_switch, icon_emoji, category, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [id, name, description, system_prompt, opening_message, placeholder,
     summary_prompt, direct_entry ? 1 : 0, allow_model_switch ? 1 : 0,
     icon_emoji, category, sort_order]
  );
  return NextResponse.json({ ok: true, id });
}

// PUT /api/agents — 管理员更新智能体
export async function PUT(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "仅管理员可操作" }, { status: 403 });
  }
  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id 必填" }, { status: 400 });

  const allowed = ["name","description","system_prompt","opening_message","placeholder",
                   "summary_prompt","direct_entry","allow_model_switch","icon_emoji","category","sort_order","is_active"];
  const sets = [], vals = [];
  for (const k of allowed) {
    if (k in fields) { sets.push(`${k} = ?`); vals.push(fields[k]); }
  }
  if (!sets.length) return NextResponse.json({ error: "无可更新字段" }, { status: 400 });

  vals.push(id);
  await pool.execute(`UPDATE agents SET ${sets.join(", ")} WHERE id = ?`, vals);
  return NextResponse.json({ ok: true });
}

// DELETE /api/agents?id=xxx — 管理员删除（软删除）
export async function DELETE(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "仅管理员可操作" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 必填" }, { status: 400 });

  await pool.execute("UPDATE agents SET is_active = 0 WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
