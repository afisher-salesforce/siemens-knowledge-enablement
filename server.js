import express from 'express';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Salesforce OAuth Configuration ──────────────────────────────────────────
const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const SF_INSTANCE_URL = (process.env.SF_INSTANCE_URL || '').replace(/\/+$/, '');
// Client credentials flow requires My Domain URL, not login.salesforce.com
const SF_LOGIN_URL = process.env.SF_LOGIN_URL || SF_INSTANCE_URL;
const SF_API_VER = process.env.SF_API_VER || 'v62.0';

// Write gate — mirrors the `hav` MCP server's ALLOW_WRITES pattern. When false
// (the default), the draft-article proof returns generated TEXT ONLY and never
// creates a Draft Knowledge__kav record in the live org. Set ALLOW_KM_WRITES=true
// to let the DraftKnowledgeArticle action persist a draft.
const ALLOW_KM_WRITES = process.env.ALLOW_KM_WRITES === 'true';

// ─── Agentforce Agent Configuration ─────────────────────────────────────────
// The KM-grounded agent (DISW_Support_Assistant) grounds answers in the org's
// published Knowledge__kav articles via its search_knowledge action. Its ID is
// captured after the agent is deployed into the HAV live org.
const SF_AGENT_ID = process.env.SF_AGENT_ID;
const AGENT_API_BASE = '/einstein/ai-agent/v1';
// The Agent API runs on api.salesforce.com — a SEPARATE host from the org's My
// Domain instance URL. The instance URL is passed INSIDE the session body as
// instanceConfig.endpoint, NOT used as the request host. (Gov Cloud orgs:
// override SF_AGENT_API_HOST with https://api.gov.salesforce.com)
const AGENT_API_HOST = process.env.SF_AGENT_API_HOST || 'https://api.salesforce.com';

