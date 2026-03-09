# openclaw-ecommerce

E-commerce skills pack for [OpenClaw](https://openclaw.dev).

Gives your OpenClaw agent live access to Shopify, WooCommerce, and Klaviyo.
Ask it anything. It pulls the real data.

---

## What this is

This is **not** a standalone agent. It's a skills pack that plugs into the OpenClaw framework.

OpenClaw handles everything else:
- The Claude connection (via your Claude Pro/Max account — no API key billing)
- Scheduling and memory (via the QMD skill)
- Delivery to WhatsApp, Telegram, Slack
- Conversation and reasoning

This repo provides the **data tools** — the functions OpenClaw calls when you ask store questions.

---

## Skills included

| Skill | Tools | What you can ask |
|-------|-------|-----------------|
| `skills/shopify.js` | `getDailyRevenue`, `scanRecentOrders`, `checkInventory`, `checkRefunds`, `getStoreInfo` | Revenue, orders, stock, refund spikes |
| `skills/woocommerce.js` | `getDailyRevenue`, `scanRecentOrders`, `checkInventory` | Same for WooCommerce stores |
| `skills/klaviyo.js` | `getWeeklySummary`, `getRecentCampaigns` | Email campaign performance |

---

## Repo structure

```
openclaw-ecommerce/
├── skills/
│   ├── shopify.js            ← Shopify skill tools
│   ├── woocommerce.js        ← WooCommerce skill tools
│   └── klaviyo.js            ← Klaviyo skill tools
├── connectors/
│   ├── shopify.js            ← Shopify Admin REST API
│   ├── woocommerce.js        ← WooCommerce REST API v3
│   └── klaviyo.js            ← Klaviyo API
├── templates/
│   ├── SOUL.md               ← Agent personality for e-commerce
│   ├── USER.md               ← Store owner context template
│   └── MEMORY.md             ← Long-term memory template
├── setup/
│   ├── 1-mac-mini.md         ← Hardware setup & remote access
│   ├── 2-openclaw-install.md ← OpenClaw install guide
│   ├── 3-client-onboarding.md ← Per-client setup guide
│   └── 4-ecommerce-skills.md ← Skills reference & prompts cheat sheet
├── utils/
│   ├── logger.js             ← Timestamped logger
│   └── state.js              ← File-based JSON state
└── .env.example              ← All required credentials
```

---

## Setup

**Prerequisites:** OpenClaw installed and running (`npm install -g openclaw`)

### 1. Clone this repo

```bash
git clone https://github.com/mustyscale/openclaw-ecommerce
cd openclaw-ecommerce
npm install
```

### 2. Create your `.env`

```bash
cp .env.example .env
nano .env
```

Fill in the credentials for the platform(s) you use.

### 3. Copy the context templates to OpenClaw

```bash
cp templates/SOUL.md ~/.openclaw/SOUL.md
cp templates/USER.md ~/.openclaw/USER.md
cp templates/MEMORY.md ~/.openclaw/MEMORY.md
```

Fill in the placeholders in each file (especially `USER.md`).

### 4. Test your connections

```bash
npm run test:shopify
npm run test:woocommerce
npm run test:klaviyo
```

Expected output:
```
✅ Shopify skill OK
```

### 5. Register the skills with OpenClaw

In your OpenClaw config, point to the skills you need:
```json
{
  "skills": [
    "~/openclaw-ecommerce/skills/shopify.js"
  ]
}
```

### 6. Start talking to it

```bash
openclaw chat
```

```
> What did we make yesterday?
> Any low stock I should worry about?
> Check for refund spikes in the last 2 hours
> Give me my Klaviyo weekly summary
```

---

## Credentials needed

| Platform | Variables |
|----------|-----------|
| Shopify | `SHOPIFY_STORE_URL`, `SHOPIFY_ACCESS_TOKEN` |
| WooCommerce | `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET` |
| Klaviyo | `KLAVIYO_API_KEY` |

Thresholds (optional — sensible defaults built in):

| Variable | Default | Purpose |
|----------|---------|---------|
| `HIGH_VALUE_ORDER_THRESHOLD` | 500 | Flag orders above this value |
| `LOW_STOCK_THRESHOLD` | 20 | Flag inventory below this unit count |
| `REFUND_SPIKE_COUNT` | 5 | Alert if N+ refunds on same product |
| `REFUND_SPIKE_WINDOW_HOURS` | 2 | ...within this many hours |

---

## Full setup guides

Setting this up on a Mac Mini for a client? Read the guides in order:

1. [Mac Mini hardware & remote access](setup/1-mac-mini.md)
2. [OpenClaw installation](setup/2-openclaw-install.md)
3. [Client onboarding](setup/3-client-onboarding.md)
4. [Skills reference & prompts cheat sheet](setup/4-ecommerce-skills.md)

---

## What the agent sounds like

**Morning briefing** (`"Morning briefing"`):
> Revenue: £1,842 yesterday — 23 orders. AOV £80.
> Refund rate: 2.1%. One high-value order: #1042 (£620).
> Inventory: 3 SKUs below threshold. SKU-2291 has 8 units — 3 days left at current rate. Reorder now.
> Klaviyo: Tuesday campaign hit 38% open rate. Best this month.

**Refund check** (`"Any refund spikes today?"`):
> Rose Body Butter 200ml — 6 refunds in the last 2 hours. Threshold is 5.
> Worth checking: is this the same batch? Last time this happened it was a seal issue.

**Inventory** (`"What's running low?"`):
> 3 SKUs below your 20-unit threshold:
> SKU-2291: 8 units (3 days)
> SKU-1140: 14 units (6 days)
> SKU-0892: 19 units (borderline — watch it)

---

## License

MIT
