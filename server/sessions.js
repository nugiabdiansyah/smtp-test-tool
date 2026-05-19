// server/sessions.js
const { randomUUID } = require('node:crypto');

const sessions = new Map();

function createSession(config) {
  const id = randomUUID();
  sessions.set(id, { config, createdAt: Date.now() });
  return id;
}

function getSession(id) {
  const entry = sessions.get(id);
  return entry ? entry.config : null;
}

function deleteSession(id) {
  sessions.delete(id);
}

const ttlInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of sessions) {
    if (now - entry.createdAt > 30_000) {
      sessions.delete(id);
    }
  }
}, 60_000);

function stopTTL() {
  clearInterval(ttlInterval);
}

module.exports = { createSession, getSession, deleteSession, stopTTL };