// Build the Agent API session-create body. The frontend sends {}, so the server
// injects the fields the Agent API requires — notably instanceConfig.endpoint,
// which is where the My Domain (instance) URL actually belongs.
//
// NOTE: do NOT send bypassUser:true. That tells the API to use the agent's
// assigned user instead of the caller; a client-credentials agent has no
// assigned user, so the API rejects the session with "Invalid user ID provided
// on start session". Omitting it (equivalently bypassUser:false) makes the
// session run as the client-credentials Run-As user from the token.
function buildAgentSessionBody(reqBody, instanceUrl) {
  return {
    externalSessionKey:
      globalThis.crypto?.randomUUID?.() ??
      `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    instanceConfig: { endpoint: instanceUrl },
    streamingCapabilities: { chunkTypes: ['Text'] },
    bypassUser: false,
    ...(reqBody || {}),
  };
}

// Normalize the message-send body for the Agent API. The frontend sends
// { message: "text" }, but /sessions/{id}/messages requires a structured
// message: { message: { sequenceId, type: 'Text', text } }. Accept either the
// raw string form or an already-structured body and coerce to the API shape.
let agentMsgSequence = 0;
function buildAgentMessageBody(reqBody) {
  const m = reqBody?.message;
  if (m && typeof m === 'object' && typeof m.text === 'string') {
    return { message: { sequenceId: m.sequenceId ?? ++agentMsgSequence, type: m.type || 'Text', text: m.text } };
  }
  const text = typeof m === 'string' ? m : typeof reqBody?.text === 'string' ? reqBody.text : '';
  return { message: { sequenceId: ++agentMsgSequence, type: 'Text', text } };
}

// ─── Token Cache ─────────────────────────────────────────────────────────────
let tokenCache = {
  accessToken: null,
  instanceUrl: null,
  expiresAt: 0,
};

/**
 * Authenticate to Salesforce using Client Credentials OAuth flow.
 * Caches the token and refreshes 5 minutes before expiry.
 * Returns { accessToken, instanceUrl } — use instanceUrl for all API calls.
 */
async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 5 * 60 * 1000) {
    return { accessToken: tokenCache.accessToken, instanceUrl: tokenCache.instanceUrl || SF_INSTANCE_URL };
  }

  console.log('[SF Auth] Requesting new access token via client_credentials flow...');

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: SF_CLIENT_ID,
    client_secret: SF_CLIENT_SECRET,
  });

  try {
    const response = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[SF Auth] Token request failed:', response.status, errorBody);
      throw new Error(`Salesforce auth failed: ${response.status}`);
    }

    const data = await response.json();
    const instanceUrl = (data.instance_url || SF_INSTANCE_URL).replace(/\/+$/, '');
    tokenCache = {
      accessToken: data.access_token,
      instanceUrl,
      expiresAt: now + (data.issued_at ? parseInt(data.issued_at) + 7200000 - now : 7200000),
    };

    console.log(`[SF Auth] Access token obtained. instance_url=${instanceUrl}`);
    return { accessToken: tokenCache.accessToken, instanceUrl };
  } catch (err) {
    console.error('[SF Auth] Authentication error:', err.message);
    throw err;
  }
}

// Run a SOQL query against the org's REST API. Returns the parsed response.
async function soqlQuery(soql) {
  const { accessToken, instanceUrl } = await getAccessToken();
  const url = `${instanceUrl}/services/data/${SF_API_VER}/query/?q=${encodeURIComponent(soql)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const err = new Error(`Non-JSON SOQL response (${response.status})`);
    err.status = response.status;
    err.body = text.slice(0, 400);
    throw err;
  }
  if (!response.ok) {
    const err = new Error(Array.isArray(data) ? data[0]?.message : `SOQL failed (${response.status})`);
    err.status = response.status;
    err.errorCode = Array.isArray(data) ? data[0]?.errorCode : undefined;
    err.body = data;
    throw err;
  }
  return data;
}

// Run a SOSL search against the org's REST search endpoint. Returns the parsed
// response ({ searchRecords: [...] }).
async function soslSearch(sosl) {
  const { accessToken, instanceUrl } = await getAccessToken();
  const url = `${instanceUrl}/services/data/${SF_API_VER}/search/?q=${encodeURIComponent(sosl)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const err = new Error(`Non-JSON SOSL response (${response.status})`);
    err.status = response.status;
    err.body = text.slice(0, 400);
    throw err;
  }
  if (!response.ok) {
    const err = new Error(Array.isArray(data) ? data[0]?.message : `SOSL failed (${response.status})`);
    err.status = response.status;
    err.body = data;
    throw err;
  }
  return data;
}

// Index of published DISW Knowledge articles ({ id, title }), cached briefly so
// we can map the agent's reply back to the exact article it grounded on without
// a SOQL round-trip per message. The corpus is tiny (≈9 articles) and changes
// rarely, so a short TTL is plenty.
let diswArticleIndex = { articles: [], expiresAt: 0 };
const DISW_INDEX_TTL_MS = 5 * 60 * 1000;

async function getDiswArticleIndex() {
  if (diswArticleIndex.articles.length && Date.now() < diswArticleIndex.expiresAt) {
    return diswArticleIndex.articles;
  }
  try {
    const soql =
      "SELECT Id, Title FROM Knowledge__kav " +
      "WHERE PublishStatus = 'Online' AND RecordType.DeveloperName = 'DISW_Knowledge' " +
      'ORDER BY Title LIMIT 200';
    const data = await soqlQuery(soql);
    const articles = (data.records || [])
      .filter((r) => r.Id && r.Title)
      .map((r) => ({ id: r.Id, title: r.Title }));
    if (articles.length) {
      diswArticleIndex = { articles, expiresAt: Date.now() + DISW_INDEX_TTL_MS };
    }
    return articles;
  } catch (err) {
    console.warn('[Agent API] DISW article index load failed (non-fatal):', err.message);
    return diswArticleIndex.articles; // may be stale/empty; caller handles null
  }
}

// Normalize a title for tolerant comparison: lowercase, collapse whitespace,
// strip surrounding Markdown-link syntax, drop trailing punctuation.
function normalizeTitle(s) {
  let t = (s || '').trim();
  // If the line is a Markdown link [Title](...), pull out the Title.
  const md = /^\[([^\]]+)\]\([^)]*\)\s*$/.exec(t);
  if (md) t = md[1];
  return t
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.:;,\s]+$/g, '')
    .trim();
}

// Map the agent's own reply to the article it grounded on. The subagents are
// instructed to lead with the article title (as a citation) on the first line,
// so the agent's response — not the raw user query — is the ground truth for
// which article was used. Matching on the reply makes the in-app pill track the
// agent's actual grounding exactly, which a separate query-based SOSL does not
// (a verbose user sentence can SOSL-rank to a different article than the focused
// query the planner passes to search_knowledge). Returns { id, title } or null.
async function matchCitationFromReply(replyText) {
  const text = (replyText || '').trim();
  if (!text) return null;
  const index = await getDiswArticleIndex();
  if (!index.length) return null;

  // Candidate lines: the first few non-empty lines (title is normally line 1,
  // but a preamble or blank line can push it down).
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 4);

  const normIndex = index.map((a) => ({ ...a, norm: normalizeTitle(a.title) }));

  // 1) Exact normalized match of a whole line to an article title.
  for (const line of lines) {
    const n = normalizeTitle(line);
    const hit = normIndex.find((a) => a.norm === n);
    if (hit) return { id: hit.id, title: hit.title };
  }
  // 2) A line that STARTS WITH the title (agent prepended/append­ed words).
  for (const line of lines) {
    const n = normalizeTitle(line);
    const hit = normIndex.find((a) => n.startsWith(a.norm) || a.norm.startsWith(n));
    if (hit && n.length >= 8) return { id: hit.id, title: hit.title };
  }
  // 3) Title appears anywhere in the reply (last resort, longest title wins to
  // avoid a short title matching inside a longer one).
  const normBody = normalizeTitle(text);
  const contained = normIndex
    .filter((a) => a.norm.length >= 12 && normBody.includes(a.norm))
    .sort((a, b) => b.norm.length - a.norm.length);
  if (contained.length) return { id: contained[0].id, title: contained[0].title };

  return null;
}

// Find the published Knowledge article the agent grounds on for a given query
// by invoking the SAME Apex action the agent uses (SearchDISWKnowledge) via the
// Actions REST API. Returns { id, title } for the top hit, or null. Used as a
// FALLBACK when the agent's reply can't be matched to an article title (see
// matchCitationFromReply, which is preferred because it tracks the agent's
// actual grounding). The DISW_Support_Assistant agent grounds correctly but will
// not reliably emit the article as a Markdown link in its prose (its
// citedReferences also come back empty), so the BFF attaches this citation and
// the drawer renders a deterministic in-app pill decoupled from the agent's
// wording. Best-effort: never throws into the message flow.
async function findCitationArticle(queryText) {
  const q = (queryText || '').trim();
  if (!q) return null;
  try {
    const { accessToken, instanceUrl } = await getAccessToken();
    const url = `${instanceUrl}/services/data/${SF_API_VER}/actions/custom/apex/SearchDISWKnowledge`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ inputs: [{ searchQuery: q }] }),
    });
    if (!response.ok) {
      console.warn('[Agent API] citation lookup action failed (non-fatal):', response.status);
      return null;
    }
    const data = await response.json();
    const out = (Array.isArray(data) ? data[0] : data)?.outputValues;
    const title = out?.articleTitle1;
    // Prefer the explicit articleId1 the action now returns; fall back to
    // parsing the "/article/<Id>" portal URL so the BFF still works if it is
    // deployed/running ahead of the updated Apex.
    const id =
      out?.articleId1 ||
      (typeof out?.articlePortalUrl1 === 'string'
        ? out.articlePortalUrl1.replace(/^\/article\//, '')
        : null);
    if (title && id) return { id, title };
  } catch (err) {
    console.warn('[Agent API] citation lookup failed (non-fatal):', err.message);
  }
  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sfConfigured: !!(SF_CLIENT_ID && SF_CLIENT_SECRET && SF_INSTANCE_URL),
    agentConfigured: !!(SF_AGENT_ID && SF_CLIENT_ID),
    writesEnabled: ALLOW_KM_WRITES,
  });
});

// Salesforce org URL for record links (consumed by SalesforceLink component)
app.get('/api/sf-org-url', (_req, res) => {
  res.json({ url: SF_INSTANCE_URL || null });
});

// Authenticated Salesforce user info (name, initials, photo) for the UI avatar
app.get('/api/user', async (_req, res) => {
  try {
    const { accessToken, instanceUrl } = await getAccessToken();
    const response = await fetch(`${instanceUrl}/services/oauth2/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error(`UserInfo failed: ${response.status}`);
    const data = await response.json();
    const firstName = data.given_name || (data.name ? data.name.split(' ')[0] : 'User');
    const lastName = data.family_name || (data.name ? data.name.split(' ').slice(1).join(' ') : '');
    const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || 'U';
    res.json({
      name: data.name || 'User',
      firstName,
      initials,
      photo: data.picture || null,
      profileUrl: `${instanceUrl}/lightning/settings/personal/PersonalInformation/home`,
    });
  } catch (err) {
    console.error('[User] Error fetching user info:', err.message);
    res.json({ name: 'Admin', firstName: 'Admin', initials: 'A', photo: null, profileUrl: null });
  }
});

