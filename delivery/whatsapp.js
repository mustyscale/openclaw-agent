/**
 * WhatsApp Delivery — via Twilio WhatsApp API
 *
 * Setup:
 * 1. Create Twilio account at twilio.com
 * 2. Enable WhatsApp Sandbox (free) or buy a number
 * 3. Client sends "join <sandbox-word>" once to activate
 * 4. Fill TWILIO_* vars in .env
 */

const twilio = require("twilio");
require("dotenv").config();
const logger = require("../utils/logger");

let client = null;

function getClient() {
  if (!client) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return client;
}

/**
 * Send a WhatsApp message to the client.
 * @param {string} message - plain text message
 */
async function send(message) {
  if (process.env.WHATSAPP_ENABLED !== "true") return;

  try {
    const msg = await getClient().messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: process.env.WHATSAPP_TO,
      body: message,
    });
    logger.success(`WhatsApp sent — SID: ${msg.sid}`);
    return true;
  } catch (err) {
    logger.error("WhatsApp send failed", err);
    return false;
  }
}

module.exports = { send };
