// server/index.js
const express = require('express');
const path = require('node:path');
const rateLimit = require('express-rate-limit');
const presets = require('./presets.json');
const { validateConfig } = require('./validate.js');
const { createSession, getSession, deleteSession } = require('./sessions.js');
const { runSmtpTest } = require('./smtp.js');

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.get('/api/presets', (req, res) => {
  res.json(presets);
});

app.post('/api/test', (req, res) => {
  const result = validateConfig(req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }
  const id = createSession(result.config);
  res.json({ id });
});

app.get('/api/test/stream/:id', (req, res) => {
  const config = getSession(req.params.id);
  if (!config) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  deleteSession(req.params.id);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const emit = (event) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };

  const { destroy } = runSmtpTest(config, emit);

  req.on('close', () => destroy());
});

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

module.exports = { app };

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}
