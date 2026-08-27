# Multi-Channel Chat

A minimal multi-channel chat room: a Spring Boot 4 backend that fans
out messages over a plain WebSocket, and a Node.js frontend (Express
serving static files) that renders message content as markdown with
[marked](https://github.com/markedjs/marked).

No database, no build tooling, no framework on the client — just enough
to be functional.

## How it works

- Backend (`backend/`): a single `TextWebSocketHandler` at `/ws/chat`
  keeps everything in memory — which sessions are in which channel,
  and the last 50 messages per channel for scrollback. Channels are
  created on demand the first time someone joins them. Runs on port
  8080 and is never exposed directly outside of local dev.
- Frontend (`frontend/`): an Express server that serves the static
  client, handles `POST /api/login` (sets a demo `super_secret_cookie`),
  and reverse-proxies `/ws/chat` (including the WebSocket upgrade) to
  the backend. This is the only process/port meant to be exposed.
  The client renders message content with `marked`, then sanitizes the
  resulting HTML (allowlisted tags/attributes, `http(s)`/`mailto` links
  only) before inserting it, since GFM markdown otherwise passes raw
  HTML/script through untouched.

This is intentionally two separate ecosystems (Maven + npm) kept in one
deployable unit, for demoing polyglot dependency scanning.

## Run it locally

**Option A — one container, exactly like production** (needs Docker):
```bash
docker build -t chat-app .
docker run -p 3000:3000 chat-app
```
Open http://localhost:3000.

**Option B — two terminals, faster iteration** (needs Java 21 + Node 20):
```bash
# terminal 1
cd backend && mvn spring-boot:run      # port 8080

# terminal 2
cd frontend && npm install && npm start   # port 3000, proxies to 8080
```
Open http://localhost:3000. Either way, pick a username and channel,
then open a second browser tab/window to chat with yourself across two
sessions.

## Deploy to Heroku

The same `Dockerfile` is used via Heroku's container stack — no
separate buildpack config needed:

```bash
heroku create <app-name>
heroku stack:set container -a <app-name>
git push heroku main
```

`heroku.yml` tells Heroku to build from the root `Dockerfile`. Heroku
injects `$PORT`; `frontend/server.js` already listens on
`process.env.PORT`, and the backend stays internal-only inside the
same dyno, started by `start.sh`.

## Deploy to Render

Create a **Web Service**, environment **Docker**, pointing at this repo
(root `Dockerfile`). Render injects `$PORT` the same way Heroku does —
no other configuration required.
