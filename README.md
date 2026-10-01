# Siemens DISW — Knowledge Management Best Practices

A working teaching artifact for the **Siemens Digital Industries Software (DISW)** knowledge team. It lays out eight knowledge-management capabilities as a narrative — how to distribute authoring across product groups (Teamcenter, NX, Simcenter, Calibre EDA) while keeping publication under tight control — and proves **three of them live** (plus the always-on grounded KM agent) against the connected Salesforce org.

The goal it delivers: a robust knowledge management and creation framework governed by the full Salesforce security model, with AI-assisted knowledge generation and publication approvals — so every product group can contribute while quality and control stay in the platform. Capability 2 shows how separating the publish privilege from create/edit and gating the Draft → Online transition through an approval process means no single actor, and no API integration, can push content live at scale without review.

## Live vs. roadmap

Every section is labeled so there's no ambiguity in a demo:

- 🟢 **Live** (`LiveBadge`) — calls the connected org in real time.
  - **Capability 3 · Review process** — reads the standard `NextReviewDate` field to list articles overdue for review.
  - **Capability 4 · AI drafting** — the custom-agent column invokes `DraftKnowledgeArticle` (text-only by default).
  - **Capability 5 · Data Categories** — the org-standard `Product` data category group, repurposed with the DISW taxonomy; the KM agent's search action scopes retrieval with `WITH DATA CATEGORY`.
  - **The KM Agent drawer** ("Ask the KM Agent") — a grounded Agentforce answer over the published Knowledge base (132 articles in the connected org, nine authored for this DISW walkthrough).
- 🔵 **Roadmap / illustrative** (`FutureStateTag`) — narrative best-practice content, sample data, or recommended models not read live. Capabilities 1, 2, 6, 7 and the Einstein column of 4 are labeled this way.

Nothing fakes a live capability. Where a feature isn't confirmed enabled in the org (Einstein for Knowledge, Data Category Groups), it renders as narrative + roadmap tag rather than a staged result.

## Architecture

- **Frontend** — React 18 + Vite + React Router + Tailwind (dark mode, Siemens teal tokens) + Recharts.
- **BFF** (`server.js`) — Express proxy to Salesforce. Client-credentials OAuth with a cached token; proxies the Actions REST API (drafting), a SOQL read (`/api/km/articles`), and the Agentforce Agent API (SSE streaming for the chat drawer). Serves the built SPA in production.

The org connection is the same reusable Salesforce org / Connected App used by the sibling HAV demo.

## Local development

```bash
npm install
cp .env.example .env   # fill in Salesforce client-credentials + agent id
npm run dev:server     # Express BFF on :3001
npm run dev            # Vite dev server on :5173 (proxies /api → :3001)
```

Open http://localhost:5173. Without the BFF or credentials the teaching content still renders — the live panels show setup guidance instead of erroring.

Quick health check:

```bash
curl localhost:3001/api/health
```

## Configuration

Set these in `.env` locally and as **Heroku config vars** in production — never commit secrets (`.env` is gitignored).

| Var | Purpose |
|---|---|
| `SF_CLIENT_ID` / `SF_CLIENT_SECRET` | Connected App client-credentials |
| `SF_INSTANCE_URL` / `SF_LOGIN_URL` | Org My Domain |
| `SF_API_VER` | e.g. `v62.0` |
| `SF_AGENT_ID` | KM grounded Agentforce agent (blank until deployed → drawer shows "pending deploy") |
| `SF_AGENT_API_HOST` | `https://api.salesforce.com` |
| `ALLOW_KM_WRITES` | `false` by default. Gates persisting a Draft article. Writes require **both** this env flag **and** `createDraft: true` in the request. |
| `PORT` | Server port (Heroku sets this) |

### Write safety

Drafting is **text-only by default**. The BFF will only persist a Draft `Knowledge__kav` when `ALLOW_KM_WRITES=true` *and* the request sets `createDraft: true` — a double gate so a demo can never accidentally write to the live published article set.

## Deploy (Heroku, auto-deploy on push)

1. Create a fresh GitHub repo and push this project.
2. Create a Heroku app, connect the repo, enable automatic deploys.
3. Set the config vars above in Heroku.
4. On push, `heroku-postbuild` runs `vite build`; `web: node server.js` (Procfile) serves `dist` + the BFF.

## Org-side prerequisites for the live proofs

These run in the org (from your terminal / Salesforce CLI), not from this app:

- Deploy `SearchDISWKnowledge.cls` + the `DISW_Support_Assistant` agent; capture its ID into `SF_AGENT_ID` (powers the grounded chat drawer).
- Deploy `DraftKnowledgeArticle.cls` (powers capability 4's custom-agent column).
- Optionally verify Einstein for Knowledge (capability 4, Einstein column) and Data Category Groups (capability 5) — until confirmed, both stay labeled roadmap.

`NextReviewDate` is a standard field already present in the org, so capability 3 needs no field creation.
