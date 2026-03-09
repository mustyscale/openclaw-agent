# Setup Guide 1 — Mac Mini Hardware & Remote Access

This guide covers unboxing, configuring, and securing a Mac Mini for a new client.
Takes about 45 minutes from scratch.

---

## Hardware

- Mac Mini M2 (8GB RAM minimum — 16GB if client has heavy Shopify volume)
- Ethernet cable — use wired, not Wi-Fi, for reliability
- Place it somewhere with good ventilation and always-on power

---

## Step 1 — Initial Mac Setup

On first boot, work through macOS Setup Assistant:

1. Language / region — match client's timezone
2. Sign in with Apple ID — use the client's Apple ID, not yours
3. Enable **FileVault** encryption — yes, always
4. Disable **Screen Time** — not needed
5. Skip Siri setup
6. Skip iCloud Drive for now — not needed for this

Set computer name:
```
System Settings → General → About → Name
```
Use format: `[StoreName]-Agent` (e.g. `LotionLab-Agent`)

---

## Step 2 — Enable Remote Login (SSH)

```
System Settings → General → Sharing → Remote Login → ON
```

Allow access for: your admin user only.

Test from your machine:
```bash
ssh username@[mac-mini-local-ip]
```

---

## Step 3 — Install Tailscale (Remote Access)

Tailscale gives you secure remote access from anywhere without port forwarding.

1. Go to [tailscale.com/download](https://tailscale.com/download) on the Mac Mini
2. Download macOS client
3. Sign in (use your Tailscale account — not the client's)
4. Enable "Start on login"
5. Note the Tailscale IP (format: `100.x.x.x`)

From now on, SSH in from anywhere:
```bash
ssh username@100.x.x.x
```

Enable SSH over Tailscale:
```
System Settings → General → Sharing → Remote Login → Allow full disk access → ON
```

---

## Step 4 — Keep It Always On

```
System Settings → Battery → Options
```

- Prevent automatic sleeping when on power adapter: **ON**
- Wake for network access: **ON**
- Start up automatically after power failure: **ON**

---

## Step 5 — Create Agent User (Optional but Recommended)

For cleaner separation, create a dedicated user for the agent:

```bash
# From your admin account
sudo dscl . -create /Users/agent
sudo dscl . -create /Users/agent UserShell /bin/zsh
sudo dscl . -create /Users/agent RealName "Agent"
sudo dscl . -create /Users/agent UniqueID 502
sudo dscl . -create /Users/agent PrimaryGroupID 20
sudo dscl . -create /Users/agent NFSHomeDirectory /Users/agent
sudo dscl . -passwd /Users/agent [strong-password]
sudo createhomedir -c -u agent
```

Then log in as `agent` for the rest of the setup.

---

## Checklist Before Moving to Step 2

- [ ] Mac Mini has a name (e.g. `LotionLab-Agent`)
- [ ] FileVault enabled
- [ ] Remote Login (SSH) enabled
- [ ] Tailscale installed and signed in
- [ ] You can SSH in remotely
- [ ] Auto-sleep disabled
- [ ] Power failure auto-restart enabled