// ─── Knowledge Management API ────────────────────────────────────────────────

// GET /api/km/articles — read published Knowledge__kav articles for the live
// proof points (C3 review-cadence overdue list, C8 stale-candidate count).
//
// Query params:
//   scope=overdue  → published articles whose NextReviewDate is in the past
//   scope=all      → recent published articles (default)
//   limit=<n>      → cap rows (default 25, max 200)
//
// Defensive field fallback: some orgs/record types lack optional fields
// (Article_Confidence__c, Requires_Revision__c). On INVALID_FIELD / "No such
// column", we retry with a minimal field set so the read still succeeds — the
// same resilience pattern used in support-moment/server/mcp.js.
app.get('/api/km/articles', async (req, res) => {
  if (!SF_CLIENT_ID || !SF_CLIENT_SECRET || !SF_INSTANCE_URL) {
    return res.status(503).json({ error: 'Salesforce credentials not configured' });
  }

  const scope = req.query.scope === 'overdue' ? 'overdue' : 'all';
  const limit = Math.min(parseInt(req.query.limit) || 25, 200);

  const whereOnline = "PublishStatus = 'Online'";
  const whereOverdue = scope === 'overdue' ? ' AND NextReviewDate < TODAY' : '';
  const orderBy = scope === 'overdue' ? 'NextReviewDate ASC NULLS LAST' : 'LastModifiedDate DESC';

  const fullFields = 'Id, Title, KnowledgeArticleId, UrlName, PublishStatus, NextReviewDate, LastModifiedDate, RecordType.Name, Requires_Revision__c, Article_Confidence__c';
  const minFields = 'Id, Title, KnowledgeArticleId, UrlName, PublishStatus, NextReviewDate, LastModifiedDate';

  const buildSoql = (fields) =>
    `SELECT ${fields} FROM Knowledge__kav WHERE ${whereOnline}${whereOverdue} ORDER BY ${orderBy} LIMIT ${limit}`;

  const isFieldError = (err) => {
    const code = err?.errorCode || '';
    const msg = (err?.message || '').toLowerCase();
    return code === 'INVALID_FIELD' || msg.includes('no such column') || msg.includes('invalid field');
  };

  try {
    let data;
    try {
      data = await soqlQuery(buildSoql(fullFields));
    } catch (err) {
      if (isFieldError(err)) {
        console.warn('[KM] Optional field missing — retrying with minimal fields.');
        data = await soqlQuery(buildSoql(minFields));
      } else {
        throw err;
      }
    }

    const articles = (data.records || []).map((r) => ({
      id: r.Id,
      title: r.Title,
      articleId: r.KnowledgeArticleId,
      urlName: r.UrlName,
      publishStatus: r.PublishStatus,
      nextReviewDate: r.NextReviewDate || null,
      lastModified: r.LastModifiedDate || null,
      recordType: r.RecordType?.Name || null,
      requiresRevision: r.Requires_Revision__c ?? null,
      confidence: r.Article_Confidence__c ?? null,
    }));

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ scope, count: data.totalSize ?? articles.length, articles });
  } catch (err) {
    console.error('[KM] articles query error:', err.message);
    if (err.status === 401 || (err.message || '').includes('auth')) {
      tokenCache = { accessToken: null, instanceUrl: null, expiresAt: 0 };
      return res.status(401).json({ error: 'Authentication failed', message: err.message });
    }
    res.status(502).json({ error: 'Upstream error', message: err.message, detail: err.body });
  }
});

