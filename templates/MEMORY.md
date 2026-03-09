# MEMORY.md — Agent Long-Term Memory

This file is updated by the agent over time using the QMD skill.
It stores facts, patterns, and decisions that should persist across conversations.

---

## Store Fundamentals

- Store name: [filled by agent after first connection]
- Platform: [Shopify / WooCommerce]
- Currency: [USD / GBP / EUR / TRY]
- Typical daily revenue range: [e.g. £1,200–£2,100]
- Typical daily order count: [e.g. 18–30]
- Average order value baseline: [e.g. ~£72]

---

## Seasonal Patterns

<!-- Agent fills these in as it learns -->
- Busiest days of the week: [e.g. Fri–Sun]
- Slow days: [e.g. Tuesday]
- Known sales spikes: [e.g. Black Friday, Eid, January sale]
- Known slow periods: [e.g. first 2 weeks of August]

---

## Product Knowledge

<!-- Agent tracks top performers and problem SKUs over time -->

### Top Sellers (by volume)
| SKU | Product | Avg units/day |
|-----|---------|---------------|
| — | — | — |

### High-Margin Products (owner-flagged)
- [fill in manually or let agent learn from revenue data]

### Problem Products (refund history)
- [agent updates when refund spikes are detected]

---

## Inventory Behaviour

<!-- Agent learns reorder patterns over time -->
- SKUs that sell out frequently: [none yet]
- Average lead time accepted by owner: [e.g. 12 days]
- Products on manual reorder (don't alert): [none]

---

## Customer Patterns

- Repeat customer rate: [not yet measured]
- Most common refund reason: [not yet observed]
- High-value customer threshold: [$500+ lifetime]

---

## Decisions & Owner Preferences (learned over time)

<!-- Agent logs owner decisions here so it doesn't re-ask the same questions -->

| Date | Context | Owner decision |
|------|---------|----------------|
| — | — | — |

Example entries (agent adds these):
| 2025-06-01 | Low stock on SKU-2291 | Owner said: "don't reorder until July" |
| 2025-06-05 | Refund spike on Product X | Owner said: "already aware, bad batch, resolved" |

---

## Active Watchlist

<!-- Short-term items the owner wants the agent to monitor closely -->
- [ ] [e.g. "Watch SKU-4412 — new launch, track sell rate for 7 days"]
- [ ] [e.g. "Monitor ROAS on summer campaign — flag if drops below 2.5x"]

---

## Notes from Owner

<!-- Freeform context the owner has shared that doesn't fit elsewhere -->
- [e.g. "We're switching 3PL in September — expect fulfilment delays"]
- [e.g. "Don't flag international orders unless they're over £300"]
- [e.g. "Klaviyo campaigns go out Tuesday and Thursday — expect open rate data by noon"]

---

## Agent Self-Notes

<!-- Agent uses this section to flag things it noticed but hasn't asked about yet -->
- [e.g. "Refund rate on Product Y has been climbing for 3 weeks — worth discussing"]
- [e.g. "AOV dropped 8% week-on-week — no clear cause found yet"]

---

*Last updated: [date]*
*Updated by: OpenClaw e-commerce agent*
