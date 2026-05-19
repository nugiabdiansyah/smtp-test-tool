// server/tests/validate.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateConfig } = require('../validate.js');

const valid = {
  host: 'smtp.sendgrid.net',
  port: 587,
  security: 'tls',
  username: 'apikey',
  password: 'secret',
  from: 'me@example.com',
  to: 'you@example.com',
};

test('accepts a valid config', () => {
  const result = validateConfig(valid);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.equal(result.config.port, 587);
});

test('rejects empty host', () => {
  const result = validateConfig({ ...valid, host: '' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.host);
});

test('rejects host with spaces', () => {
  const result = validateConfig({ ...valid, host: 'smtp bad host' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.host);
});

test('accepts IP address as host', () => {
  const result = validateConfig({ ...valid, host: '192.168.1.1' });
  assert.equal(result.valid, true);
});

test('rejects out-of-range IP address', () => {
  const result = validateConfig({ ...valid, host: '300.300.300.300' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.host);
});

test('rejects port 0', () => {
  const result = validateConfig({ ...valid, port: 0 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.port);
});

test('rejects port 70000', () => {
  const result = validateConfig({ ...valid, port: 70000 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.port);
});

test('coerces string port to integer', () => {
  const result = validateConfig({ ...valid, port: '587' });
  assert.equal(result.valid, true);
  assert.equal(result.config.port, 587);
});

test('rejects invalid security value', () => {
  const result = validateConfig({ ...valid, security: 'starttls' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.security);
});

test('accepts all valid security values', () => {
  for (const sec of ['auto', 'none', 'ssl', 'tls']) {
    const result = validateConfig({ ...valid, security: sec });
    assert.equal(result.valid, true, `should accept "${sec}"`);
  }
});

test('rejects empty username', () => {
  const result = validateConfig({ ...valid, username: '' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.username);
});

test('rejects invalid from email', () => {
  const result = validateConfig({ ...valid, from: 'notanemail' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.from);
});

test('rejects invalid to email', () => {
  const result = validateConfig({ ...valid, to: 'bad@' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.to);
});