// GET /api/km/article/:id — fetch ONE published Knowledge__kav by Id for the
// in-app article viewer (/article/:id). The agent cites articles with a relative
// /article/<Id> link so the content renders inside this Heroku app rather than
// jumping out to Salesforce Lightning — showcasing Agentforce end-to-end.
//
// Returns the record-type-specific rich-text body fields WITH their HTML intact
// (the React ArticleView sanitizes + renders them). Same defensive field
// fallback as /api/km/articles: some record types lack some fields, so on an
// INVALID_FIELD error we retry with the minimal set.
app.get('/api/km/article/:id', async (req, res) => {
  if (!SF_CLIENT_ID || !SF_CLIENT_SECRET || !SF_INSTANCE_URL) {
    return res.status(503).json({ error: 'Salesforce credentials not configured' });
  }

  const rawId = String(req.params.id || '');
  // Guard against SOQL injection — Salesforce Ids are 15/18 alphanumerics.
  if (!/^[a-zA-Z0-9]{15,18}$/.test(rawId)) {
    return res.status(400).json({ error: 'Invalid article Id' });
  }

  const bodyFields =
    'Summary, FAQ_Question__c, FAQ_Answer__c, Chat_Answer__c, ' +
    'KCSArticle_Issue__c, KCSArticle_Cause__c, KCSArticle_Environment__c, KCSArticle_Resolution__c';
  const fullFields = `Id, Title, KnowledgeArticleId, PublishStatus, LastPublishedDate, RecordType.Name, ${bodyFields}`;
  const minFields = `Id, Title, KnowledgeArticleId, PublishStatus, ${bodyFields}`;

  const buildSoql = (fields) =>
    `SELECT ${fields} FROM Knowledge__kav WHERE Id = '${rawId}' AND PublishStatus = 'Online' LIMIT 1`;

  const isFieldError = (err) => {
    const code = err?.errorCode || '';
    const msg = (err?.message || '').toLowerCase();
    return code === 'INVALID_FIELD' || msg.includes('no such column') || msg.includes('invalid field');
  };

  try {
    let data;
    try {
      data = await soqlQuery(buildSoql(fullFields));
    } catch (err) {
      if (isFieldError(err)) {
        console.warn('[KM] article: optional field missing — retrying with minimal fields.');
        data = await soqlQuery(buildSoql(minFields));
      } else {
        throw err;
      }
    }

    const r = (data.records || [])[0];
    if (!r) {
      return res.status(404).json({ error: 'Article not found or not published' });
    }

    // Assemble the body sections in reading order, preserving their HTML so the
    // client can sanitize + render rich text. Only include populated sections.
    const sections = [];
    const push = (label, html) => {
      if (html && String(html).trim()) sections.push({ label: label || null, html: String(html) });
    };
    // KCS: Issue → Environment → Cause → Resolution
    push('Issue', r.KCSArticle_Issue__c);
    push('Environment', r.KCSArticle_Environment__c);
    push('Cause', r.KCSArticle_Cause__c);
    push('Resolution', r.KCSArticle_Resolution__c);
    // FAQ: Question → Answer
    push('Question', r.FAQ_Question__c);
    push(null, r.FAQ_Answer__c);
    // Chat-answer fallback
    push(null, r.Chat_Answer__c);
    // Summary fallback when no body section carried content
    if (sections.length === 0 && r.Summary) push(null, r.Summary);

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      id: r.Id,
      title: r.Title,
      articleId: r.KnowledgeArticleId,
      summary: r.Summary || null,
      recordType: r.RecordType?.Name || null,
      lastPublished: r.LastPublishedDate || null,
      sections,
    });
  } catch (err) {
    console.error('[KM] article query error:', err.message);
    if (err.status === 401 || (err.message || '').includes('auth')) {
      tokenCache = { accessToken: null, instanceUrl: null, expiresAt: 0 };
      return res.status(401).json({ error: 'Authentication failed', message: err.message });
    }
    res.status(502).json({ error: 'Upstream error', message: err.message, detail: err.body });
  }
});

