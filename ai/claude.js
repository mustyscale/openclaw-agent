/**
 * Claude AI Wrapper — Anthropic SDK
 *
 * All agent reasoning goes through here.
 * Each job passes raw data + a task prompt → gets back a clean message
 * ready to send to the client.
 */

const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();
const logger = require("../utils/logger");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLIENT_NAME = process.env.CLIENT_NAME || "Store Owner";
const STORE_NAME = process.env.SHOPIFY_STORE_URL || process.env.WOOCOMMERCE_URL || "your store";

/**
 * Core ask function — send data + task to Claude, get back a formatted message.
 * Uses claude-3-haiku (fast, cheap) for routine jobs.
 * Uses claude-3-5-sonnet for complex analysis.
 */
async function ask(prompt, data, model = "claude-3-haiku-20240307") {
  const systemPrompt = `You are OpenClaw, an AI agent managing ${STORE_NAME} for ${CLIENT_NAME}.
You are direct, concise, and ROI-focused. You speak to a busy store owner.
Never use jargon. Never say "leverage" or "utilize".
Use short sentences. Always mention specific numbers.
Format output as plain text suitable for WhatsApp/Telegram — use emojis sparingly, only where they add clarity.
Never add disclaimers, caveats, or sign-offs. Just the insight.`;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nDATA:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      system: systemPrompt,
    });

    return response.content[0]?.text || "";
  } catch (err) {
    logger.error("Claude.ask failed", err);
    return null;
  }
}

/**
 * Generate daily revenue briefing message.
 */
async function generateDailyBriefing(summary, klaviyoData = null) {
  const prompt = `Write a daily revenue briefing for a store owner.
Be concise — max 10 lines.
Include: total revenue, order count, AOV, refund rate, top 3 products.
If there are high-value orders (>${process.env.HIGH_VALUE_ORDER_THRESHOLD || 500}), mention them.
If refund rate is above 5%, flag it as a concern.
Start with the date and a one-line summary of how yesterday went.
${klaviyoData ? "Also include a one-line summary of recent email campaign performance." : ""}`;

  return ask(prompt, { summary, klaviyoData });
}

/**
 * Analyze new orders and flag anything unusual.
 */
async function analyzeNewOrders(orders, threshold) {
  const prompt = `Review these new orders. Flag:
1. High-value orders (above $${threshold}) — list order number and amount
2. Any international orders that may need special handling
3. Anything else unusual (duplicate addresses, suspicious patterns)

If nothing needs flagging, say "All clear — ${orders.length} new order(s), nothing unusual."
Keep it under 8 lines.`;

  return ask(prompt, { orders, threshold });
}

/**
 * Generate low stock alert message.
 */
async function generateStockAlert(lowStockItems) {
  const prompt = `Write a stock alert message for the store owner.
List each low-stock item with: product name, variant, current quantity, reorder threshold.
Tell them to act now — not after they run out.
Keep it under 10 lines. Be direct.`;

  return ask(prompt, { lowStockItems });
}

/**
 * Analyze a refund spike.
 */
async function analyzeRefundSpike(refundData) {
  const prompt = `A refund spike has been detected. Analyze:
- Which product(s) have high refund rates
- What the common refund reasons are (if available in the data)
- Suggest one immediate action the store owner should take

Keep it under 8 lines. Be specific about product names and numbers.`;

  return ask(prompt, refundData, "claude-3-5-sonnet-20241022");
}

/**
 * Answer a free-form question from the store owner.
 * Used for on-demand queries.
 */
async function answerQuery(question, storeData) {
  const prompt = `The store owner asks: "${question}"
Answer using the store data provided. Be specific and use real numbers from the data.
If the data doesn't contain enough information to answer, say so clearly.
Keep response under 10 lines.`;

  return ask(prompt, storeData, "claude-3-5-sonnet-20241022");
}

module.exports = {
  ask,
  generateDailyBriefing,
  analyzeNewOrders,
  generateStockAlert,
  analyzeRefundSpike,
  answerQuery,
};
