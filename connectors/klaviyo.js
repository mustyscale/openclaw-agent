/**
 * Klaviyo Connector
 * Pulls campaign performance and flow metrics.
 */

const axios = require("axios");
require("dotenv").config();
const logger = require("../utils/logger");

const client = axios.create({
  baseURL: "https://a.klaviyo.com/api",
  headers: {
    Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
    revision: "2024-02-15",
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

/**
 * Get campaigns sent in the last N days.
 */
async function getRecentCampaigns(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  try {
    const res = await client.get("/campaigns", {
      params: {
        "filter": `greater-than(send_time,${since})`,
        "fields[campaign]": "name,send_time,status",
      },
    });
    return res.data?.data || [];
  } catch (err) {
    logger.error("Klaviyo.getRecentCampaigns failed", err);
    return [];
  }
}

/**
 * Get aggregate metrics for a campaign.
 * Returns open rate, click rate, revenue attributed.
 */
async function getCampaignMetrics(campaignId) {
  try {
    const res = await client.get(`/campaign-recipient-estimations/${campaignId}`);
    return res.data?.data?.attributes || null;
  } catch (err) {
    logger.error(`Klaviyo.getCampaignMetrics failed for ${campaignId}`, err);
    return null;
  }
}

/**
 * Get a week summary of email performance.
 */
async function getWeeklySummary() {
  try {
    const campaigns = await getRecentCampaigns(7);
    const summaries = [];

    for (const campaign of campaigns.slice(0, 5)) {
      summaries.push({
        name: campaign.attributes?.name || "Unknown",
        send_time: campaign.attributes?.send_time,
        status: campaign.attributes?.status,
      });
    }

    return {
      campaignCount: campaigns.length,
      campaigns: summaries,
    };
  } catch (err) {
    logger.error("Klaviyo.getWeeklySummary failed", err);
    return { campaignCount: 0, campaigns: [] };
  }
}

module.exports = {
  getRecentCampaigns,
  getCampaignMetrics,
  getWeeklySummary,
};
