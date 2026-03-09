/**
 * OpenClaw Agent — Entry Point
 *
 * Starts all enabled job schedulers.
 * Managed by PM2 on the client's Mac Mini.
 *
 * Start:  pm2 start index.js --name "openclaw-<clientid>"
 * Logs:   pm2 logs openclaw-<clientid>
 * Status: pm2 status
 */

require("dotenv").config();
const cron = require("node-cron");
const logger = require("./utils/logger");

const CLIENT_NAME = process.env.CLIENT_NAME || "Unknown Client";
const CLIENT_ID = process.env.CLIENT_ID || "client";
const TIMEZONE = process.env.TIMEZONE || "UTC";

// ── Jobs ──────────────────────────────────────────────────────────────────────
const dailyBriefing = require("./jobs/daily-briefing");
const orderScan = require("./jobs/order-scan");
const stockMonitor = require("./jobs/stock-monitor");
const refundMonitor = require("./jobs/refund-monitor");

// ── Startup ───────────────────────────────────────────────────────────────────
logger.info(`OpenClaw starting for client: ${CLIENT_NAME} (${CLIENT_ID})`);
logger.info(`Timezone: ${TIMEZONE}`);
logger.info(`Platform: ${process.env.SHOPIFY_STORE_URL ? "Shopify" : "WooCommerce"}`);

// ── 1. Daily Briefing ─────────────────────────────────────────────────────────
const briefingHour = process.env.BRIEFING_HOUR || "8";
const briefingMinute = process.env.BRIEFING_MINUTE || "0";
const briefingCron = `${briefingMinute} ${briefingHour} * * *`;

cron.schedule(briefingCron, () => {
  logger.job("scheduler", `Daily briefing triggered (${briefingHour}:${String(briefingMinute).padStart(2, "0")} ${TIMEZONE})`);
  dailyBriefing.run();
}, { timezone: TIMEZONE });

logger.info(`Daily briefing scheduled: ${briefingHour}:${String(briefingMinute).padStart(2, "0")} ${TIMEZONE}`);

// ── 2. Order Scan ─────────────────────────────────────────────────────────────
if (process.env.ORDER_SCAN_ENABLED !== "false") {
  const orderInterval = parseInt(process.env.ORDER_SCAN_INTERVAL_MIN || 30);
  const orderCron = `*/${orderInterval} * * * *`;

  cron.schedule(orderCron, () => {
    logger.job("scheduler", `Order scan triggered (every ${orderInterval} min)`);
    orderScan.run();
  }, { timezone: TIMEZONE });

  logger.info(`Order scan scheduled: every ${orderInterval} minutes`);

  // Run immediately on startup so we don't wait for first interval
  setTimeout(() => orderScan.run(), 5000);
}

// ── 3. Stock Monitor ──────────────────────────────────────────────────────────
if (process.env.STOCK_MONITOR_ENABLED !== "false") {
  const stockInterval = parseInt(process.env.STOCK_MONITOR_INTERVAL_MIN || 60);
  const stockCron = `0 */${Math.min(stockInterval, 60) === 60 ? "*" : `*/${stockInterval}`} * * *`;

  // Simpler: run every hour on the hour
  cron.schedule(`0 * * * *`, () => {
    logger.job("scheduler", "Stock monitor triggered (hourly)");
    stockMonitor.run();
  }, { timezone: TIMEZONE });

  logger.info("Stock monitor scheduled: every hour");

  // Run shortly after startup
  setTimeout(() => stockMonitor.run(), 10000);
}

// ── 4. Refund Monitor ─────────────────────────────────────────────────────────
if (process.env.REFUND_MONITOR_ENABLED !== "false") {
  const refundInterval = parseInt(process.env.REFUND_MONITOR_INTERVAL_MIN || 60);

  cron.schedule(`0 * * * *`, () => {
    logger.job("scheduler", "Refund monitor triggered (hourly)");
    refundMonitor.run();
  }, { timezone: TIMEZONE });

  logger.info("Refund monitor scheduled: every hour");
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received — shutting down");
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", err);
  // Don't exit — PM2 will restart if needed, but log the error
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
});

logger.success(`OpenClaw is running. All jobs scheduled. ✓`);
