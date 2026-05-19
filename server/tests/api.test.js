// server/tests/api.test.js
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

let app, stopTTL;

before(() => {
  ({ stopTTL } = require('../sessions.js'));
  ({ app } = require('../index.js'));
});

after(() => {
  stopTTL();
});

test('GET /api/presets returns array of presets', async () => {
  const res = await request(app).get('/api/presets');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length > 0);
  assert.ok(res.body[0].name);
  assert.ok(res.body[0].host);
});

test('POST /api/test returns id for valid config', async () => {
  const res = await request(app).post('/api/test').send({
    host: 'smtp.example.com',
    port: 587,
    security: 'tls',
    username: 'user',
    password: 'pass',
    from: 'a@example.com',
    to: 'b@example.com',
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.id);
  assert.match(res.body.id, /^[0-9a-f-]{36}$/);
});

test('POST /api/test returns 400 for missing host', async () => {
  const res = await request(app).post('/api/test').send({
    host: '',
    port: 587,
    security: 'tls',
    username: 'user',
    password: 'pass',
    from: 'a@example.com',
    to: 'b@example.com',
  });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.host);
});

test('POST /api/test returns 400 for invalid email', async () => {
  const res = await request(app).post('/api/test').send({
    host: 'smtp.example.com',
    port: 587,
    security: 'tls',
    username: 'user',
    password: 'pass',
    from: 'notanemail',
    to: 'b@example.com',
  });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.from);
});

test('GET /api/test/stream/:id returns 404 for unknown id', async () => {
  const res = await request(app).get('/api/test/stream/nonexistent-id');
  assert.equal(res.status, 404);
});
