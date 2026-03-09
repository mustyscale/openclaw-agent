/**
 * PM2 Ecosystem Config
 *
 * Use this when running multiple clients on the same Mac Mini.
 * Each client gets its own process with its own .env file.
 *
 * Start all: pm2 start ecosystem.config.js
 * Start one: pm2 start ecosystem.config.js --only openclaw-brandname
 * Status:    pm2 status
 * Logs:      pm2 logs openclaw-brandname
 * Save:      pm2 save  (must run after adding new clients)
 */

module.exports = {
  apps: [
    // ── CLIENT TEMPLATE ─────────────────────────────────────────────────────
    // Duplicate this block for each new client.
    // Each client has their own folder under clients/<clientid>/
    // with their own .env file inside.
    {
      name: "openclaw-example",
      script: "./index.js",
      cwd: "/Users/mac/openclaw/clients/example",   // ← change per client
      env_file: "/Users/mac/openclaw/clients/example/.env",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/Users/mac/openclaw/logs/example-error.log",
      out_file: "/Users/mac/openclaw/logs/example-out.log",
    },

    // ── ADD MORE CLIENTS BELOW ────────────────────────────────────────────
    // {
    //   name: "openclaw-brandname",
    //   script: "./index.js",
    //   cwd: "/Users/mac/openclaw/clients/brandname",
    //   env_file: "/Users/mac/openclaw/clients/brandname/.env",
    //   watch: false,
    //   autorestart: true,
    // },
  ],
};
