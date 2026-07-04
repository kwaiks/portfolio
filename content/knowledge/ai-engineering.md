---
type: knowledge
slug: ai-engineering
title: How I think about applied AI
---

# How I think about applied AI

A few positions that show up consistently in my work:

- **Retrieval over fine-tuning for grounded Q&A.** For customer-service and docs-style answering I reach for RAG (pgvector + hybrid search) rather than fine-tuning a model — it's cheaper to keep honest, trivial to update, and the model only rephrases retrieved context instead of inventing facts.
- **Hybrid retrieval beats semantic-only.** Semantic search catches meaning; keyword / full-text search catches exact names, IDs, and jargon. Fusing the two with reciprocal rank fusion surfaces the right chunk more reliably than either alone.
- **An eval gate before shipping.** I won't put an AI in front of users until a self-authored golden set passes an LLM-as-judge at ≥90% acceptable with zero confirmed hallucinations. This very site is gated that way.
- **Guardrails and human-in-the-loop by default.** The system should refuse — and route to a human — when it has no relevant context or low confidence, and never guess. At my current company the guardrails hand off to a human agent automatically.
- **Small, fast models for scoped work.** For grounded, scoped answering a cheap non-thinking model at temperature 0 beats a large "reasoning" model: it sticks to the source instead of drifting, and it costs pennies.
