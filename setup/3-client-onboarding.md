# Setup Guide 3 — Client Onboarding

This guide covers filling in the context files and configuring the agent for a specific client.
Do this after completing Guides 1 and 2.

Budget 30 minutes per client. Most of it is filling in files and getting API credentials.

---

## What You're Doing

You're personalising the agent for this specific store.
The three context files tell OpenClaw:
- **SOUL.md** — how to behave (tone, priorities, communication style)
- **USER.md** — who the owner is, what the store sells, what needs attention
- **MEMORY.md** — what the agent learns and remembers over time

---

## Step 1 — Fill in SOUL.md

The default SOUL.md template is already written for e-commerce.
You usually don't need to change it.

Only edit it if:
- The owner speaks a language other than English → add that at the top
- The owner has a specific communication quirk they want respected
- You're doing a white-label deployment with a custom agent name

```bash
nano ~/.openclaw/SOUL.md
```

Replace `[STORE_NAME]` on line 3 with the actual store name.

---

## Step 2 — Fill in USER.md

This is the most important file. Take your time with it.

```bash
nano ~/.openclaw/USER.md
```

Fill in every field. Use the onboarding form below to collect info from the client.

### Onboarding Form (send this to client)

```
1. Your name:
2. Business name:
3. Your location / timezone:
4. Platform: Shopify / WooCommerce (circle one)
5. Store URL:
6. Main product category (e.g. leather bags, supplements, candles):
7. Rough average order value (e.g. ~£65):
8. Rough order volume per day (e.g. ~15 orders/day):
9. Primary market (UK / USA / Europe / Global):
10. Currency:
11. Preferred contact channel: Telegram / WhatsApp / Slack (circle one)
12. What time do you want your morning briefing? (e.g. 8:00 AM):
13. Briefing style: bullet points / ultra-short summary (circle one):
14. Alerts: only urgent / everything (circle one):
15. High-value order threshold — flag any order above £___:
16. Low stock threshold — alert when a product has fewer than ___ units:
17. What's your biggest operational pain point right now?
18. Is fulfilment in-house, 3PL, or dropship?
19. What do you want the agent to handle? (tick all that apply)
    [ ] Daily revenue briefings
    [ ] Low stock alerts
    [ ] Refund spike detection
    [ ] High-value order flags
    [ ] Klaviyo campaign summary
    [ ] Ad spend monitoring
    [ ] Customer support drafts
    [ ] Ad-hoc questions
```

---

## Step 3 — Get API Credentials

### Shopify

1. Go to: `[store].myshopify.com/admin/apps/private`
2. Click "Create a custom app"
3. Name it: "OpenClaw Agent"
4. Under Admin API access scopes, enable:
   - `read_orders`
   - `read_products`
   - `read_inventory`
   - `read_customers`
5. Click "Install app"
6. Copy the **Admin API access token** (shown once only)

Credentials needed:
```
SHOPIFY_STORE_URL = your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN = shpat_xxxxx
```

---

### WooCommerce

1. Go to: `WP Admin → WooCommerce → Settings → Advanced → REST API`
2. Click "Add key"
3. Description: "OpenClaw Agent"
4. Permissions: **Read**
5. Click "Generate API key"
6. Copy the Consumer Key and Consumer Secret (shown once only)

Credentials needed:
```
WOOCOMMERCE_URL = https://your-store.com
WOOCOMMERCE_CONSUMER_KEY = ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET = cs_xxxxx
```

---

### Klaviyo (optional)

1. Go to: `Klaviyo → Account → Settings → API Keys`
2. Click "Create Private API Key"
3. Name: "OpenClaw Agent"
4. Scopes: Read access to Campaigns and Metrics
5. Copy the key

Credentials needed:
```
KLAVIYO_API_KEY = pk_xxxxx
```

---

## Step 4 — Create Client .env File

```bash
nano ~/openclaw-agent/.env
```

Paste and fill in:
```env
# Shopify
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx

# WooCommerce
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx

# Klaviyo
KLAVIYO_API_KEY=pk_xxxxx

# Thresholds (match what client said in onboarding form)
HIGH_VALUE_ORDER_THRESHOLD=500
LOW_STOCK_THRESHOLD=20
REFUND_SPIKE_COUNT=5
REFUND_SPIKE_WINDOW_HOURS=2
```

---

## Step 5 — Test the Skills

```bash
cd ~/openclaw-agent

# Test whichever platform client uses
node skills/shopify.js
# or
node skills/woocommerce.js
# or
node skills/klaviyo.js
```

Expected output (Shopify):
```
🧪 Testing Shopify skill...

1. Store info:
   LotionLab — GBP

2. Daily revenue:
   GBP 1420.50 — 19 orders

3. Inventory check:
   84 SKUs — 3 below threshold

✅ Shopify skill OK
```

If you see errors, check:
- Credentials in `.env` are correct
- API key has the right permissions
- Store URL has no trailing slash (Shopify) / no path (WooCommerce)

---

## Step 6 — Connect Delivery Channel

### Telegram (recommended — easiest setup)

1. Open Telegram and message `@BotFather`
2. Send `/newbot`
3. Name it e.g. "LotionLab Agent"
4. Username e.g. `lotionlab_agent_bot`
5. Copy the token BotFather gives you
6. Start a chat with your new bot, then get the chat ID:
   ```
   https://api.telegram.org/bot[TOKEN]/getUpdates
   ```
7. Look for `"chat":{"id":123456789}` — that number is the chat ID

Add to `.env`:
```env
TELEGRAM_BOT_TOKEN=xxxxx
TELEGRAM_CHAT_ID=123456789
```

### WhatsApp (via Twilio)

1. Create a Twilio account at [twilio.com](https://twilio.com)
2. Enable WhatsApp Sandbox or buy a number
3. Get Account SID and Auth Token from dashboard
4. Note your Twilio WhatsApp number (format: `+14155238886` for sandbox)

Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+447700000000
```

---

## Step 7 — First Conversation Test

Start an OpenClaw chat:
```bash
openclaw chat
```

Send:
```
Use the shopify skill to get today's revenue summary
```

OpenClaw should invoke `skills/shopify.js → getDailyRevenue()` and return a clean summary.

Then test:
```
Check my Shopify inventory for anything below reorder level
```

If both work, the client is live.

---

## Step 8 — Handover to Client

Send the client:
1. Their Telegram bot link (or WhatsApp number)
2. A short voice note showing how to use it
3. List of what the agent monitors and when briefings arrive
4. One-pager: "Things your agent does automatically" + "Things you need to ask for"

---

## Checklist — Client Live

- [ ] USER.md filled in completely
- [ ] SOUL.md has correct store name
- [ ] API credentials tested and working
- [ ] Skills return correct data
- [ ] Delivery channel connected and tested
- [ ] PM2 running and surviving reboots
- [ ] Client sent onboarding message and knows how to use it
