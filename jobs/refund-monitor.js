/**
 * Job: Refund Spike Monitor
 *
 * Runs every REFUND_MONITOR_INTERVAL_MIN (default: 60 min).
 * Looks for an unusual concentration of refunds on the same SKU
 * within the last REFUND_SPIKE_WINDOW_HOURS hours.
 * Only alerts once per spike (uses state to prevent repeat alerts).
 *
 * Run manually: node jobs/refund-monitor.js --test
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

const JOB_NAME = "refund-monitor";
const SPIKE_COUNT = parseInt(process.env.REFUND_SPIKE_COUNT || 5);
const WINDOW_HOURS = parseFloat(process.env.REFUND_SPIKE_WINDOW_HOURS || 2);

async function run() {
  logger.job(JOB_NAME, `Checking refunds (spike threshold: ${SPIKE_COUNT} in ${WINDOW_HOURS}h)...`);

  try {
    // 1. Get recently refunded orders
    let refundedOrders = [];

    if (platform === "shopify") {
      refundedOrders = await store.getRecentRefunds(WINDOW_HOURS);
    } else {
      // WooCommerce: fetch orders updated recently and filter refunded
      const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
      const orders = await store.getOrdersSince(since);
      refundedOrders = orders.filter((o) => o.status === "refunded");
    }

    if (refundedOrders.length < SPIKE_COUNT) {
      logger.job(JOB_NAME, `${refundedOrders.length} refund(s) in window — below spike threshold`);
      return;
    }

    // 2. Group by product SKU to find concentrated spikes
    const skuMap = {};
    for (const order of refundedOrders) {
      const items = order.line_items || [];
      for (const item of items) {
        const key = item.sku || item.product_id || item.name;
        if (!skuMap[key]) {
          skuMap[key] = {
            product_name: item.title || item.name,
            sku: item.sku,
            refund_count: 0,
            order_ids: [],
          };
        }
        skuMap[key].refund_count++;
        skuMap[key].order_ids.push(order.id || order.number);
      }
    }

    // 3. Find SKUs that breached the spike threshold
    const spikes = Object.values(skuMap).filter((s) => s.refund_count >= SPIKE_COUNT);

    if (spikes.length === 0) {
      logger.job(JOB_NAME, "Refunds spread across products — no single-SKU spike detected");
      return;
    }

    // 4. Check if we already alerted for these spikes recently
    const lastSpikeAlert = state.get("refund_spike_last_alert");
    const lastSpikeSkus = state.get("refund_spike_last_skus") || [];
    const currentSpikeSkus = spikes.map((s) => s.sku || s.product_name);

    // If same SKUs alerted in last 6 hours, skip
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    const alreadyAlerted =
      lastSpikeAlert &&
      lastSpikeAlert > sixHoursAgo &&
      currentSpikeSkus.every((s) => lastSpikeSkus.includes(s));

    if (alreadyAlerted) {
      logger.job(JOB_NAME, "Spike already alerted in last 6 hours — skipping");
      return;
    }

    // 5. Update state
    state.set("refund_spike_last_alert", Date.now());
    state.set("refund_spike_last_skus", currentSpikeSkus);

    logger.job(JOB_NAME, `Spike detected on ${spikes.length} product(s) — sending alert`);

    // 6. Ask Claude to analyze
    const message = await claude.analyzeRefundSpike({
      spikes,
      totalRefunds: refundedOrders.length,
      windowHours: WINDOW_HOURS,
      spikeThreshold: SPIKE_COUNT,
    });

    if (!message) return;

    await deliver.send(message);
    logger.success(`${JOB_NAME} — spike alert sent`);

  } catch (err) {
    logger.error(`${JOB_NAME} failed`, err);
  }
}

// Direct run for testing
if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
