// server/tests/sessions.test.js
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

let createSession, getSession, deleteSession, stopTTL;

before(() => {
  ({ createSession, getSession, deleteSession, stopTTL } = require('../sessions.js'));
});

after(() => {
  stopTTL();
});

test('createSession returns a UUID string', () => {
  const id = createSession({ host: 'smtp.example.com' });
  assert.match(id, /^[0-9a-f-]{36}$/);
});

test('getSession returns config for a valid id', () => {
  const config = { host: 'smtp.example.com', port: 587 };
  const id = createSession(config);
  const retrieved = getSession(id);
  assert.deepEqual(retrieved, config);
});

test('getSession returns null for unknown id', () => {
  assert.equal(getSession('nonexistent-id'), null);
});

test('deleteSession removes the entry', () => {
  const id = createSession({ host: 'smtp.example.com' });
  deleteSession(id);
  assert.equal(getSession(id), null);
});

test('getSession returns null after deleteSession', () => {
  const id = createSession({ host: 'smtp.example.com' });
  deleteSession(id);
  assert.equal(getSession(id), null);
});
