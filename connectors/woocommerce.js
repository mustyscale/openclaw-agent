/**
 * WooCommerce Connector
 * Uses the WooCommerce REST API v3.
 * Required: Consumer Key + Consumer Secret with read permissions.
 */

const axios = require("axios");
require("dotenv").config();
const logger = require("../utils/logger");

function getClient() {
  return axios.create({
    baseURL: `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3`,
    auth: {
      username: process.env.WOOCOMMERCE_CONSUMER_KEY,
      password: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    },
    timeout: 15000,
  });
}

/**
 * Get orders created after a given ISO date string.
 */
async function getOrdersSince(sinceISO) {
  try {
    const client = getClient();
    const res = await client.get("/orders", {
      params: {
        after: sinceISO,
        per_page: 100,
        orderby: "date",
        order: "desc",
      },
    });
    return res.data || [];
  } catch (err) {
    logger.error("WooCommerce.getOrdersSince failed", err);
    return [];
  }
}

/**
 * Get yesterday's orders.
 */
async function getYesterdayOrders() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const client = getClient();
    const res = await client.get("/orders", {
      params: {
        after: yesterday.toISOString(),
        before: today.toISOString(),
        per_page: 100,
      },
    });
    return res.data || [];
  } catch (err) {
    logger.error("WooCommerce.getYesterdayOrders failed", err);
    return [];
  }
}

/**
 * Get all products with stock levels.
 */
async function getInventoryLevels() {
  try {
    const client = getClient();
    const res = await client.get("/products", {
      params: { per_page: 100, stock_status: "any" },
    });

    const products = res.data || [];
    const items = [];

    for (const product of products) {
      if (product.type === "variable") {
        // Fetch variations
        const varRes = await client.get(`/products/${product.id}/variations`, {
          params: { per_page: 100 },
        });
        for (const v of varRes.data || []) {
          items.push({
            product_id: product.id,
            product_title: product.name,
            variant_id: v.id,
            variant_title: v.attributes?.map((a) => a.option).join(" / ") || "Default",
            sku: v.sku,
            inventory_quantity: v.stock_quantity,
            manage_stock: v.manage_stock,
          });
        }
      } else {
        items.push({
          product_id: product.id,
          product_title: product.name,
          variant_id: null,
          variant_title: null,
          sku: product.sku,
          inventory_quantity: product.stock_quantity,
          manage_stock: product.manage_stock,
        });
      }
    }
    return items;
  } catch (err) {
    logger.error("WooCommerce.getInventoryLevels failed", err);
    return [];
  }
}

/**
 * Build a revenue summary from WooCommerce orders.
 */
function buildRevenueSummary(orders) {
  const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const orderCount = orders.length;
  const refundCount = orders.filter((o) => o.status === "refunded").length;
  const refundRate = orderCount > 0 ? ((refundCount / orderCount) * 100).toFixed(1) : "0.0";
  const aov = orderCount > 0 ? (revenue / orderCount).toFixed(2) : "0.00";

  const productMap = {};
  for (const order of orders) {
    for (const item of order.line_items || []) {
      const key = item.product_id;
      if (!productMap[key]) productMap[key] = { title: item.name, units: 0, revenue: 0 };
      productMap[key].units += item.quantity;
      productMap[key].revenue += parseFloat(item.total);
    }
  }

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const threshold = parseFloat(process.env.HIGH_VALUE_ORDER_THRESHOLD || 500);
  const highValueOrders = orders.filter((o) => parseFloat(o.total) >= threshold);

  return {
    revenue: revenue.toFixed(2),
    orderCount,
    aov,
    refundCount,
    refundRate,
    topProducts,
    highValueOrders,
    currency: orders[0]?.currency || "USD",
  };
}

module.exports = {
  getOrdersSince,
  getYesterdayOrders,
  getInventoryLevels,
  buildRevenueSummary,
};
