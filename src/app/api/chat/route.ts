import { NextRequest } from "next/server";
import { retrieve } from "@/lib/ai/retrieve";
import { buildSystemPrompt, NO_CONTEXT_REFUSAL, SCOPE_REFUSAL } from "@/lib/ai/prompts";
import { generateStream, rewriteQuery, type ChatMsg } from "@/lib/ai/generate";
import { classifyTheme, isOffTopic } from "@/lib/ai/guardrails";
import { hashSession, logAiEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InMsg = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages: InMsg[] = Array.isArray(body.messages) ? body.messages : [];
  const sessionId: string = typeof body.sessionId === "string" ? body.sessionId : "";
  const page: string = typeof body.page === "string" ? body.page : "/";

  // Latest user message + prior conversation.
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUserIdx = i;
      break;
    }
  }
  const rawQuestion = lastUserIdx >= 0 ? messages[lastUserIdx].content : "";
  const priorTurns = (lastUserIdx >= 0 ? messages.slice(0, lastUserIdx) : [])
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as ChatMsg["role"], content: m.content }));
  const hasPriorTurns = priorTurns.some((m) => m.role === "user");
  const sessionHash = sessionId ? hashSession(sessionId) : "anon";
  const theme = classifyTheme(rawQuestion);

  // Resolve follow-up references into a self-contained query before retrieval,
  // so "how fast was it?" retrieves the right chunks instead of being refused.
  const query = hasPriorTurns ? await rewriteQuery(rawQuestion, priorTurns) : rawQuestion;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (s: string) => controller.enqueue(encoder.encode(s));
      try {
        // Fast off-topic guard (checked on the literal user message).
        if (!rawQuestion.trim() || isOffTopic(rawQuestion)) {
          send(`${SCOPE_REFUSAL}\n\n[CONTACT_CTA]`);
          await logAiEvent({ sessionHash, theme, page, hasContext: false });
          controller.close();
          return;
        }

        const { chunks, hasContext } = await retrieve(query);
        await logAiEvent({ sessionHash, theme, page, hasContext });

        // Relevance gate: no relevant context → refuse, don't guess.
        if (!hasContext) {
          send(`${NO_CONTEXT_REFUSAL}\n\n[CONTACT_CTA]`);
          controller.close();
          return;
        }

        const system = buildSystemPrompt(
          chunks.map((c) => ({ source: c.source, section: c.section, content: c.content })),
        );
        // Thread memory: include prior conversation (minus any client system msgs).
        const history: ChatMsg[] = messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as ChatMsg["role"], content: m.content }));
        const chatMessages: ChatMsg[] = [{ role: "system", content: system }, ...history];

        for await (const delta of generateStream(chatMessages)) {
          send(delta);
        }
        controller.close();
      } catch {
        send(
          "\n\n_Sorry — something went wrong while answering. Please use the Contact form and Alexander will reply directly._",
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
