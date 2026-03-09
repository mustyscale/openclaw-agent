/**
 * Job: Daily Revenue Briefing
 *
 * Runs every morning at BRIEFING_HOUR (default 8 AM).
 * Fetches yesterday's orders, builds a summary, asks Claude to write
 * a human-readable briefing, and sends it to all enabled channels.
 *
 * Run manually: node jobs/daily-briefing.js --test
 */

require("dotenv").config();
const logger = require("../utils/logger");
const deliver = require("../delivery/index");
const claude = require("../ai/claude");

// Auto-detect which store connector to use
const platform = process.env.SHOPIFY_STORE_URL ? "shopify" : "woocommerce";
const store = platform === "shopify"
  ? require("../connectors/shopify")
  : require("../connectors/woocommerce");

const klaviyo = process.env.KLAVIYO_API_KEY ? require("../connectors/klaviyo") : null;

const JOB_NAME = "daily-briefing";

async function run() {
  logger.job(JOB_NAME, "Starting daily briefing...");

  try {
    // 1. Fetch yesterday's orders
    const orders = await store.getYesterdayOrders();
    logger.job(JOB_NAME, `Fetched ${orders.length} orders from yesterday`);

    // 2. Build summary
    const summary = store.buildRevenueSummary(orders);
    logger.job(JOB_NAME, `Revenue: ${summary.currency} ${summary.revenue} | Orders: ${summary.orderCount}`);

    // 3. Fetch Klaviyo data (optional)
    let klaviyoData = null;
    if (klaviyo) {
      klaviyoData = await klaviyo.getWeeklySummary();
      logger.job(JOB_NAME, `Klaviyo: ${klaviyoData.campaignCount} campaign(s) this week`);
    }

    // 4. Ask Claude to write the briefing
    const message = await claude.generateDailyBriefing(summary, klaviyoData);
    if (!message) throw new Error("Claude returned empty response");

    logger.job(JOB_NAME, "Claude briefing generated");

    // 5. Deliver
    await deliver.send(message);
    logger.success(`${JOB_NAME} complete`);

  } catch (err) {
    logger.error(`${JOB_NAME} failed`, err);

    // Send a fallback error alert so client knows something went wrong
    await deliver.send(
      `⚠️ OpenClaw: Daily briefing failed to run. Error: ${err.message}\nWe're looking into it.`
    );
  }
}

// Allow running directly for testing: node jobs/daily-briefing.js --test
if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
