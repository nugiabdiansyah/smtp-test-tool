// server/smtp.js
const net = require('node:net');
const tls = require('node:tls');

/**
 * Run an SMTP test. Calls emit() for each SSE event.
 * Returns { destroy } to abort the connection (e.g. on SSE disconnect).
 *
 * emit is called with objects matching the SSE event schema:
 *   { type: 'line', dir: 'send'|'recv', text: string }
 *   { type: 'done', success: boolean, message?: string }
 *   { type: 'error', message: string }
 */
function runSmtpTest(config, emit) {
  const { host, port, security, username, password, from, to } = config;

  let socket = null;
  let destroyed = false;
  let buffer = '';
  let ehloCapabilities = [];
  let state = 'GREETING';
  let timeoutId = null;

  const destroy = () => {
    if (!destroyed) {
      destroyed = true;
      clearTimeout(timeoutId);
      if (socket) socket.destroy();
    }
  };

  const sendLine = (text) => {
    if (destroyed) return;
    emit({ type: 'line', dir: 'send', text });
    socket.write(text + '\r\n');
  };

  const sendCredential = (b64) => {
    if (destroyed) return;
    emit({ type: 'line', dir: 'send', text: '[credentials sent]' });
    socket.write(b64 + '\r\n');
  };

  const finish = (success, message) => {
    if (destroyed) return;
    emit({ type: 'done', success, ...(message ? { message } : {}) });
    destroy();
  };

  const fail = (message) => {
    if (destroyed) return;
    emit({ type: 'error', message });
    destroy();
  };

  const upgradeTLS = () => {
    socket.removeAllListeners('data');
    const upgraded = tls.connect({ socket, host, rejectUnauthorized: false });
    upgraded.once('secureConnect', () => {
      socket = upgraded;
      buffer = '';
      ehloCapabilities = [];
      state = 'EHLO2_SENT';
      socket.on('data', onData);
      sendLine('EHLO localhost');
    });
    upgraded.once('error', (err) => fail(`TLS error: ${err.message}`));
  };

  const handleLine = (line) => {
    emit({ type: 'line', dir: 'recv', text: line });
    const code = parseInt(line.slice(0, 3), 10);
    const isFinal = line[3] !== '-';

    if (!isFinal) {
      if (state === 'EHLO_SENT' || state === 'EHLO2_SENT') {
        ehloCapabilities.push(line.slice(4).toUpperCase());
      }
      return;
    }

    switch (state) {
      case 'GREETING':
        if (code === 220) {
          state = 'EHLO_SENT';
          sendLine('EHLO localhost');
        } else {
          fail(`Unexpected greeting: ${line}`);
        }
        break;

      case 'EHLO_SENT':
        if (code === 250) {
          ehloCapabilities.push(line.slice(4).toUpperCase());
          const hasStartTLS = ehloCapabilities.some(c => c.startsWith('STARTTLS'));
          if (security === 'tls' || (security === 'auto' && hasStartTLS)) {
            state = 'STARTTLS_SENT';
            sendLine('STARTTLS');
          } else {
            state = 'AUTH_SENT';
            sendLine('AUTH LOGIN');
          }
        } else {
          fail(`EHLO failed: ${line}`);
        }
        break;

      case 'STARTTLS_SENT':
        if (code === 220) {
          upgradeTLS();
        } else {
          fail(`STARTTLS failed: ${line}`);
        }
        break;

      case 'EHLO2_SENT':
        if (code === 250) {
          state = 'AUTH_SENT';
          sendLine('AUTH LOGIN');
        } else {
          fail(`EHLO (post-TLS) failed: ${line}`);
        }
        break;

      case 'AUTH_SENT':
        if (code === 334) {
          state = 'USERNAME_SENT';
          sendCredential(Buffer.from(username).toString('base64'));
        } else {
          fail(`AUTH LOGIN rejected: ${line}`);
        }
        break;

      case 'USERNAME_SENT':
        if (code === 334) {
          state = 'PASSWORD_SENT';
          sendCredential(Buffer.from(password).toString('base64'));
        } else {
          fail(`Username rejected: ${line}`);
        }
        break;

      case 'PASSWORD_SENT':
        if (code === 235) {
          state = 'MAILFROM_SENT';
          sendLine(`MAIL FROM:<${from}>`);
        } else {
          finish(false, `Authentication failed: ${line}`);
        }
        break;

      case 'MAILFROM_SENT':
        if (code === 250) {
          state = 'RCPTTO_SENT';
          sendLine(`RCPT TO:<${to}>`);
        } else {
          fail(`MAIL FROM rejected: ${line}`);
        }
        break;

      case 'RCPTTO_SENT':
        if (code === 250) {
          state = 'QUIT_SENT';
          sendLine('QUIT');
        } else {
          fail(`RCPT TO rejected: ${line}`);
        }
        break;

      case 'QUIT_SENT':
        finish(true);
        break;
    }
  };

  const onData = (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\r\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line && !destroyed) handleLine(line);
    }
  };

  timeoutId = setTimeout(() => fail('Connection timed out'), 15_000);

  try {
    emit({ type: 'line', dir: 'send', text: `Connecting to ${host}:${port}...` });

    if (security === 'ssl') {
      socket = tls.connect({ host, port, rejectUnauthorized: false });
    } else {
      socket = net.connect({ host, port });
    }

    socket.on('data', onData);
    socket.on('error', (err) => fail(err.message));
    socket.on('close', () => {
      if (!destroyed) fail('Connection closed unexpectedly');
    });
  } catch (err) {
    fail(err.message);
  }

  return { destroy };
}

module.exports = { runSmtpTest };
