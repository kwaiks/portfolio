---
type: project
slug: db-performance
title: Cutting DB CPU from 100% to under 25%
company: Bukalapak (Prakerja)
period: 2023–2024
featured: true
order: 2
tags: [PostgreSQL, "query optimization", indexes, performance]
summary: Diagnosed recurring outages on a 9M-row table via slow-query logs and cut DB CPU from 100% to under 25% with indexes and join decomposition.
---

# Cutting DB CPU from 100% to under 25%

On a marketplace platform processing roughly **73B IDR in GMV per year**, recurring production database outages were traced to a **9-million-row transactional table**.

## Approach

I used **slow-query logs** to find the culprits, then applied **targeted indexes** and **join decomposition** — replacing heavy JOINs with controlled, multi-query fetches that are easier for the planner to optimize and to reason about under load.

## Outcome

- Database CPU dropped from **100% to under 25%**.
- I authored RFCs for staged, low-risk query optimization and led the migration of transactions off the shared monolith to avoid a projected ~**300M IDR** in absorbed infrastructure cost.
