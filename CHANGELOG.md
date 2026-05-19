# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.0] — 2026-05-19

### Added

- **Full email delivery** — after `RCPT TO`, the tool now issues `DATA` and sends a proper RFC 2822 email (From, To, Subject, Date, Message-Id, MIME headers, body) so the test message actually arrives in the recipient's inbox

### Changed

- SMTP sequence extended: `GREETING → EHLO → [STARTTLS] → AUTH → MAIL FROM → RCPT TO → DATA → [headers+body] → QUIT`
- "Connection successful" now means the message was queued by the server, not just that credentials were accepted

---

## [1.0.0] — 2026-05-19

### Added

- **Monorepo scaffold** — Node.js/Express server + React/Vite client in a single repo with root `dev`, `build`, and `start` scripts
- **Server input validation** — validates host (hostname or IPv4 with octet-range check), port (1–65535), security mode, credentials, and email addresses; returns field-level errors on 400
- **In-memory session management** — UUID-keyed session Map with 30-second TTL sweep for orphaned sessions; no disk writes
- **SMTP state machine** (`server/smtp.js`) — raw TCP/TLS connection using Node.js `net` and `tls` modules; handles SSL (direct TLS connect), TLS (STARTTLS upgrade), Auto (STARTTLS if advertised), and None (plain TCP)
- **SSE streaming API** — `POST /api/test` creates a session, `GET /api/test/stream/:id` runs the SMTP test and streams each line as a Server-Sent Event; session deleted after stream opens
- **Express API** — `GET /api/presets`, rate limiting (20 req/min per IP), production static file serving, SPA catch-all, API 404 handler
- **Configurable presets** — `server/presets.json` with Sendgrid, Mailgun, SMTP2GO, Sendinblue, JangoSMTP
- **React client** — light-mode single-column card UI built with React 18 + Vite 5, plain CSS
- **PresetToggle component** — reusable compact toggle button row for server and port presets
- **SmtpForm component** — full form with server/port preset toggles, security dropdown, field-level validation errors, autofill highlighting
- **ConversationLog component** — dark monospace log panel with color-coded lines (2xx green, 3xx amber, 4xx+ red, send gray), `● LIVE` indicator, auto-scroll, final status line
- **App integration** — fetches presets on load, POSTs config, opens EventSource for streaming, manages all loading/live/success state
- **23 server tests** — validate.test.js (13), sessions.test.js (5), api.test.js (5) using Node.js built-in test runner

### Fixed

- **IPv4 octet validation** — original regex accepted out-of-range addresses like `300.300.300.300`; fixed to check each octet ≤ 255
- **SMTP timeout scope** — timeout was incorrectly cleared on TCP connect, leaving the conversation phase unguarded; timeout now covers the full 15-second session
- **TLS socket crash** — after STARTTLS upgrade, the upgraded socket had no persistent `error` or `close` handlers; a mid-session server close would crash the Node process with an uncaught exception
- **SmtpForm shadow variable** — `setFieldErrors` callback used `e` as parameter name, shadowing the outer DOM event
- **activePreset sync** — server preset button stayed highlighted after manually changing the port; now cleared when port diverges from the preset's value
- **EventSource leak** — EventSource not closed on component unmount; fixed with a cleanup effect tracking the instance in a ref
