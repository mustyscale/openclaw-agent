# Setup Guide 2 — Developer Environment & OpenClaw Install

Do this after Guide 1. You can do this remotely over SSH if the Mac Mini is already set up.

Budget 30 minutes.

---

## 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After install, add to PATH:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

---

## 2. Install Node.js, Git, and PM2

```bash
# Node.js (LTS)
brew install node

# Git
brew install git

# PM2 — keeps OpenClaw running 24/7, restarts on crash
npm install -g pm2
pm2 startup   # run the sudo command it outputs — this makes PM2 start on boot
```

Verify:
```bash
node --version   # should be v18+
```

---

## 3. Install OpenClaw

OpenClaw is the agent framework. It handles the Claude connection, scheduling, memory, and delivery. You don't rebuild any of that — you just install it.

```bash
npm install -g openclaw
```

Verify:
```bash
openclaw --version
```

**Important:** OpenClaw uses your Claude account token — not an Anthropic API key.
This means the client pays a flat $90/month for Claude Max. No per-token billing. No surprise invoices.

---

## 4. Get the Claude Account Token

The client needs a **Claude Max** account ($90/month). Recommended over Pro — unlimited usage, no rate limiting.

To get the session token:
1. Go to [claude.ai](https://claude.ai) and sign in on the Mac Mini
2. Open DevTools → `Cmd+Option+I`
3. Go to **Application → Cookies → claude.ai**
4. Find the cookie named `sessionKey`
5. Copy the full value

**This is the only credential OpenClaw needs to talk to Claude. Treat it like a password. Store it in your password manager under this client.**

---

## 5. Configure OpenClaw

```bash
mkdir -p ~/.openclaw
nano ~/.openclaw/config.json
```

Paste and fill in:
```json
{
  "claudeToken": "sk-ant-sid03-...",
  "model": "claude-opus-4-5",
  "contextFiles": [
    "~/.openclaw/SOUL.md",
    "~/.openclaw/USER.md",
    "~/.openclaw/MEMORY.md"
  ]
}
```

Save: `Ctrl+X` → `Y` → `Enter`

---

## 6. Install the E-commerce Skills Pack

This is our repo. Public — no authentication needed. Clone it once, shared across every client on this machine.

```bash
mkdir -p ~/openclaw/skills
git clone https://github.com/mustyscale/openclaw-agent.git ~/openclaw/skills/ecommerce
cd ~/openclaw/skills/ecommerce
npm install
```

Repo structure:
```
ecommerce/
├── skills/
│   ├── shopify.js        ← tools OpenClaw calls for Shopify data
│   ├── woocommerce.js    ← tools for WooCommerce data
│   └── klaviyo.js        ← tools for Klaviyo email data
├── connectors/
│   ├── shopify.js        ← raw Shopify API calls
│   ├── woocommerce.js    ← raw WooCommerce API calls
│   └── klaviyo.js        ← raw Klaviyo API calls
├── templates/
│   ├── SOUL.md           ← agent personality template
│   ├── USER.md           ← store owner context template
│   └── MEMORY.md         ← long-term memory template
└── setup/                ← these guides
```

---

## 7. Copy Context Templates

```bash
cp ~/openclaw/skills/ecommerce/templates/SOUL.md ~/.openclaw/SOUL.md
cp ~/openclaw/skills/ecommerce/templates/USER.md ~/.openclaw/USER.md
cp ~/openclaw/skills/ecommerce/templates/MEMORY.md ~/.openclaw/MEMORY.md
```

You'll fill these in during client onboarding (Guide 3).

---

## 8. Install Optional Skills

**QMD** (persistent memory + scheduling — install this one):
```bash
npm install -g openclaw-qmd
```
This lets OpenClaw update MEMORY.md automatically and run recurring tasks (daily briefing, stock checks etc.) without you having to set up cron jobs.

**Brave Search** (lets the agent search the web):
```bash
npm install -g openclaw-brave-search
```
Get a free API key at [brave.com/search/api](https://brave.com/search/api) — free tier is 2,000 queries/month.
Add `BRAVE_API_KEY=your_key` to `~/.openclaw/.env`

**Groq** (voice note transcription):
```bash
npm install -g openclaw-groq
```
Free API key at [console.groq.com](https://console.groq.com).
Add `GROQ_API_KEY=your_key` to `~/.openclaw/.env`

---

## 9. Test OpenClaw

```bash
openclaw chat
```

Type:
```
What's today's date and what can you help me with?
```

If you get a sensible response, OpenClaw is working. Type `exit` to quit.

---

## 10. Run OpenClaw via PM2

Create the startup script:
```bash
mkdir -p ~/openclaw/run
cat > ~/openclaw/run/start.sh << 'EOF'
#!/bin/bash
cd ~/.openclaw
openclaw start --config config.json
EOF
chmod +x ~/openclaw/run/start.sh
```

Start with PM2:
```bash
pm2 start ~/openclaw/run/start.sh --name "openclaw"
pm2 save
```

Check it's running:
```bash
pm2 status
pm2 logs openclaw --lines 20
```

---

## Checklist Before Moving to Guide 3

- [ ] Homebrew, Node.js, Git, PM2 installed
- [ ] `pm2 startup` run — PM2 survives reboots
- [ ] OpenClaw installed (`openclaw --version` works)
- [ ] Claude Max account signed in, session token in `config.json`
- [ ] Skills repo cloned to `~/openclaw/skills/ecommerce`
- [ ] Context templates copied to `~/.openclaw/`
- [ ] QMD skill installed
- [ ] `openclaw chat` responds correctly
- [ ] PM2 running OpenClaw and saved
