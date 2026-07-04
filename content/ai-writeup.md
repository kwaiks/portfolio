---
type: page
slug: how-the-ai-works
title: How this site's AI works
---

# How this site's AI works

The assistant in the corner is a small, deliberately scoped **retrieval-augmented generation (RAG)** system. Here's exactly how it works — and the guardrails that keep it honest.

## 1. The content

Every piece of text on this site (about, experience, case studies) is the **single source of truth** the assistant draws from. At build time it's chunked and embedded.

## 2. Embeddings

Each chunk is converted to a 1,536-dimensional vector using **OpenAI's `text-embedding-3-small`** model and stored in **Supabase Postgres with the `pgvector`** extension.

## 3. Hybrid retrieval

When you ask a question, the assistant embeds your question and runs **hybrid retrieval**:

- **Semantic** search over the vectors (meaning, not just keywords), and
- **Keyword** search using Postgres full-text search (`tsvector` + `ts_rank`).

Results are fused with **Reciprocal Rank Fusion** so a chunk that's strong on either signal surfaces. This is the same hybrid pattern I use in production at my current company.

## 4. The relevance gate — the most important guardrail

If no chunk scores above a relevance threshold, the assistant **refuses** and points you to the contact form — rather than guessing. This is what prevents hallucination: the model is only ever asked to *rephrase retrieved context*, never to invent facts.

## 5. Generation

Retrieved context goes into a scoped system prompt, and **DeepSeek** (a fast, cheap flash-tier model) writes the answer at **temperature 0** — faithful rephrasing, low creativity. For grounded Q&A, a smaller non-thinking model is actually better than a large "reasoning" model: it sticks to the source instead of drifting.

## 6. Out-of-scope refusal

The assistant is scoped to questions about Alexander's work. Off-topic requests (write me code, tell me a joke, advise on something unrelated) are declined politely and routed to the contact form.

## 7. The eval gate

Before any assistant ships, a **golden set** of questions is run through the full pipeline and scored by an **LLM-as-a-judge** against a rubric (accurate, grounded, correct in-scope vs. correct refusal). The gate is **≥ 90% acceptable answers and zero confirmed hallucinations**. If it doesn't pass, it doesn't ship.

## 8. Privacy

The server logs **metadata only** — an anonymous session hash, a rough question theme, and the page — never your raw message text or any personal data.