// POST /api/km/draft-article — LIVE proof (a), custom-agent column: invoke the
// DraftKnowledgeArticle invocable Apex via the Actions REST API (the same call
// shape as support-moment/server/chat.js). By default the action returns
// generated TEXT ONLY. Persisting a Draft Knowledge__kav requires BOTH the
// server-side ALLOW_KM_WRITES gate AND createDraft=true in the request — a
// double gate so a demo can never accidentally write to the live 132-article set.
app.post('/api/km/draft-article', async (req, res) => {
  if (!SF_CLIENT_ID || !SF_CLIENT_SECRET || !SF_INSTANCE_URL) {
    return res.status(503).json({ error: 'Salesforce credentials not configured' });
  }

  const { productGroup, sourceProblem, sourceNotes, fewShotExamples, createDraft } = req.body || {};
  if (!sourceProblem && !sourceNotes) {
    return res.status(400).json({ error: 'sourceProblem or sourceNotes is required' });
  }

  // Enforce the write gate before the persist flag ever reaches the org.
  const wantsWrite = createDraft === true;
  const effectiveCreateDraft = wantsWrite && ALLOW_KM_WRITES;
  if (wantsWrite && !ALLOW_KM_WRITES) {
    console.warn('[KM] draft-article: createDraft requested but ALLOW_KM_WRITES=false — returning text only.');
  }

  try {
    const { accessToken, instanceUrl } = await getAccessToken();
    const url = `${instanceUrl}/services/data/${SF_API_VER}/actions/custom/apex/DraftKnowledgeArticle`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        inputs: [
          {
            productGroup: productGroup || null,
            sourceProblem: sourceProblem || null,
            sourceNotes: sourceNotes || null,
            fewShotExamples: fewShotExamples || null,
            createDraft: effectiveCreateDraft,
          },
        ],
      }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(response.status || 502).json({
        error: 'Invalid response from Actions API',
        status: response.status,
        body: text.slice(0, 400),
      });
    }

    if (!response.ok) {
      console.error('[KM] draft-article action failed:', response.status, JSON.stringify(data).slice(0, 400));
      return res.status(response.status).json({ error: 'Action failed', detail: data });
    }

    // Actions REST returns an array of results, one per input.
    const first = Array.isArray(data) ? data[0] : data;
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      writesEnabled: ALLOW_KM_WRITES,
      persisted: effectiveCreateDraft,
      requestedPersist: wantsWrite,
      result: first?.outputValues ?? first,
      isSuccess: first?.isSuccess ?? true,
    });
  } catch (err) {
    console.error('[KM] draft-article error:', err.message);
    if ((err.message || '').includes('auth')) {
      tokenCache = { accessToken: null, instanceUrl: null, expiresAt: 0 };
      return res.status(401).json({ error: 'Authentication failed', message: err.message });
    }
    res.status(502).json({ error: 'Upstream error', message: err.message });
  }
});

