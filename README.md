# OpenClaw Agent

AI agent for e-commerce stores. Monitors orders, inventory, support & marketing 24/7.
Powered by Claude (Anthropic). Delivers to WhatsApp, Telegram, or Slack.

---

## What it does

| Job | Schedule | What it sends |
|---|---|---|
| `daily-briefing` | Every day at 8 AM | Revenue, orders, AOV, refund rate, top products |
| `order-scan` | Every 30 min | Flags high-value or unusual orders |
| `stock-monitor` | Every hour | Alerts when SKUs drop below reorder threshold |
| `refund-monitor` | Every hour | Detects refund spikes on specific products |

---

## Setup (per client)

### 1. Clone the repo into a client folder

```bash
mkdir -p ~/openclaw/clients
git clone https://github.com/mustyscale/openclaw-agent ~/openclaw/clients/CLIENTNAME
cd ~/openclaw/clients/CLIENTNAME
npm install
```

### 2. Create their `.env`

```bash
cp .env.example .env
nano .env   # fill in their credentials
```

Minimum required:
- `ANTHROPIC_API_KEY`
- `SHOPIFY_STORE_URL` + `SHOPIFY_ACCESS_TOKEN` (or WooCommerce equivalents)
- At least one delivery channel: `WHATSAPP_ENABLED=true` or `TELEGRAM_ENABLED=true`

### 3. Test each job manually

```bash
node jobs/daily-briefing.js   # should send a WhatsApp/Telegram message
node jobs/stock-monitor.js    # check inventory levels
node jobs/order-scan.js       # scan recent orders
node jobs/refund-monitor.js   # check for refund spikes
```

### 4. Start with PM2

```bash
pm2 start index.js --name "openclaw-CLIENTNAME"
pm2 save   # persists across reboots
```

### 5. Verify it's running

```bash
pm2 status
pm2 logs openclaw-CLIENTNAME --lines 30
```

---

## Running multiple clients

Add each client to `ecosystem.config.js`, then:

```bash
pm2 start ecosystem.config.js
pm2 save
```

Each client runs as an isolated PM2 process with its own `.env`.

---

## Shopify API Setup

1. Shopify Admin → Settings → Apps → Develop apps → Create an app
2. Configure Admin API scopes: `read_orders`, `read_products`, `read_inventory`, `read_customers`
3. Install the app → copy the **Admin API access token**
4. Paste into `.env` as `SHOPIFY_ACCESS_TOKEN`

## WooCommerce API Setup

1. WooCommerce → Settings → Advanced → REST API → Add key
2. Permissions: **Read**
3. Copy Consumer Key + Consumer Secret into `.env`

## WhatsApp Setup (Twilio)

1. Create account at [twilio.com](https://twilio.com)
2. Console → Messaging → Try it out → Send a WhatsApp message
3. Follow sandbox activation (client texts "join <word>" once)
4. Copy `Account SID`, `Auth Token` into `.env`
5. `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` (sandbox number)
6. `WHATSAPP_TO=whatsapp:+CLIENT_NUMBER`

## Telegram Setup (free)

1. Open Telegram → message `@BotFather`
2. `/newbot` → follow prompts → copy token
3. Start a chat with the bot (client messages it once)
4. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Copy `chat_id` from the response

---

## Remote Management (Tailscale)

```bash
# On the Mac Mini
brew install tailscale && sudo tailscale up

# From anywhere
ssh client@<tailscale-ip>
pm2 logs openclaw-CLIENTNAME
pm2 restart openclaw-CLIENTNAME
```

---

## Project Structure

```
openclaw-agent/
├── index.js                  ← PM2 entry point, starts all schedulers
├── ecosystem.config.js       ← Multi-client PM2 config
├── jobs/
│   ├── daily-briefing.js     ← 8 AM revenue summary
│   ├── order-scan.js         ← every 30 min order check
│   ├── stock-monitor.js      ← hourly stock level check
│   └── refund-monitor.js     ← hourly refund spike detection
├── connectors/
│   ├── shopify.js            ← Shopify Admin API
│   ├── woocommerce.js        ← WooCommerce REST API
│   └── klaviyo.js            ← Klaviyo API
├── delivery/
│   ├── index.js              ← routes to all enabled channels
│   ├── whatsapp.js           ← Twilio WhatsApp
│   ├── telegram.js           ← Telegram Bot API
│   └── slack.js              ← Slack Webhooks
├── ai/
│   └── claude.js             ← Anthropic Claude (all AI calls)
└── utils/
    ├── logger.js             ← timestamped, PM2-friendly logging
    └── state.js              ← JSON file state (seen orders, alerted SKUs)
```
