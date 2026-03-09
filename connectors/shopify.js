/**
 * Shopify Connector
 * Uses the Shopify Admin REST API (read-only scopes).
 * Required scopes: read_orders, read_products, read_inventory, read_customers
 */

const axios = require("axios");
require("dotenv").config();
const logger = require("../utils/logger");

const BASE_URL = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2024-04`;
const HEADERS = {
  "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
  "Content-Type": "application/json",
};

/**
 * Get orders created after a given ISO timestamp.
 * Returns simplified order objects.
 */
async function getOrdersSince(sinceISO) {
  try {
    const res = await axios.get(`${BASE_URL}/orders.json`, {
      headers: HEADERS,
      params: {
        status: "any",
        created_at_min: sinceISO,
        limit: 250,
        fields: "id,name,created_at,total_price,currency,financial_status,fulfillment_status,email,shipping_address,line_items,refunds,tags",
      },
    });
    return res.data.orders || [];
  } catch (err) {
    logger.error("Shopify.getOrdersSince failed", err);
    return [];
  }
}

/**
 * Get yesterday's orders with revenue summary.
 */
async function getYesterdayOrders() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const res = await axios.get(`${BASE_URL}/orders.json`, {
      headers: HEADERS,
      params: {
        status: "any",
        created_at_min: yesterday.toISOString(),
        created_at_max: today.toISOString(),
        limit: 250,
        fields: "id,name,created_at,total_price,currency,financial_status,fulfillment_status,line_items,refunds,shipping_address",
      },
    });
    return res.data.orders || [];
  } catch (err) {
    logger.error("Shopify.getYesterdayOrders failed", err);
    return [];
  }
}

/**
 * Get refunds created in the last N hours.
 */
async function getRecentRefunds(windowHours = 2) {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  try {
    const res = await axios.get(`${BASE_URL}/orders.json`, {
      headers: HEADERS,
      params: {
        status: "any",
        updated_at_min: since.toISOString(),
        limit: 250,
        fields: "id,name,refunds,line_items,financial_status",
      },
    });
    const orders = res.data.orders || [];
    // Filter only orders that actually have refunds in the window
    const refunded = orders.filter((o) => o.refunds && o.refunds.length > 0);
    return refunded;
  } catch (err) {
    logger.error("Shopify.getRecentRefunds failed", err);
    return [];
  }
}

/**
 * Get all inventory levels (across all locations).
 * Returns array of { sku, title, variant_title, inventory_quantity, product_id }
 */
async function getInventoryLevels() {
  try {
    // Get products with variants
    const res = await axios.get(`${BASE_URL}/products.json`, {
      headers: HEADERS,
      params: {
        limit: 250,
        fields: "id,title,variants",
      },
    });

    const products = res.data.products || [];
    const items = [];

    for (const product of products) {
      for (const variant of product.variants || []) {
        items.push({
          product_id: product.id,
          product_title: product.title,
          variant_id: variant.id,
          variant_title: variant.title,
          sku: variant.sku,
          inventory_quantity: variant.inventory_quantity,
          price: variant.price,
        });
      }
    }

    return items;
  } catch (err) {
    logger.error("Shopify.getInventoryLevels failed", err);
    return [];
  }
}

/**
 * Get store summary (name, currency, plan).
 */
async function getShopInfo() {
  try {
    const res = await axios.get(`${BASE_URL}/shop.json`, { headers: HEADERS });
    return res.data.shop;
  } catch (err) {
    logger.error("Shopify.getShopInfo failed", err);
    return null;
  }
}

/**
 * Build a revenue summary from an array of orders.
 */
function buildRevenueSummary(orders) {
  const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
  const orderCount = orders.length;
  const refundCount = orders.filter((o) => o.financial_status === "refunded" || o.financial_status === "partially_refunded").length;
  const refundRate = orderCount > 0 ? ((refundCount / orderCount) * 100).toFixed(1) : "0.0";

  // AOV
  const aov = orderCount > 0 ? (revenue / orderCount).toFixed(2) : "0.00";

  // Top products by units sold
  const productMap = {};
  for (const order of orders) {
    for (const item of order.line_items || []) {
      const key = item.product_id;
      if (!productMap[key]) {
        productMap[key] = { title: item.title, units: 0, revenue: 0 };
      }
      productMap[key].units += item.quantity;
      productMap[key].revenue += parseFloat(item.price) * item.quantity;
    }
  }

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // High value orders
  const threshold = parseFloat(process.env.HIGH_VALUE_ORDER_THRESHOLD || 500);
  const highValueOrders = orders.filter((o) => parseFloat(o.total_price) >= threshold);

  // International orders
  const internationalOrders = orders.filter(
    (o) => o.shipping_address && o.shipping_address.country_code !== "US"
  );

  return {
    revenue: revenue.toFixed(2),
    orderCount,
    aov,
    refundCount,
    refundRate,
    topProducts,
    highValueOrders,
    internationalOrders,
    currency: orders[0]?.currency || "USD",
  };
}

module.exports = {
  getOrdersSince,
  getYesterdayOrders,
  getRecentRefunds,
  getInventoryLevels,
  getShopInfo,
  buildRevenueSummary,
};