// ─── Generic KM Apex REST Proxy (optional) ───────────────────────────────────
// Forwards /api/km-apex/* to /services/apexrest/km/* if custom KM Apex REST
// resources are exposed. The Actions REST route above covers the draft proof;
// this exists for any future custom @RestResource endpoints.
app.all('/api/km-apex/*', async (req, res) => {
  if (!SF_CLIENT_ID || !SF_CLIENT_SECRET || !SF_INSTANCE_URL) {
    return res.status(503).json({ error: 'Salesforce credentials not configured' });
  }
  try {
    const { accessToken, instanceUrl } = await getAccessToken();
    const sfPath = req.originalUrl.replace(/^\/api\/km-apex/, '/services/apexrest/km');
    const sfUrl = `${instanceUrl}${sfPath}`;
    console.log(`[KM Apex Proxy] ${req.method} ${sfUrl}`);
    const sfResponse = await fetch(sfUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store',
      },
      ...(req.method !== 'GET' && req.method !== 'HEAD' && req.body
        ? { body: JSON.stringify(req.body) }
        : {}),
    });
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    const text = await sfResponse.text();
    const contentType = sfResponse.headers.get('content-type') || '';
    if (text && contentType.includes('application/json')) {
      try {
        res.status(sfResponse.status).json(JSON.parse(text));
      } catch {
        res.status(sfResponse.status).send(text);
      }
    } else if (text) {
      res.status(sfResponse.status).send(text);
    } else {
      res.status(sfResponse.status === 304 ? 200 : sfResponse.status).json(null);
    }
  } catch (err) {
    console.error('[KM Apex Proxy] Error:', err.message);
    if ((err.message || '').includes('auth')) {
      tokenCache = { accessToken: null, instanceUrl: null, expiresAt: 0 };
      return res.status(401).json({ error: 'Authentication failed', message: err.message });
    }
    res.status(502).json({ error: 'Upstream error', message: err.message });
  }
});

