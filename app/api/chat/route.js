import { NextResponse } from "next/server";
import { getChatAgent } from "../../../lib/chat-agents";

export const runtime = "nodejs";

const DEFAULT_BASE_URL = "https://yunwu.ai/v1";
const DEFAULT_MODEL = process.env.YUNWU_DEFAULT_MODEL || "gpt-5.5-pro";

function normalizeMessages(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((i) => i && typeof i.content === "string" && typeof i.role === "string")
    .map((i) => ({
      role: ["system", "user", "assistant"].includes(i.role) ? i.role : "user",
      content: i.content
    }));
}

export async function POST(request) {
  const apiKey = process.env.YUNWU_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing YUNWU_API_KEY." }, { status: 500 });
  }

  let payload;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const {
    message, history = [], model = DEFAULT_MODEL,
    agentId = "", conversationId = "", systemPrompt = "",
    stream = true
  } = payload || {};

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const agent = getChatAgent(agentId);
  const msgs = [];
  const sysPrompt = (typeof systemPrompt === "string" && systemPrompt.trim())
    ? systemPrompt.trim() : (agent?.systemPrompt || "");
  if (sysPrompt) msgs.push({ role: "system", content: sysPrompt });
  msgs.push(...normalizeMessages(history));
  msgs.push({ role: "user", content: message.trim() });

  const convId = conversationId || "conv-" + Date.now();
  const aId = agent?.id || agentId || "";
  const base = process.env.YUNWU_BASE_URL || DEFAULT_BASE_URL;
  const headers = { "Content-Type": "application/json", Authorization: "Bearer " + apiKey };

  if (stream) {
    const upstream = await fetch(base + "/chat/completions", {
      method: "POST", headers,
      body: JSON.stringify({ model, messages: msgs, temperature: 0.7, stream: true }),
      cache: "no-store"
    });
    if (!upstream.ok) {
      const t = await upstream.text();
      return NextResponse.json({ error: "Upstream failed.", details: t.slice(0, 500) }, { status: upstream.status });
    }

    const enc = new TextEncoder();
    const readable = new ReadableStream({
      async start(ctrl) {
        const metaEvt = "data: " + JSON.stringify({ type: "meta", conversationId: convId, agentId: aId }) + "\n\n";
        ctrl.enqueue(enc.encode(metaEvt));

        const reader = upstream.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const parts = buf.split("\n");
            buf = parts.pop() || "";
            for (const ln of parts) {
              const tr = ln.trim();
              if (!tr || !tr.startsWith("data:")) continue;
              const p = tr.slice(5).trim();
              if (p === "[DONE]") { ctrl.enqueue(enc.encode("data: [DONE]\n\n")); continue; }
              try {
                const ck = JSON.parse(p);
                const d = ck?.choices?.[0]?.delta?.content;
                if (typeof d === "string" && d.length > 0) {
                  ctrl.enqueue(enc.encode("data: " + JSON.stringify({ type: "delta", content: d }) + "\n\n"));
                }
              } catch {}
            }
          }
        } catch (err) {
          ctrl.enqueue(enc.encode("data: " + JSON.stringify({ type: "error", error: String(err) }) + "\n\n"));
        } finally {
          ctrl.close();
        }
      }
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" }
    });
  }

  const upstream = await fetch(base + "/chat/completions", {
    method: "POST", headers,
    body: JSON.stringify({ model, messages: msgs, temperature: 0.7 }),
    cache: "no-store"
  });
  if (!upstream.ok) {
    const t = await upstream.text();
    return NextResponse.json({ error: "Upstream failed.", details: t.slice(0, 500) }, { status: upstream.status });
  }
  const data = await upstream.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    return NextResponse.json({ error: "No reply from upstream." }, { status: 502 });
  }
  return NextResponse.json({ reply, conversationId: convId, agentId: aId, usage: data?.usage || null, model: data?.model || model });
}
