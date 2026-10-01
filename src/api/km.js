// Front-end transform layer for the KM BFF. Mirrors the api/salesforce.js
// pattern from the HAV app: thin fetch wrappers that normalize server responses
// for the React views. All calls go through the Vite dev proxy (/api → :3001)
// or, in production, the same Express server that serves the SPA.

async function jsonFetch(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Non-JSON response from ${url} (${res.status})`);
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return data;
}

// GET /api/health — used by the Overview page to show connection status.
export async function getHealth() {
  return jsonFetch('/api/health');
}

// GET /api/km/articles?scope=overdue|all — powers the C3 review-cadence live
// read and the C8 stale-candidate count.
export async function getArticles({ scope = 'all', limit = 25 } = {}) {
  const params = new URLSearchParams({ scope, limit: String(limit) });
  return jsonFetch(`/api/km/articles?${params.toString()}`);
}

// GET /api/km/article/:id — fetch one published article for the in-app viewer
// (/article/:id), the pill-cited target from the KM Agent's grounded answer.
export async function getArticle(id) {
  return jsonFetch(`/api/km/article/${encodeURIComponent(id)}`);
}

// POST /api/km/draft-article — LIVE proof (a), custom-agent column. By default
// returns generated text only; persisting a draft requires BOTH createDraft=true
// here AND ALLOW_KM_WRITES=true on the server.
export async function draftArticle({ productGroup, sourceProblem, sourceNotes, fewShotExamples, createDraft = false } = {}) {
  return jsonFetch('/api/km/draft-article', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productGroup, sourceProblem, sourceNotes, fewShotExamples, createDraft }),
  });
}

// GET /api/agent/config — whether the KM-grounded agent is wired up.
export async function getAgentConfig() {
  return jsonFetch('/api/agent/config');
}
