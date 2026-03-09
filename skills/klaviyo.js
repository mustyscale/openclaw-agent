/**
 * OpenClaw Skill: Klaviyo
 *
 * Gives your agent access to email campaign performance.
 *
 * Tell your agent:
 *   "Summarise my Klaviyo campaigns from last week"
 *
 * Setup: add KLAVIYO_API_KEY to your .env
 */

require("dotenv").config();

const tools = {

  async getWeeklySummary() {
    const klaviyo = require("../connectors/klaviyo");
    return await klaviyo.getWeeklySummary();
  },

  async getRecentCampaigns(days = 7) {
    const klaviyo = require("../connectors/klaviyo");
    return await klaviyo.getRecentCampaigns(days);
  },
};

if (require.main === module) {
  console.log("\n🧪 Testing Klaviyo skill...\n");
  (async () => {
    try {
      const summary = await tools.getWeeklySummary();
      console.log(`Campaigns this week: ${summary.campaignCount}`);
      console.log("\n✅ Klaviyo skill OK\n");
    } catch (err) {
      console.error("❌ Test failed:", err.message);
    }
  })();
}

module.exports = { tools };
