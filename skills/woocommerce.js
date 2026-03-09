/**
 * OpenClaw Skill: WooCommerce
 *
 * Gives your OpenClaw agent direct access to your WooCommerce store.
 *
 * Tell your agent:
 *   "Use the woocommerce skill to get today's orders"
 *   "Check WooCommerce inventory for anything below reorder level"
 *
 * Setup: add WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY,
 *        WOOCOMMERCE_CONSUMER_SECRET to your .env
 */

require("dotenv").config();
const { buildRevenueSummary } = require("../connectors/woocommerce");

const tools = {

  async getDailyRevenue() {
    const woo    = require("../connectors/woocommerce");
    const orders = await woo.getYesterdayOrders();
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
    };
  },

  async scanRecentOrders(hours = 1) {
    const woo       = require("../connectors/woocommerce");
    const since     = new Date(Date.now() - hours * 3600000).toISOString();
    const orders    = await woo.getOrdersSince(since);
    const threshold = parseFloat(process.env.HIGH_VALUE_ORDER_THRESHOLD || 500);

    return {
      totalNew: orders.length,
      highValue: orders
        .filter(o => parseFloat(o.total) >= threshold)
        .map(o => ({ id: o.number, total: o.total })),
      windowHours: hours,
    };
  },

  async checkInventory() {
    const woo       = require("../connectors/woocommerce");
    const items     = await woo.getInventoryLevels();
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || 20);

    const lowStock = items
      .filter(i => i.manage_stock && i.inventory_quantity !== null && i.inventory_quantity <= threshold)
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
      lowStockItems: lowStock,
      allClear: lowStock.length === 0,
    };
  },
};

// Run: node skills/woocommerce.js --test
if (require.main === module) {
  console.log("\n🧪 Testing WooCommerce skill...\n");
  (async () => {
    try {
      const revenue = await tools.getDailyRevenue();
      console.log(`Revenue: ${revenue.currency} ${revenue.revenue} — ${revenue.orderCount} orders`);
      const inv = await tools.checkInventory();
      console.log(`Inventory: ${inv.totalSkus} SKUs — ${inv.lowStockCount} low stock`);
      console.log("\n✅ WooCommerce skill OK\n");
    } catch (err) {
      console.error("❌ Test failed:", err.message);
    }
  })();
}

module.exports = { tools };
