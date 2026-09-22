# auca_mic_frontend

React + TypeScript + Vite client for the AUCA psycholinguistic naming
experiment (see `../BRD.md`, `../auca_mic_backend/README.md`).

Two independent flows behind one build:

- **Researcher dashboard** (`/`, behind login) — upload stimulus ZIPs, create
  experiments, start participant sessions, browse/export results.
- **Participant runner** (`/s/:sessionId`, public, no login) — the actual
  naming task: one image at a time, Web Speech API for recognition + timing,
  a skip button. **Chrome/Chromium only** — see BRD 6.1/7.6.

## Auth

Researchers only, phone + password (`POST /moses/token/obtain/`), accounts
created by the backend admin — no self-registration. See
`src/api/auth.ts` / `src/auth/`.

## Local development

```sh
npm install
cp sample.env .env   # point VITE_API_BASE_URL at your local backend
npm run dev
```

The backend must be running (see `../auca_mic_backend/README.md`) with a
matching `DOMAIN`/`FRONTEND_ORIGINS` so CORS and the moses `domain` check pass.

## Build

```sh
npm run build   # tsc -b && vite build -> dist/
```

`dist/` is a static bundle, deployed to Cloudflare Pages.

## Deploy (Cloudflare Pages)

```sh
cp .cf-deploy.env.example .cf-deploy.env   # CLOUDFLARE_API_TOKEN + ACCOUNT_ID
cp sample.env .env                          # fill in the production VITE_* values
./scripts/deploy_pages.sh --build           # build + deploy
./scripts/deploy_pages.sh                   # redeploy an existing build as-is
```

First deploy creates the Pages project (name: `auca-mic`, override via
`CF_PAGES_PROJECT` in `.cf-deploy.env`) and gives it a `auca-mic.pages.dev`
URL.

**Chosen domains** (zone `vassilyv.me`, already on Cloudflare):

| Purpose | Domain | DNS record |
|---|---|---|
| Frontend (this app, Cloudflare Pages) | `micauca.vassilyv.me` | **CNAME** `micauca` → `auca-mic.pages.dev`, proxied (orange cloud) |
| Backend API (Django, on the shared host) | `micauca-api.vassilyv.me` | **A** `micauca-api` → the host's IP, proxied (orange cloud) |

Since the zone is already on Cloudflare, the frontend record is created for
you by:

```sh
wrangler pages domain add micauca.vassilyv.me --project-name=auca-mic
```

(equivalent to Cloudflare dashboard → Pages → auca-mic → Custom domains → Add).
For the API, add the **A** record to `micauca-api` yourself (Cloudflare
dashboard → DNS), proxied — the shared nginx already uses a self-signed
origin cert for every app on that host, so set the zone's **SSL/TLS mode to
"Full"** (not "Full (strict)") if it isn't already; that's the same setup the
other apps on this host rely on.

In `.env` (Vite, this app): `VITE_API_BASE_URL=https://micauca-api.vassilyv.me`,
`VITE_AUTH_DOMAIN=micauca-api.vassilyv.me`. In the backend's `auca_mic.env`:
`DOMAIN=micauca-api.vassilyv.me`, `FRONTEND_ORIGINS=https://micauca.vassilyv.me`.

## Config

See [`sample.env`](./sample.env) — baked in at build time (Vite), not read at
runtime. Missing values fail fast (`client.ts` throws if `VITE_API_BASE_URL`
is unset) instead of silently pointing at the wrong origin.
