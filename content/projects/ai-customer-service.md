---
type: project
slug: ai-customer-service
title: Human-in-the-loop WhatsApp AI customer service
company: Private logistics company
period: 2025–2026
featured: true
order: 1
tags: [RAG, pgvector, Grok, "Cloudflare AI Gateway", guardrails, WhatsApp, "Applied AI"]
summary: A production AI customer-service platform that cut first-response time from ~2 hours to ~14 seconds, with human-in-the-loop guardrails.
---

# Human-in-the-loop WhatsApp AI customer service

The flagship proof of my applied-AI work: a **human-in-the-loop AI customer-service platform** for WhatsApp, designed and shipped solo in about three months and now running in production.

## The problem

Customer-service first responses were taking roughly **two hours** from a human baseline — too slow for a logistics business where shippers and consignees need fast answers.

## The system

- **Generation:** Grok (xAI), routed through the **Cloudflare AI Gateway** for observability, caching, and rate control.
- **Retrieval:** **PostgreSQL + pgvector** retrieval-augmented generation over a knowledge store maintained by the customer-service team.
- **Guardrails:** prompt-level and code-based guardrails trigger automatic handoff to a human agent whenever confidence is low or a request falls out of scope — so the AI never blocks a customer from reaching a person.
- **Red-teaming:** an impersonation feature let CS agents probe the assistant as if they were end users before go-live.

## Outcome

- First-response time dropped from ~**2 hours** to roughly **14 seconds** end-to-end.
- **95% answer accuracy** at launch, validated by the CS team's pre-launch evaluation.

## What's next

Migrating from a tool-based chatbot to a **skill/prompt-driven orchestration layer**, so operations can change response logic without an engineering release.
