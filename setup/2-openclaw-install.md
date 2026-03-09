# Setup Guide 2 — OpenClaw Installation

This guide installs the OpenClaw agent framework on the Mac Mini.
Do this after completing Guide 1.

---

## What OpenClaw Is

OpenClaw is an autonomous agent framework that runs on top of Claude.
It handles:
- Conversations with Claude (using your Claude Pro/Max account token)
- Persistent memory via SOUL.md, USER.md, MEMORY.md
- Skill execution (our e-commerce tools plug in here)
- Scheduling via QMD skill
- Delivery (WhatsApp, Telegram, Slack) via built-in connectors

You do NOT need an Anthropic API key. OpenClaw uses your Claude account token.
This means the client pays ~$90/month for Claude Max — not per-token billing.

---

## Step 1 — Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After install, add to PATH:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 2 — Install Node.js

```bash
brew install node
```

Verify:
```bash
node --version   # should be 18+
npm --version
```

---

## Step 3 — Install OpenClaw

```bash
npm install -g openclaw
```

Verify:
```bash
openclaw --version
```

---

## Step 4 — Get Claude Account Token

The client needs a **Claude Pro or Claude Max** account ($20/month or $90/month).
The $90/month Max plan is recommended — unlimited usage, no throttling.

To get the token:
1. Go to [claude.ai](https://claude.ai) and sign in
2. Open DevTools (Cmd+Option+I)
3. Go to Application → Cookies → `claude.ai`
4. Find the cookie named `sessionKey`
5. Copy the value — this is the token

**Keep this secure. Treat it like a password.**

---

## Step 5 — Configure OpenClaw

Create the OpenClaw config directory:
```bash
mkdir -p ~/.openclaw
```

Create the config file:
```bash
nano ~/.openclaw/config.json
```

Paste:
```json
{
  "claudeToken": "sk-ant-...",
  "model": "claude-opus-4-5",
  "contextFiles": [
    "~/.openclaw/SOUL.md",
    "~/.openclaw/USER.md",
    "~/.openclaw/MEMORY.md"
  ]
}
```

Save: `Ctrl+X`, `Y`, `Enter`.

---

## Step 6 — Copy Context Templates

From the openclaw-agent repo:
```bash
cp ~/openclaw-agent/templates/SOUL.md ~/.openclaw/SOUL.md
cp ~/openclaw-agent/templates/USER.md ~/.openclaw/USER.md
cp ~/openclaw-agent/templates/MEMORY.md ~/.openclaw/MEMORY.md
```

Now fill in the placeholders in each file (see Guide 3 — Client Onboarding).

---

## Step 7 — Test OpenClaw

```bash
openclaw chat
```

You should see a prompt. Type:
```
What's today's date?
```

If you get a response, OpenClaw is working.

Type `exit` to quit.

---

## Step 8 — Install Optional Skills

**Brave Search** (lets agent search the web):
```bash
npm install -g openclaw-brave-search
export BRAVE_API_KEY=your_key_here
```

Get a free Brave Search API key at [brave.com/search/api](https://brave.com/search/api).
Free tier: 2,000 queries/month. More than enough.

**Groq Voice** (lets agent transcribe voice notes):
```bash
npm install -g openclaw-groq
export GROQ_API_KEY=your_key_here
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

**QMD** (persistent memory and scheduling — important):
```bash
npm install -g openclaw-qmd
```

This skill lets OpenClaw update MEMORY.md automatically and schedule recurring tasks.

---

## Step 9 — Run OpenClaw in Background with PM2

Install PM2:
```bash
npm install -g pm2
```

Create a startup script:
```bash
mkdir -p ~/openclaw-run
nano ~/openclaw-run/start.sh
```

Paste:
```bash
#!/bin/bash
cd ~/.openclaw
openclaw start --config config.json
```

Make executable:
```bash
chmod +x ~/openclaw-run/start.sh
```

Start with PM2:
```bash
pm2 start ~/openclaw-run/start.sh --name "openclaw-[clientname]"
pm2 save
pm2 startup
```

Run the `sudo env PATH=...` command PM2 outputs. This makes it survive reboots.

---

## Checklist Before Moving to Step 3

- [ ] Homebrew installed
- [ ] Node.js 18+ installed
- [ ] OpenClaw installed globally (`openclaw --version` works)
- [ ] Claude account token obtained and saved to `config.json`
- [ ] Context templates copied to `~/.openclaw/`
- [ ] `openclaw chat` responds correctly
- [ ] Brave Search API key set (optional)
- [ ] QMD skill installed
- [ ] PM2 running OpenClaw, survives reboot
