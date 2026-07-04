---
type: project
slug: payment-integrity
title: Payment integrity for revenue-critical flows
company: Bukalapak (Mitra Financial Service)
period: 2025
featured: true
order: 3
tags: [payments, idempotency, fintech, correctness]
summary: Partner-specific payment flows with idempotent callbacks to prevent double charges, lost payments, and disputes.
---

# Payment integrity for revenue-critical flows

On the Mitra Financial Service team, I built **partner-specific payment flows** on a revenue-critical fintech platform.

## What it does

- **Fee segmentation** and **app-to-app transitions** for partner integrations.
- **Idempotent callback handling** so retries and duplicates can never cause a double charge or a lost payment.
- State validation that held correctness during incidents triggered by upstream migrations.

## Why it matters

On a payments platform, a single correctness bug means double charges, lost payments, or partner disputes. The idempotency design ensures the system converges to the right state even when partners retry or callbacks arrive out of order.
