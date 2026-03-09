/**
 * Logger — PM2-friendly, timestamped, prefixed by client name
 */

require("dotenv").config();
const clientId = process.env.CLIENT_ID || "openclaw";

const timestamp = () => new Date().toISOString();

const logger = {
  info: (msg, data = null) => {
    const line = `[${timestamp()}] [${clientId}] ℹ️  ${msg}`;
    data ? console.log(line, data) : console.log(line);
  },
  success: (msg, data = null) => {
    const line = `[${timestamp()}] [${clientId}] ✅ ${msg}`;
    data ? console.log(line, data) : console.log(line);
  },
  warn: (msg, data = null) => {
    const line = `[${timestamp()}] [${clientId}] ⚠️  ${msg}`;
    data ? console.warn(line, data) : console.warn(line);
  },
  error: (msg, err = null) => {
    const line = `[${timestamp()}] [${clientId}] ❌ ${msg}`;
    err ? console.error(line, err?.message || err) : console.error(line);
  },
  job: (jobName, msg) => {
    console.log(`[${timestamp()}] [${clientId}] [${jobName}] ${msg}`);
  },
};

module.exports = logger;
