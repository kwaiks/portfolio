import { retrieve } from "./retrieve";
import {
  buildSystemPrompt,
  NO_CONTEXT_REFUSAL,
  SCOPE_REFUSAL,
} from "./prompts";
import { generate, type ChatMsg } from "./generate";
import { isOffTopic } from "./guardrails";

export type AnswerReason = "off-topic" | "no-context" | "answered";

export type AnswerResult = {
  text: string;
  hasContext: boolean;
  refused: boolean;
  reason: AnswerReason;
};

/**
 * End-to-end scoped answer (non-streaming). The chat route mirrors these
 * exact decisions (off-topic → refuse; no relevant context → refuse; else
 * generate) so the eval harness measures real production behaviour.
 */
export async function answerQuery(question: string): Promise<AnswerResult> {
  if (isOffTopic(question)) {
    return { text: SCOPE_REFUSAL, hasContext: false, refused: true, reason: "off-topic" };
  }

  const { chunks, hasContext } = await retrieve(question);

  if (!hasContext) {
    return {
      text: NO_CONTEXT_REFUSAL,
      hasContext: false,
      refused: true,
      reason: "no-context",
    };
  }

  const system = buildSystemPrompt(
    chunks.map((c) => ({ source: c.source, section: c.section, content: c.content })),
  );
  const messages: ChatMsg[] = [
    { role: "system", content: system },
    { role: "user", content: question },
  ];
  const text = await generate(messages);
  return { text, hasContext: true, refused: false, reason: "answered" };
}
