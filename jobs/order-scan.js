/**
 * Job: Order Scan
 *
 * Runs every ORDER_SCAN_INTERVAL_MIN (default: 30 minutes).
 * Fetches orders since the last scan, flags anything unusual,
 * and only sends a message if something needs attention.
 * Tracks last-seen order IDs in state so we never double-alert.
 *
 * Run manually: node jobs/order-scan.js --test
 */

require("dotenv").config();
const logger = require("../utils/logger");
const deliver = require("../delivery/index");
const claude = require("../ai/claude");
const state = require("../utils/state");

const platform = process.env.SHOPIFY_STORE_URL ? "shopify" : "woocommerce";
const store = platform === "shopify"
  ? require("../connectors/shopify")
  : require("../connectors/woocommerce");

const JOB_NAME = "order-scan";
const THRESHOLD = parseFloat(process.env.HIGH_VALUE_ORDER_THRESHOLD || 500);
const INTERVAL_MIN = parseInt(process.env.ORDER_SCAN_INTERVAL_MIN || 30);

async function run() {
  logger.job(JOB_NAME, "Scanning for new orders...");

  try {
    // 1. Get timestamp of last scan
    const lastScanISO = state.get("order_scan_last_run") || new Date(Date.now() - INTERVAL_MIN * 60 * 1000).toISOString();
    const seenOrderIds = new Set(state.get("order_scan_seen_ids") || []);

    // 2. Fetch orders since last scan
    const orders = await store.getOrdersSince(lastScanISO);

    // 3. Filter out already-seen orders
    const newOrders = orders.filter((o) => !seenOrderIds.has(String(o.id)));

    logger.job(JOB_NAME, `${newOrders.length} new order(s) since last scan`);

    if (newOrders.length === 0) {
      // Nothing new — update timestamp and exit silently
      state.set("order_scan_last_run", new Date().toISOString());
      return;
    }

    // 4. Update state — mark these orders as seen
    const newIds = newOrders.map((o) => String(o.id));
    const updatedIds = [...seenOrderIds, ...newIds].slice(-500); // keep last 500
    state.set("order_scan_seen_ids", updatedIds);
    state.set("order_scan_last_run", new Date().toISOString());

    // 5. Check if any need flagging
    const highValue = newOrders.filter((o) => {
      const total = parseFloat(o.total_price || o.total || 0);
      return total >= THRESHOLD;
    });

    const needsAlert = highValue.length > 0;

    if (!needsAlert) {
      logger.job(JOB_NAME, `${newOrders.length} new order(s) — all clear, no flags`);
      return;
    }

    // 6. Ask Claude to analyze and write the alert
    const message = await claude.analyzeNewOrders(newOrders, THRESHOLD);
    if (!message) return;

    await deliver.send(message);
    logger.success(`${JOB_NAME} — alert sent for ${highValue.length} flagged order(s)`);

  } catch (err) {
    logger.error(`${JOB_NAME} failed`, err);
  }
}

// Direct run for testing
if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
