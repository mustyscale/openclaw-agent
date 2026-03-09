# Setup Guide 4 — E-commerce Skills Reference

This guide explains what each skill does, how to invoke it, and what it returns.
Share this with the client so they know what to ask their agent.

---

## How Skills Work

When you talk to your agent, it can call these tools automatically based on what you ask.
You don't need to know the technical names — just ask naturally.

Examples:
- "What did we make yesterday?" → `getDailyRevenue`
- "Any low stock I should worry about?" → `checkInventory`
- "Have there been any big orders in the last hour?" → `scanRecentOrders`
- "Are we seeing a refund spike on anything?" → `checkRefunds`
- "How did my Klaviyo campaigns do this week?" → `getWeeklySummary`

---

## Shopify Skills

### `getDailyRevenue()`

**What it does:** Pulls yesterday's full order data and summarises it.

**Returns:**
```json
{
  "date": "07/03/2025",
  "revenue": "1842.50",
  "currency": "GBP",
  "orderCount": 23,
  "aov": "80.11",
  "refundRate": "2.1%",
  "topProducts": [...],
  "highValueOrders": 1,
  "internationalOrders": 4
}
```

**Use it for:** Morning briefing, end-of-day wrap, comparing to last week.

**Ask your agent:**
- "What did we make yesterday?"
- "Give me the morning briefing"
- "How many orders yesterday?"

---

### `scanRecentOrders(hours)`

**What it does:** Looks at orders placed in the last N hours and flags anything notable.

Default window: last 1 hour. Ask for more: "scan the last 4 hours".

**Returns:**
```json
{
  "totalNew": 6,
  "highValue": [{ "id": "#1042", "total": "620.00", "currency": "GBP" }],
  "international": [{ "id": "#1041", "country": "Germany" }],
  "windowHours": 1
}
```

**Use it for:** Catching high-value orders that need attention, spotting unusual international activity.

**Ask your agent:**
- "Any big orders in the last 2 hours?"
- "Scan recent orders and flag anything unusual"
- "Check if we've had any orders over £500 today"

---

### `checkInventory()`

**What it does:** Pulls all inventory levels and flags anything at or below your low-stock threshold.

**Returns:**
```json
{
  "totalSkus": 84,
  "lowStockCount": 3,
  "threshold": 20,
  "lowStockItems": [
    { "product": "Lemon Myrtle Soap", "variant": "100g", "sku": "LMS-100", "qty": 12, "threshold": 20 }
  ],
  "allClear": false
}
```

**Use it for:** Weekly stock check, before a sale or campaign, after a high-traffic day.

**Ask your agent:**
- "What's running low?"
- "Check my inventory"
- "Anything I need to reorder before the weekend?"

---

### `checkRefunds(windowHours)`

**What it does:** Looks at refunded orders in the last N hours and spots if the same product is being refunded repeatedly.

Default window: last 2 hours.

**Returns:**
```json
{
  "totalRefunds": 7,
  "windowHours": 2,
  "spikeThreshold": 5,
  "spikes": [{ "product": "Rose Body Butter 200ml", "count": 6 }],
  "spikeDetected": true
}
```

**Use it for:** Catching a bad batch early, identifying a product with a quality issue, protecting your refund rate.

**Ask your agent:**
- "Any refund spikes today?"
- "Is anything getting returned a lot?"
- "Check refunds for the last 4 hours"

---

### `getStoreInfo()`

**What it does:** Returns basic store metadata (name, currency, plan).

**Use it for:** Quick verification that the connection is working.

**Ask your agent:**
- "Check you can still connect to my store"
- "What store are you connected to?"

---

## WooCommerce Skills

Same tools as Shopify, minus `internationalOrders` on `scanRecentOrders`.

| Skill | What it does |
|-------|-------------|
| `getDailyRevenue()` | Yesterday's revenue, order count, AOV, refund rate |
| `scanRecentOrders(hours)` | Recent orders with high-value flags |
| `checkInventory()` | All variants with low-stock flags |

---

## Klaviyo Skills

### `getWeeklySummary()`

**What it does:** Summarises all Klaviyo email campaigns from the last 7 days.

**Returns:** Campaign count, total sends, open rate, click rate, revenue attributed.

**Ask your agent:**
- "How did my email campaigns do this week?"
- "Klaviyo weekly summary"
- "What was the best-performing campaign last week?"

---

### `getRecentCampaigns(days)`

**What it does:** Lists individual campaigns from the last N days with performance metrics.

**Ask your agent:**
- "Show me my Klaviyo campaigns from the last 14 days"
- "Which email had the highest open rate this month?"

---

## Combining Skills

Your agent can pull from multiple skills in one conversation. Examples:

**Morning briefing (you say: "Morning briefing"):**
> Agent pulls `getDailyRevenue`, `checkInventory`, `checkRefunds`, and `getWeeklySummary` (if it's Monday), then writes a tight 8-line summary.

**Pre-weekend check (you say: "Do a pre-weekend check"):**
> Agent pulls `checkInventory` + `scanRecentOrders` + `checkRefunds`, then flags anything that needs action before Friday ends.

**Post-campaign review (you say: "We just turned off the summer campaign — how did it go?"):**
> Agent pulls `getWeeklySummary` + `getDailyRevenue` for the campaign period and gives you a clean assessment.

---

## Prompts Cheat Sheet

Print this and give it to the client:

```
DAILY
"Morning briefing"
"What did we make yesterday?"
"Anything I should deal with today?"

INVENTORY
"What's running low?"
"Anything to reorder this week?"

ORDERS
"Any big orders in the last 2 hours?"
"Scan for anything unusual"

REFUNDS
"Any refund spikes?"
"Is [product name] getting returned a lot?"

KLAVIYO
"How did my emails do this week?"
"Best campaign this month?"

GENERAL
"Connect to my store and check everything"
"Give me a full status update"
```

---

## Setting Up Scheduled Briefings

Ask your agent:
```
Using the QMD skill, schedule a daily briefing every morning at 8am that pulls
getDailyRevenue, checkInventory, and checkRefunds, then sends me a summary.
```

The agent will use the QMD skill to register this as a recurring task.
It runs automatically — you don't need to ask every day.

To cancel:
```
Cancel the daily briefing schedule
```

---

## Thresholds (set in .env)

| Setting | Default | What it controls |
|---------|---------|-----------------|
| `HIGH_VALUE_ORDER_THRESHOLD` | 500 | Flag orders above this amount |
| `LOW_STOCK_THRESHOLD` | 20 | Flag inventory below this unit count |
| `REFUND_SPIKE_COUNT` | 5 | Alert if N+ refunds on same product |
| `REFUND_SPIKE_WINDOW_HOURS` | 2 | ... within this many hours |

To change a threshold, update `.env` and restart the agent.
Or tell your agent: "From now on, flag any order over £300" — it will note this in MEMORY.md.
