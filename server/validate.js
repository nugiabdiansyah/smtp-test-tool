// server/validate.js
function isValidHostname(str) {
  if (!str || typeof str !== 'string') return false;
  const hostname = /^[a-zA-Z0-9]([a-zA-Z0-9\-.]{0,251}[a-zA-Z0-9])?$/;
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = ipv4.exec(str);
  if (ipv4Match) {
    return ipv4Match.slice(1).every(octet => Number(octet) <= 255);
  }
  return hostname.test(str);
}

function isValidEmail(str) {
  return typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function validateConfig(body) {
  const errors = {};

  if (!isValidHostname(body.host)) {
    errors.host = 'Invalid hostname or IP address';
  }

  const port = Number(body.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.port = 'Port must be an integer between 1 and 65535';
  }

  if (!['auto', 'none', 'ssl', 'tls'].includes(body.security)) {
    errors.security = 'Security must be one of: auto, none, ssl, tls';
  }

  if (!body.username || typeof body.username !== 'string') {
    errors.username = 'Username is required';
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.password = 'Password is required';
  }

  if (!isValidEmail(body.from)) {
    errors.from = 'Invalid from email address';
  }

  if (!isValidEmail(body.to)) {
    errors.to = 'Invalid to email address';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    config: {
      host: body.host,
      port,
      security: body.security,
      username: body.username,
      password: body.password,
      from: body.from,
      to: body.to,
    },
  };
}

module.exports = { validateConfig };