// ─── Agentforce Agent API Proxy (LIVE proof (b): grounded answer) ────────────

// GET /api/agent/config — expose agent ID + configured status to the front-end
app.get('/api/agent/config', (_req, res) => {
  res.json({ agentId: SF_AGENT_ID || null, configured: !!(SF_AGENT_ID && SF_CLIENT_ID) });
});

// POST /api/agent/sessions — create a new Agent API session
app.post('/api/agent/sessions', async (req, res) => {
  if (!SF_AGENT_ID) {
    return res.status(503).json({ error: 'Agent not configured', message: 'Set SF_AGENT_ID once the KM-grounded agent is deployed.' });
  }
  try {
    const { accessToken, instanceUrl } = await getAccessToken();
    const sfUrl = `${AGENT_API_HOST}${AGENT_API_BASE}/agents/${SF_AGENT_ID}/sessions`;
    console.log(`[Agent API] Creating session for agent ${SF_AGENT_ID} at ${sfUrl}`);

    const sfResponse = await fetch(sfUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(buildAgentSessionBody(req.body, instanceUrl)),
    });

    const text = await sfResponse.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[Agent API] Non-JSON response:', sfResponse.status, text.slice(0, 500));
      return res.status(sfResponse.status || 502).json({
        error: 'Invalid response from Agent API',
        status: sfResponse.status,
        body: text.slice(0, 200),
      });
    }

    if (!sfResponse.ok) {
      console.error('[Agent API] Session creation failed:', sfResponse.status, data);
      return res.status(sfResponse.status).json(data);
    }

    console.log(`[Agent API] Session created: ${data.sessionId || data.id}`);
    res.json(data);
  } catch (err) {
    console.error('[Agent API] Session error:', err.message);
    if (err.message.includes('auth')) {
      tokenCache = { accessToken: null, instanceUrl: null, expiresAt: 0 };
    }
    res.status(502).json({ error: 'Agent API error', message: err.message });
  }
});

