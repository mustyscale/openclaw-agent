/**
 * Telegram Delivery — via Telegram Bot API (free)
 *
 * Setup:
 * 1. Open Telegram, message @BotFather
 * 2. /newbot → follow prompts → copy the token
 * 3. Start a chat with the bot, send any message
 * 4. Visit: https://api.telegram.org/bot<TOKEN>/getUpdates
 *    Copy the chat_id from the response
 * 5. Fill TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
 */

const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const logger = require("../utils/logger");

let bot = null;

function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return bot;
}

/**
 * Send a Telegram message to the client's chat.
 * Supports Markdown formatting.
 * @param {string} message
 */
async function send(message) {
  if (process.env.TELEGRAM_ENABLED !== "true") return;

  try {
    const b = getBot();
    if (!b) throw new Error("Bot not initialized — check TELEGRAM_BOT_TOKEN");

    await b.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
      parse_mode: "Markdown",
    });
    logger.success("Telegram message sent");
    return true;
  } catch (err) {
    logger.error("Telegram send failed", err);
    return false;
  }
}

module.exports = { send };
