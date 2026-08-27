const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
// Spring Boot runs as a second, internal-only process in the same
// container/host. Only this Node process is ever exposed externally.
const BACKEND_PORT = process.env.BACKEND_PORT || 8080;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// Serve marked straight out of node_modules so the client can use it
// without a bundler or a CDN dependency.
app.use('/vendor/marked', express.static(path.join(__dirname, 'node_modules/marked/lib')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.post('/api/login', (req, res) => {
    res.cookie('super_secret_cookie', crypto.randomUUID(), {
        httpOnly: false,
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true });
});

// Mounted at root (not app.use('/ws', ...)) so Express doesn't strip the
// "/ws" prefix off req.url before the proxy sees it - pathFilter matches
// on the full original path instead, and forwards it unchanged.
const wsProxy = createProxyMiddleware({
    target: BACKEND_URL,
    pathFilter: '/ws',
    ws: true,
    changeOrigin: true,
});
app.use(wsProxy);

const server = app.listen(PORT, () => {
    console.log(`Chat frontend listening on http://localhost:${PORT}, proxying /ws to ${BACKEND_URL}`);
});
// Express's app.use() only sees regular HTTP requests; the WebSocket
// upgrade handshake bypasses it, so it has to be wired to the raw
// http.Server explicitly for the proxy to catch it.
server.on('upgrade', wsProxy.upgrade);
