/**
 * Slack Delivery — via Incoming Webhooks
 *
 * Setup:
 * 1. Go to api.slack.com/apps → Create New App → From Scratch
 * 2. Features → Incoming Webhooks → Activate → Add to Workspace
 * 3. Pick a channel (#store-alerts or #commerceclaw)
 * 4. Copy the Webhook URL into SLACK_WEBHOOK_URL in .env
 */

const axios = require("axios");
require("dotenv").config();
const logger = require("../utils/logger");

/**
 * Send a Slack message.
 * @param {string} message - plain text or Slack mrkdwn
 */
async function send(message) {
  if (process.env.SLACK_ENABLED !== "true") return;

  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: message,
      username: `OpenClaw — ${process.env.CLIENT_NAME || "Store"}`,
      icon_emoji: ":robot_face:",
    });
    logger.success("Slack message sent");
    return true;
  } catch (err) {
    logger.error("Slack send failed", err);
    return false;
  }
}

module.exports = { send };
