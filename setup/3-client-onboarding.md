# Setup Guide 3 — Client Onboarding

One client = one `.env` file + filled-in context templates.
Everything else (OpenClaw, skills repo, PM2) is already set up from Guide 2.

Budget 30 minutes per client.

---

## 1. Create the Client's .env

The skills repo reads credentials from `.env`. Each client gets their own copy.

```bash
cd ~/openclaw/skills/ecommerce
cp .env.example .env
nano .env
```

Fill in everything that applies:

```env
# Store — fill in whichever platform they use
SHOPIFY_STORE_URL=brandname.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...

WOOCOMMERCE_URL=https://their-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...

# Email (optional)
KLAVIYO_API_KEY=pk_...

# Delivery — pick whichever channel the client prefers
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+[client-number]

SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Thresholds — match what they told you in the onboarding call
HIGH_VALUE_ORDER_THRESHOLD=500
LOW_STOCK_THRESHOLD=20
REFUND_SPIKE_COUNT=5
REFUND_SPIKE_WINDOW_HOURS=2

# Timezone
TIMEZONE=Europe/London
```

**Never commit `.env` to git. It stays on the Mac Mini only. Back it up to your password manager.**

---

## 2. Get the API Credentials

### Shopify

1. `[store].myshopify.com/admin/settings/apps` → Develop apps → Create app
2. Name: `OpenClaw Agent`
3. Admin API scopes: `read_orders`, `read_products`, `read_inventory`, `read_customers`
4. Install app → copy the **Admin API access token** (shown once only)

### WooCommerce

1. `WP Admin → WooCommerce → Settings → Advanced → REST API` → Add key
2. Description: `OpenClaw Agent` — Permissions: **Read**
3. Copy Consumer Key + Consumer Secret (shown once only)

### Klaviyo (optional)

1. `Klaviyo → Account → Settings → API Keys` → Create Private API Key
2. Name: `OpenClaw Agent` — Scopes: Read (Campaigns + Metrics)

### Telegram bot (recommended — easiest for clients)

1. Message `@BotFather` on Telegram → `/newbot`
2. Name: e.g. `LotionLab Agent` — Username: e.g. `lotionlab_agent_bot`
3. Copy the token
4. Start a chat with the new bot (send any message)
5. Get the chat ID:
   ```
   https://api.telegram.org/bot[TOKEN]/getUpdates
   ```
   Look for `"chat":{"id":123456789}` — that number is the chat ID

### WhatsApp (via Twilio — if client prefers WhatsApp)

1. [twilio.com](https://twilio.com) → Console → Messaging → WhatsApp Sandbox
2. Client texts "join [word]" to the sandbox number (one-time activation)
3. Copy Account SID and Auth Token

---

## 3. Fill in the Context Templates

### SOUL.md

Usually needs one change only — replace `[STORE_NAME]`:
```bash
nano ~/.openclaw/SOUL.md
```

Only modify further if the client speaks another language or has a specific tone requirement.

### USER.md

This is where you put everything about the client. Fill it in completely — the more detail, the better the agent.

```bash
nano ~/.openclaw/USER.md
```

Use this as your onboarding call checklist:

```
Name:
Business name:
Location / timezone:
Platform: Shopify / WooCommerce
Store URL:
Product category (e.g. leather bags, supplements, candles):
Average order value (~£___):
Daily order volume (~___ orders/day):
Primary market (UK / USA / Europe / Global):
Currency:

Preferred contact: Telegram / WhatsApp / Slack
Morning briefing time (e.g. 8:00 AM):
Briefing format: bullet points / ultra-short
Alerts: only urgent / all flags

High-value order threshold: £___
Low stock threshold: ___ units
Biggest pain point right now:
Fulfilment: in-house / 3PL / dropship

What to handle automatically:
[ ] Daily revenue briefings
[ ] Low stock alerts
[ ] Refund spike detection
[ ] High-value order flags
[ ] Klaviyo weekly summary
[ ] Ad-hoc questions
```

---

## 4. Test the Skills

```bash
cd ~/openclaw/skills/ecommerce

# Test whichever platform client uses
node skills/shopify.js
```

Expected output:
```
🧪 Testing Shopify skill...

1. Store info:
   LotionLab — GBP

2. Daily revenue:
   GBP 1,420.50 — 19 orders

3. Inventory check:
   84 SKUs — 3 below threshold

✅ Shopify skill OK
```

If you see errors:
- Check credentials in `.env` are correct (copy-paste issues are common)
- Check API key has the right scopes (Shopify is strict about this)
- Shopify URL: no `https://`, no trailing slash — just `brandname.myshopify.com`
- WooCommerce URL: must include `https://`

---

## 5. Launch & Monitor

```bash
# Restart OpenClaw to pick up the new .env and context files
pm2 restart openclaw

# Check it's running
pm2 status

# Watch logs live
pm2 logs openclaw

# Save so it survives reboots
pm2 save
```

---

## 6. Force a Test Briefing

Start an OpenClaw chat and fire the first test:
```bash
openclaw chat
```

Send:
```
Use the shopify skill to get yesterday's revenue summary and give me a morning briefing
```

The client should receive a message via their delivery channel within 30 seconds.

Then test inventory:
```
Check my Shopify inventory for anything below reorder level
```

If both work, the client is live.

---

## 7. Set Up the Daily Briefing Schedule

Still in `openclaw chat`, use the QMD skill to schedule recurring tasks:
```
Using the QMD skill, schedule a daily briefing every morning at 8am.
It should pull getDailyRevenue, checkInventory, and checkRefunds,
then send a summary to the client.
```

OpenClaw registers this and runs it automatically. No cron jobs to maintain.

---

## 8. Handover Checklist (Before You Leave or Sign Off)

```
✅ PM2 running and saved (pm2 status → "online")
✅ PM2 set to start on boot (pm2 startup run)
✅ Test briefing delivered to client's phone
✅ Tailscale connected on both your machine and the Mac Mini
✅ .env backed up to your password manager (Bitwarden / 1Password)
✅ Claude session token backed up to your password manager
✅ Client knows: "don't unplug it, don't close anything"
✅ You can SSH in right now from your phone via Tailscale
✅ Daily briefing scheduled and confirmed
```

---

## 9. Your Remote Management Workflow (After Handover)

```bash
# SSH into client Mac Mini from anywhere
ssh admin@100.x.x.x   # Tailscale IP

# Check agent health
pm2 status

# Read recent logs
pm2 logs openclaw --lines 50

# Pull latest update and restart (repo is public — no auth needed)
cd ~/openclaw/skills/ecommerce
git pull
pm2 restart openclaw

# If something's broken at 2 AM — fix remotely, no site visit needed
```

---

## 10. Cost Per Client (Monthly)

| Item | Cost |
|------|------|
| Mac Mini (amortized over 3 years) | ~$20/mo |
| Electricity (~10W device, always on) | ~$1/mo |
| Claude Max account | $90/mo |
| Twilio WhatsApp | ~$1–3/mo |
| Tailscale | Free (up to 3 devices) |
| Brave Search API | Free (2k queries/mo) |
| **Total** | **~$115/mo** |

You charge **$297/mo** Managed Care.
**Margin per client: ~$180/mo** after costs.

At 10 clients: ~$1,800/mo recurring. At 20: ~$3,600/mo.
The Mac Mini pays for itself in under 2 months per client.
