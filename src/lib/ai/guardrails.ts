/**
 * Lightweight input guardrails. The PRIMARY anti-hallucination guard is the
 * retrieval relevance gate (retrieve.ts → hasContext). These add a fast,
 * cheap path to decline obviously off-topic or abusive input without
 * spending a generation call, and a theme classifier for metadata-only
 * analytics (never storing raw text).
 */

const OFF_TOPIC_REGEXES: RegExp[] = [
  // Narrowed to blatant code-generation + prompt-injection only. Everything
  // else is scoped by the retrieval relevance gate (no relevant context →
  // refuse), which avoids false positives like "did you build an API at
  // Bukalapak?" or "what did you ship?".
  /\bwrite\s+(me\s+)?(some\s+)?(code|a\s+function|a\s+script|a\s+program|a\s+sql\s+query|a\s+regex)\b/i,
  /\b(ignore|disregard)\s+(your|the|all)\s+(previous\s+)?instructions\b/i,
];

export function isOffTopic(message: string): boolean {
  return OFF_TOPIC_REGEXES.some((re) => re.test(message));
}

/**
 * Map a question to a coarse theme for metadata-only analytics.
 * Returns the first matching category, else "other". No raw text stored.
 */
export function classifyTheme(message: string): string {
  const m = message.toLowerCase();
  const has = (...words: string[]) => words.some((w) => m.includes(w));

  if (has("ai", "rag", "llm", "gpt", "grok", "guardrail", "embedding", "vector", "chatbot", "customer service", "machine learning", "model")) return "ai";
  if (has("experience", "worked", "work at", "career", "bukalapak", "wilopo", "wiratek", "evotech", "job", "company", "role at")) return "experience";
  if (has("project", "case study", "shipped", "built", "payments", "payment", "database", "migration", "perf", "performance")) return "projects";
  if (has("stack", "tech", "language", "framework", "golang", "typescript", "postgres", "flutter", "kubernetes", "docker", "next.js", "vue")) return "tech";
  if (has("contact", "email", "hire", "reach", "available", "remote", "open to", "phone")) return "contact";
  if (has("education", "degree", "university", "college", "gpa", "school", "pln")) return "education";
  if (has("who", "about", "background", "summary", "senior", "position", "title", "you")) return "role";
  return "other";
}