// POST /api/agent/sessions/:sessionId/messages — send message, stream via SSE
app.post('/api/agent/sessions/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const { accessToken } = await getAccessToken();
    const sfUrl = `${AGENT_API_HOST}${AGENT_API_BASE}/sessions/${sessionId}/messages`;
    console.log(`[Agent API] Sending message to session ${sessionId}`);

    // The user's query text — used to look up the grounded article for a
    // deterministic in-app citation pill (the agent won't emit it reliably).
    const queryText =
      typeof req.body?.message === 'string'
        ? req.body.message
        : req.body?.message?.text || req.body?.text || '';

    // Warm the query-based fallback concurrently with the agent call. For the
    // JSON path we PREFER matching the agent's actual reply (matchCitationFromReply)
    // so the pill tracks the article the agent truly grounded on; the query-based
    // lookup is only a fallback when the reply can't be matched to a title.
    const fallbackCitationPromise = findCitationArticle(queryText);
    const sfResponse = await fetch(sfUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify(buildAgentMessageBody(req.body)),
    });

    const contentType = sfResponse.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      // SSE: the reply isn't buffered here, so we can only use the query-based
      // lookup. Emit the citation as a synthetic event first, then pipe through.
      const citation = await fallbackCitationPromise;
      if (citation) {
        res.write(`data: ${JSON.stringify({ type: 'Citation', citation })}\n\n`);
      }
      sfResponse.body.pipe(res);
      return;
    }

    if (contentType.includes('application/json')) {
      const data = await sfResponse.json();
      // Prefer the reply-derived citation (tracks the agent's real grounding);
      // fall back to the query-based lookup only if the reply has no title match.
      const replyText =
        data?.messages?.find((m) => m?.message)?.message ||
        data?.messages?.[0]?.message ||
        data?.messages?.[0]?.text ||
        '';
      let citation = await matchCitationFromReply(replyText);
      if (!citation) citation = await fallbackCitationPromise;
      if (citation) data.citation = citation;
      res.status(sfResponse.status).json(data);
    } else {
      const text = await sfResponse.text();
      res.status(sfResponse.status).send(text);
    }
  } catch (err) {
    console.error('[Agent API] Message error:', err.message);
    if (err.message.includes('auth')) {
      tokenCache = { accessToken: null, instanceUrl: null, expiresAt: 0 };
    }
    res.status(502).json({ error: 'Agent API error', message: err.message });
  }
});

// DELETE /api/agent/sessions/:sessionId — end session
app.delete('/api/agent/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const { accessToken } = await getAccessToken();
    const sfUrl = `${AGENT_API_HOST}${AGENT_API_BASE}/sessions/${sessionId}`;
    const sfResponse = await fetch(sfUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (sfResponse.status === 204) {
      return res.status(204).end();
    }
    const data = await sfResponse.json();
    res.status(sfResponse.status).json(data);
  } catch (err) {
    console.error('[Agent API] Session delete error:', err.message);
    res.status(502).json({ error: 'Agent API error', message: err.message });
  }
});

// ─── Serve Static Files (Production) ─────────────────────────────────────────
const distPath = join(__dirname, 'dist');

app.use('/assets', express.static(join(distPath, 'assets'), {
  maxAge: '1y',
  immutable: true,
}));

app.use('/assets', (_req, res) => {
  res.status(404).send('Not found');
});

app.use(express.static(distPath, {
  index: false,
  etag: false,
}));

// SPA fallback — serve index.html for any non-API route with NO caching
app.get('*', (_req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(join(distPath, 'index.html'));
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Siemens DISW · Knowledge Management Site`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Port:          ${PORT}`);
  console.log(`  SF Instance:   ${SF_INSTANCE_URL || '(not configured)'}`);
  console.log(`  SF Login URL:  ${SF_LOGIN_URL}`);
  console.log(`  SF API ver:    ${SF_API_VER}`);
  console.log(`  Agent API:     ${AGENT_API_HOST}${AGENT_API_BASE} (My Domain passed in session body)`);
  console.log(`  SF Configured: ${!!(SF_CLIENT_ID && SF_CLIENT_SECRET && SF_INSTANCE_URL)}`);
  console.log(`  KM Agent:      ${SF_AGENT_ID || '(not configured)'}`);
  console.log(`  KM Writes:     ${ALLOW_KM_WRITES ? 'ENABLED' : 'disabled (text-only drafts)'}\n`);
});
