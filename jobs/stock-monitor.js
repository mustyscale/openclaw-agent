/**
 * Job: Stock Monitor
 *
 * Runs every STOCK_MONITOR_INTERVAL_MIN (default: 60 minutes).
 * Checks all SKUs against LOW_STOCK_THRESHOLD.
 * Only alerts when stock crosses below threshold — not every run.
 * Uses state to avoid sending the same alert repeatedly.
 *
 * Run manually: node jobs/stock-monitor.js --test
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

const JOB_NAME = "stock-monitor";
const THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || 20);

// How long before re-alerting on the same SKU (default: 24 hours)
const RECHECK_HOURS = 24;

async function run() {
  logger.job(JOB_NAME, `Checking inventory levels (threshold: ${THRESHOLD} units)...`);

  try {
    // 1. Get all inventory levels
    const items = await store.getInventoryLevels();
    logger.job(JOB_NAME, `Fetched ${items.length} SKU(s)`);

    // 2. Filter items below threshold that actually track stock
    const lowStock = items.filter((item) => {
      const qty = item.inventory_quantity;
      const tracks = item.manage_stock !== false; // WooCommerce flag
      return tracks && qty !== null && qty <= THRESHOLD;
    });

    if (lowStock.length === 0) {
      logger.job(JOB_NAME, "All SKUs above threshold — no alerts needed");
      return;
    }

    // 3. Filter out SKUs we already alerted on recently
    const alertedSkus = state.get("stock_alerted_skus") || {};
    const now = Date.now();
    const recheckMs = RECHECK_HOURS * 60 * 60 * 1000;

    const newlyLowStock = lowStock.filter((item) => {
      const key = item.sku || `${item.product_id}-${item.variant_id}`;
      const lastAlert = alertedSkus[key];
      return !lastAlert || now - lastAlert > recheckMs;
    });

    if (newlyLowStock.length === 0) {
      logger.job(JOB_NAME, `${lowStock.length} low-stock SKU(s) — already alerted within ${RECHECK_HOURS}h`);
      return;
    }

    // 4. Update state
    const updatedAlerts = { ...alertedSkus };
    for (const item of newlyLowStock) {
      const key = item.sku || `${item.product_id}-${item.variant_id}`;
      updatedAlerts[key] = now;
    }
    state.set("stock_alerted_skus", updatedAlerts);

    logger.job(JOB_NAME, `${newlyLowStock.length} SKU(s) need stock alert`);

    // 5. Format data for Claude
    const alertItems = newlyLowStock.map((item) => ({
      product: item.product_title,
      variant: item.variant_title || null,
      sku: item.sku,
      current_qty: item.inventory_quantity,
      threshold: THRESHOLD,
    }));

    // 6. Ask Claude to write the alert
    const message = await claude.generateStockAlert(alertItems);
    if (!message) return;

    await deliver.send(message);
    logger.success(`${JOB_NAME} — stock alert sent for ${newlyLowStock.length} SKU(s)`);

  } catch (err) {
    logger.error(`${JOB_NAME} failed`, err);
  }
}

// Direct run for testing
if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
