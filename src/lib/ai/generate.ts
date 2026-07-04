import { config } from "../config";

export type ChatMsg = {
  role: "system" | "user" | "assistant";
  content: string;
};

function endpoint() {
  return `${config.deepseek.baseURL.replace(/\/$/, "")}/chat/completions`;
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.deepseek.apiKey}`,
  };
}

/** Non-streaming completion (used by the eval harness). */
export async function generate(messages: ChatMsg[]): Promise<string> {
  if (!config.deepseek.apiKey) throw new Error("DEEPSEEK_API_KEY is not set");

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: config.deepseek.model,
      messages,
      temperature: 0,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek generate failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

/**
 * Rewrite a conversational follow-up into a self-contained retrieval query,
 * resolving pronouns/references against recent history (e.g. "how fast was
 * it?" → "How fast was the WhatsApp AI customer-service response time?").
 * Stops follow-up questions from falling through the relevance gate.
 */
export async function rewriteQuery(
  question: string,
  history: ChatMsg[],
): Promise<string> {
  if (!history.length) return question;
  const convo = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
  const messages: ChatMsg[] = [
    {
      role: "system",
      content:
        "You rewrite a user's latest message into a self-contained search query for a retrieval system, using the prior conversation to resolve pronouns and references (e.g. 'it', 'that', 'the second one'). Output ONLY the rewritten query on a single line — no preamble, no quotes, no trailing period. If it is already self-contained, return it unchanged.",
    },
    {
      role: "user",
      content: `Conversation so far:\n${convo}\n\nLatest message: ${question}\n\nStandalone query:`,
    },
  ];
  try {
    const out = await generate(messages);
    const clean = out
      .trim()
      .split("\n")[0]
      .replace(/^["']|["']$/g, "")
      .trim();
    return clean || question;
  } catch {
    return question;
  }
}

/**
 * Streaming completion as an async generator of text deltas.
 * Parses DeepSeek's OpenAI-compatible SSE stream.
 */
export async function* generateStream(
  messages: ChatMsg[],
): AsyncGenerator<string, void, unknown> {
  if (!config.deepseek.apiKey) throw new Error("DEEPSEEK_API_KEY is not set");

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: config.deepseek.model,
      messages,
      temperature: 0,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`DeepSeek stream failed (${res.status}): ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Partial/keepalive line — ignore.
      }
    }
  }
}
