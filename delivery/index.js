/**
 * Delivery Router
 * Sends a message to ALL enabled delivery channels at once.
 * Just call: deliver.send("your message")
 */

const whatsapp = require("./whatsapp");
const telegram = require("./telegram");
const slack = require("./slack");
const logger = require("../utils/logger");

/**
 * Send message to all enabled channels.
 * @param {string} message
 */
async function send(message) {
  const channels = [];

  if (process.env.WHATSAPP_ENABLED === "true") channels.push(whatsapp.send(message));
  if (process.env.TELEGRAM_ENABLED === "true") channels.push(telegram.send(message));
  if (process.env.SLACK_ENABLED === "true") channels.push(slack.send(message));

  if (channels.length === 0) {
    logger.warn("No delivery channels enabled. Set WHATSAPP_ENABLED, TELEGRAM_ENABLED or SLACK_ENABLED=true in .env");
    return;
  }

  const results = await Promise.allSettled(channels);
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    logger.warn(`${failed.length} delivery channel(s) failed`);
  }
}

module.exports = { send };
