---
type: experience
slug: current-company
company: Private logistics company
role: Senior Fullstack Engineer
period: Oct 2025 – Present
current: true
order: 1
---

# Senior Fullstack Engineer — Private logistics company

At a private logistics company, I designed and shipped — solo, in roughly three months — a **human-in-the-loop WhatsApp AI customer-service platform** that is now in production. It cut the average first-response time from about **2 hours** (the human baseline) to roughly **14 seconds** end-to-end.

## How the AI platform works

- **Generation:** Grok (xAI), routed through the **Cloudflare AI Gateway** for observability and caching.
- **Retrieval:** **PostgreSQL + pgvector** retrieval-augmented generation over a customer-service-maintained FAQ knowledge store.
- **Guardrails:** both prompt-level and code-based guardrails enable automatic handoff to a human agent when confidence is low or a request is out of scope.

Before launch I achieved **95% answer accuracy** as validated by the CS team's pre-launch evaluation. To enable red-teaming, I built an impersonation feature so customer-service agents could test the AI as if they were end users.

I'm now architecting a migration from a tool-based chatbot to a **skill/prompt-driven orchestration layer**, so operations can update response logic without an engineering release.

Beyond the AI platform, I scaffolded a new mobile platform (Go backend, Vue frontend) and designed an **OAuth session bridge** so legacy Laravel users migrated to the new stack without re-authenticating; I own Flutter stabilization, maintenance, and App Store + Google Play release management.

I also led a production **GCP → Alibaba Cloud** migration with a controlled cutover, reducing infrastructure cost by roughly **50%** (verified via billing comparison).
