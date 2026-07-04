import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./supabase/admin";

/** One-way hash of a client session id — stored, never the raw id. */
export function hashSession(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex").slice(0, 16);
}

/**
 * Metadata-only AI event log. PRD privacy lock: NO raw message text or PII.
 * Best-effort: never throws into the request path.
 */
export async function logAiEvent(input: {
  sessionHash: string;
  theme: string;
  page?: string;
  hasContext?: boolean;
}): Promise<void> {
  try {
    await getSupabaseAdmin().from("ai_events").insert({
      session_hash: input.sessionHash,
      theme: input.theme,
      page: input.page ?? null,
      has_context: input.hasContext ?? null,
    });
  } catch {
    // Analytics must never break the chat flow.
  }
}
