/**
 * State — lightweight JSON file-based state store.
 * Tracks things like "last seen order ID" so we don't re-alert on old data.
 * No database needed — just a local JSON file on the Mac Mini.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const STATE_FILE = path.join(__dirname, `../data/${process.env.CLIENT_ID || "client"}-state.json`);

// Ensure data directory exists
const dataDir = path.dirname(STATE_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function load() {
  if (!fs.existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function save(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function get(key, defaultValue = null) {
  const state = load();
  return key in state ? state[key] : defaultValue;
}

function set(key, value) {
  const state = load();
  state[key] = value;
  save(state);
}

function getAll() {
  return load();
}

module.exports = { get, set, getAll };
