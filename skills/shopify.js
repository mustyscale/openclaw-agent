/**
 * OpenClaw Skill: Shopify
 *
 * Gives your OpenClaw agent direct access to your Shopify store data.
 * Once installed, your agent can call these tools naturally in conversation.
 *
 * Tell your agent:
 *   "Use the shopify skill to get yesterday's revenue"
 *   "Check my Shopify inventory for low stock items"
 *   "Scan my recent orders and flag anything unusual"
 *
 * Setup: add SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN to your .env
 */

require("dotenv").config();
const axios = require("axios");
const { buildRevenueSummary } = require("../connectors/shopify");

const BASE_URL = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2024-04`;
const HEADERS  = { "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN };

// ── Tool definitions ────────────────────────────────────────────────────────
// These are the functions your OpenClaw agent can invoke.
// Each one fetches real data from Shopify and returns it for the agent to reason about.

const tools = {

  /**
   * Get yesterday's full revenue summary.
   * Agent uses this for the daily briefing.
   */
  async getDailyRevenue() {
    const shopify = require("../connectors/shopify");
    const orders  = await shopify.getYesterdayOrders();
    const summary = buildRevenueSummary(orders);
    return {
      date: new Date(Date.now() - 86400000).toLocaleDateString("en-GB"),
      revenue: summary.revenue,
      currency: summary.currency,
      orderCount: summary.orderCount,
      aov: summary.aov,
      refundRate: `${summary.refundRate}%`,
      topProducts: summary.topProducts,
      highValueOrders: summary.highValueOrders.length,
      internationalOrders: summary.internationalOrders.length,
    };
  },

  /**
   * Scan recent orders (last N hours) for flags.
   * Agent uses this proactively or when asked.
   */
  async scanRecentOrders(hours = 1) {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    const shopify = require("../connectors/shopify");
    const orders  = await shopify.getOrdersSince(since);
    const threshold = parseFloat(process.env.HIGH_VALUE_ORDER_THRESHOLD || 500);

    return {
      totalNew: orders.length,
      highValue: orders
        .filter(o => parseFloat(o.total_price) >= threshold)
        .map(o => ({ id: o.name, total: o.total_price, currency: o.currency })),
      international: orders
        .filter(o => o.shipping_address?.country_code !== "US")
        .map(o => ({ id: o.name, country: o.shipping_address?.country })),
      windowHours: hours,
    };
  },

  /**
   * Get full inventory levels with low-stock flags.
   */
  async checkInventory() {
    const shopify   = require("../connectors/shopify");
    const items     = await shopify.getInventoryLevels();
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || 20);

    const lowStock = items
      .filter(i => i.inventory_quantity !== null && i.inventory_quantity <= threshold)
      .map(i => ({
        product: i.product_title,
        variant: i.variant_title,
        sku: i.sku,
        qty: i.inventory_quantity,
        threshold,
      }));

    return {
      totalSkus: items.length,
      lowStockCount: lowStock.length,
      threshold,
      lowStockItems: lowStock,
      allClear: lowStock.length === 0,
    };
  },

  /**
   * Detect refund spikes in a given time window.
   */
  async checkRefunds(windowHours = 2) {
    const shopify    = require("../connectors/shopify");
    const refunded   = await shopify.getRecentRefunds(windowHours);
    const threshold  = parseInt(process.env.REFUND_SPIKE_COUNT || 5);

    // Group by product
    const byProduct = {};
    for (const order of refunded) {
      for (const item of order.line_items || []) {
        const key = item.title;
        if (!byProduct[key]) byProduct[key] = { product: item.title, count: 0 };
        byProduct[key].count++;
      }
    }

    const spikes = Object.values(byProduct).filter(p => p.count >= threshold);

    return {
      totalRefunds: refunded.length,
      windowHours,
      spikeThreshold: threshold,
      spikes,
      spikeDetected: spikes.length > 0,
    };
  },

  /**
   * Get basic store info (name, currency, plan).
   */
  async getStoreInfo() {
    const shopify = require("../connectors/shopify");
    return await shopify.getShopInfo();
  },
};

// ── Test runner ─────────────────────────────────────────────────────────────
// Run: node skills/shopify.js --test
if (require.main === module) {
  console.log("\n🧪 Testing Shopify skill...\n");

  (async () => {
    try {
      console.log("1. Store info:");
      const info = await tools.getStoreInfo();
      console.log(`   ${info?.name} — ${info?.currency}\n`);

      console.log("2. Daily revenue:");
      const revenue = await tools.getDailyRevenue();
      console.log(`   ${revenue.currency} ${revenue.revenue} — ${revenue.orderCount} orders\n`);

      console.log("3. Inventory check:");
      const inv = await tools.checkInventory();
      console.log(`   ${inv.totalSkus} SKUs — ${inv.lowStockCount} below threshold\n`);

      console.log("✅ Shopify skill OK\n");
    } catch (err) {
      console.error("❌ Test failed:", err.message);
    }
  })();
}

module.exports = { tools };
