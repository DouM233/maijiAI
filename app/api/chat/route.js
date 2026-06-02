import { NextResponse } from "next/server";
import { getChatAgent } from "../../../lib/chat-agents";

export const runtime = "nodejs";

const DEFAULT_BASE_URL = "https://yunwu.ai/v1";
const DEFAULT_MODEL = process.env.YUNWU_DEFAULT_MODEL || "gpt-5.5-pro";

function normalizeMessages(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item) => item && typeof item.content === "string" && typeof item.role === "string")
    .map((item) => ({
      role: ["system", "user", "assistant"].includes(item.role) ? item.role : "user",
      content: item.content
    }));
}

export async function POST(request) {
  const apiKey = process.env.YUNWU_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing YUNWU_API_KEY." },
      { status: 500 }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    message,
    history = [],
    model = DEFAULT_MODEL,
    agentId = "",
    conversationId = "",
    systemPrompt = ""
  } = payload || {};

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const agent = getChatAgent(agentId);
  const messages = [];
  const resolvedSystemPrompt =
    typeof systemPrompt === "string" && systemPrompt.trim()
      ? systemPrompt.trim()
      : agent?.systemPrompt || "";

  if (resolvedSystemPrompt) {
    messages.push({ role: "system", content: resolvedSystemPrompt });
  }

  messages.push(...normalizeMessages(history));
  messages.push({ role: "user", content: message.trim() });

  const upstreamResponse = await fetch(
    `${process.env.YUNWU_BASE_URL || DEFAULT_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7
      }),
      cache: "no-store"
    }
  );

  if (!upstreamResponse.ok) {
    const errorText = await upstreamResponse.text();
    return NextResponse.json(
      {
        error: "Upstream chat request failed.",
        details: errorText.slice(0, 500)
      },
      { status: upstreamResponse.status }
    );
  }

  const data = await upstreamResponse.json();
  const reply = data?.choices?.[0]?.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    return NextResponse.json(
      { error: "Upstream response did not include a reply." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    reply,
    conversationId: conversationId || `conv-${Date.now()}`,
    agentId: agent?.id || agentId || "",
    usage: data?.usage || null,
    model: data?.model || model
  });
}
