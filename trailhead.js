/**
 * Trailhead learning integration (server-side).
 *
 * Each knowledge-management capability page shows a "Learn this on Trailhead"
 * rail of real Salesforce Trailhead Modules/Projects, so the best-practice
 * narrative doubles as an enablement path.
 *
 * ARCHITECTURE — staged catalog, not a live pull.
 *
 *   RUNTIME (this request path): `getRecommendations(slug)` reads a committed,
 *   human-reviewed `trailhead-catalog.json`. Zero network, zero MCP, fully
 *   deterministic — the rail renders the same cards every time, which is what a
 *   demo needs. The expensive, flaky part (querying the MCP's keyword index,
 *   pooling, anchor-gating, ranking) is NOT on the request path.
 *
 *   OFFLINE (scripts/refresh-trailhead.js only): the MCP client + ranking below
 *   re-pull from the live Trailhead MCP, anchor-gate the pool, and propose an
 *   updated catalog for a human to diff and commit. This runs monthly / pre-demo,
 *   never on page view.
 *
 * Why staged: live verification proved the public MCP's keyword index is
 * adversarial for this use — common tokens ("Lightning", "setup", "management")
 * hijack queries, TRAIL types flood the pool, and the Knowledge module set it
 * returns is both thin and nondeterministic between identical calls. Trailhead's
 * Knowledge catalog changes slowly (weeks/months), so a live pull bought almost
 * no freshness while adding latency, a runtime dependency, and demo flakiness.
 *
 *   Trailhead MCP: https://mcp.trailhead.salesforce.com/mcp
 *   Transport:     Streamable HTTP (JSON-RPC 2.0 over POST)
 *   Auth:          none (public content)
 *   Tools:         content_search, fetch_content
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// --- Per-capability search configuration (used ONLY by the refresh script) ---

const MCP_URL = process.env.TRAILHEAD_MCP_URL || 'https://mcp.trailhead.salesforce.com/mcp';
const MCP_TIMEOUT_MS = Number(process.env.TRAILHEAD_MCP_TIMEOUT_MS || 8000);

// Restrict the refresh pull to Modules and Projects — the actionable "do this
// next" content. TRAIL is deliberately excluded: the MCP ranks Trails above
// Modules, so allowing TRAIL floods the first:12 pool with off-topic multi-hour
// trails and buries every relevant Module. Validated against the live MCP.
const DEFAULT_TYPES = ['MODULE', 'PROJECT'];

// Queries are short noun phrases — the MCP backend is a keyword index, so
// focused phrases beat long natural-language strings. Each query leads with
// "Knowledge" (or the exact product term) because the index over-weights generic
// qualifiers. `levels` is intentionally NOT sent to the MCP: a `levels` filter
// was proven to strip the Foundational Knowledge basics modules from the pool.
// The `level` string here is a display label only, applied to the staged card.
//
// Topical gating has two parts:
//   `require` (optional) — a MANDATORY anchor. A card must hit this in its title
//     or description or it's rejected outright, no matter what else it matches.
//   `anchors` — at least one must hit (title/description) for the card to be
//     on-topic (relevance > 0).
// A card qualifies only when it hits `require` AND one of `anchors`. This closes
// the keyword-false-positive hole proven by a live refresh: the Knowledge-process
// slugs below set `require: 'knowledge'`, so "Salesforce B2C Commerce Catalogs,
// Categories, and Products" (hits `categor`) and "Software Development Lifecycle"
// (hits `lifecycle`) can no longer qualify — they lack "knowledge" entirely. The
// product slugs (data360/analytics) have no `require`: their anchors are already
// specific enough ("data 360", "report") that any-of is safe.
export const CAPABILITY_QUERIES = {
  distribute: { query: 'Knowledge articles Service Cloud', require: 'knowledge', anchors: ['knowledge'], role: 'Administrator', level: 'Foundational', types: DEFAULT_TYPES, max: 3 },
  publish: { query: 'Lightning Knowledge publishing articles', require: 'knowledge', anchors: ['knowledge', 'publish', 'article'], role: 'Administrator', level: 'Foundational', types: DEFAULT_TYPES, max: 3 },
  review: { query: 'Knowledge Base Improvement Using Feedback', require: 'knowledge', anchors: ['knowledge', 'feedback'], role: 'Administrator', level: 'Foundational', types: DEFAULT_TYPES, max: 3 },
  'ai-drafting': { query: 'Agentforce knowledge grounding', require: 'grounding', anchors: ['knowledge', 'grounding'], role: 'Administrator', level: 'Intermediate', types: DEFAULT_TYPES, max: 3 },
  categories: { query: 'Salesforce Knowledge data categories', require: 'knowledge', anchors: ['knowledge', 'categor'], role: 'Administrator', level: 'Foundational', types: DEFAULT_TYPES, max: 3 },
  data360: { query: 'Data 360 grounding Agentforce', anchors: ['data cloud', 'data 360', 'grounding', 'data library'], role: 'Administrator', level: 'Intermediate', types: DEFAULT_TYPES, max: 3 },
  analytics: { query: 'Reports and dashboards Service Cloud', anchors: ['report', 'dashboard'], role: 'Administrator', level: 'Foundational', types: DEFAULT_TYPES, max: 3 },
  archival: { query: 'Salesforce Knowledge article lifecycle', require: 'knowledge', anchors: ['knowledge', 'lifecycle', 'archiv'], role: 'Administrator', level: 'Foundational', types: DEFAULT_TYPES, max: 3 },
  // Cross-cutting anchor used on the Overview page.
  kcs: { query: 'Knowledge-Centered Service Agentforce', require: 'knowledge', anchors: ['knowledge', 'knowledge-centered'], role: 'Administrator', level: 'Foundational', types: DEFAULT_TYPES, max: 3 },
};

// ===========================================================================
// RUNTIME SURFACE — reads the committed catalog. No network. No MCP.
// ===========================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, 'trailhead-catalog.json');

// Load the staged catalog once at module load. On any failure (missing file,
// bad JSON) fall back to an empty catalog so the rail degrades gracefully rather
// than crashing the BFF — a capability simply shows its empty state.
let CATALOG = { capabilities: {} };
try {
  CATALOG = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
} catch (err) {
  console.warn(`[Trailhead] could not load ${CATALOG_PATH} (rail will be empty):`, err.message);
}

export const TRAILHEAD_SLUGS = Object.keys(CAPABILITY_QUERIES);

/**
 * Recommendations for a capability slug — served straight from the staged
 * catalog. Deterministic, instant, no network. `source:'staged'` marks the
 * payload as catalog-backed; `degraded:true` only when a slug has zero staged
 * items (the rail renders its quiet empty state).
 */
export function getRecommendations(slug) {
  if (!CAPABILITY_QUERIES[slug]) {
    return { slug, items: [], source: 'staged', degraded: false, reason: 'unknown-capability' };
  }
  const entry = (CATALOG.capabilities && CATALOG.capabilities[slug]) || {};
  const items = Array.isArray(entry.items) ? entry.items : [];
  return { slug, items, source: 'staged', degraded: items.length === 0 };
}

// ===========================================================================
// OFFLINE SURFACE — the live MCP client + ranking. Imported ONLY by
// scripts/refresh-trailhead.js. Nothing here runs on the request path; the
// network imports stay lazy so loading this module never opens a socket.
// ===========================================================================

let rpcId = 0;

/**
 * One JSON-RPC call to the MCP endpoint. Streamable HTTP lets the server reply
 * with either application/json or a text/event-stream; we accept both and, for
 * SSE, concatenate the `data:` lines and parse the final JSON-RPC envelope.
 * `node-fetch` is imported lazily so merely loading this module (which the BFF
 * does) never pulls in the HTTP client or touches the network.
 */
async function mcpRpc(method, params, sessionId) {
  const { default: fetch } = await import('node-fetch');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS);
  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };
    if (sessionId) headers['Mcp-Session-Id'] = sessionId;

    const resp = await fetch(MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
      signal: controller.signal,
    });

    const newSession = resp.headers.get('mcp-session-id') || sessionId;
    const ct = resp.headers.get('content-type') || '';
    const raw = await resp.text();

    if (!resp.ok) {
      throw new Error(`MCP ${method} HTTP ${resp.status}: ${raw.slice(0, 200)}`);
    }

    let envelope;
    if (ct.includes('text/event-stream')) {
      const dataLines = raw
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .filter(Boolean);
      const joined = dataLines[dataLines.length - 1] || '';
      envelope = JSON.parse(joined);
    } else {
      envelope = JSON.parse(raw);
    }

    if (envelope.error) {
      throw new Error(`MCP ${method} error: ${envelope.error.message || JSON.stringify(envelope.error)}`);
    }
    return { result: envelope.result, sessionId: newSession };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Initialize an MCP session then call content_search. Returns the raw tool
 * result. `levels` is intentionally omitted from the arguments (it strips
 * Foundational Knowledge modules); `role`/`types` bias the pool.
 */
async function contentSearch({ query, role, types }) {
  const init = await mcpRpc(
    'initialize',
    { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'siemens-km-site', version: '1.0.0' } },
    null
  );
  const sessionId = init.sessionId;
  try {
    await mcpRpc('notifications/initialized', {}, sessionId);
  } catch {
    /* non-fatal */
  }

  const args = { query, first: 12 };
  if (role) args.roles = [role];
  if (types && types.length) args.types = types;

  const call = await mcpRpc('tools/call', { name: 'content_search', arguments: args }, sessionId);
  return call.result;
}

// Trailhead content `type` codes → friendly card labels.
const TYPE_LABELS = {
  LEARNINGPATH: 'Trail',
  TRAIL: 'Trail',
  MODULE: 'Module',
  PROJECT: 'Project',
  SUPERBADGE: 'Superbadge',
  CREDENTIAL: 'Credential',
  QUICKSTART: 'Quick Start',
};

function labelForType(rawType, url) {
  const key = String(rawType || '').toUpperCase();
  if (TYPE_LABELS[key]) return TYPE_LABELS[key];
  if (/\/trails?\//.test(url || '')) return 'Trail';
  if (/\/modules?\//.test(url || '')) return 'Module';
  if (/\/projects?\//.test(url || '')) return 'Project';
  if (/superbadge/i.test(url || '')) return 'Superbadge';
  return 'Trailhead';
}

/**
 * Rank + trim structured results into at most `max` ON-TOPIC cards. Topical
 * relevance dominates: an anchor hit in the title scores highest, a hit anywhere
 * else is weaker, and a card with no anchor hit at all scores 0. For the staged
 * catalog we keep ONLY cards with relevance > 0 — we never backfill off-topic
 * filler, so a thin-but-honest rail is the worst case, never an irrelevant one.
 */
function rankStructured(results, cfg, max) {
  const terms = String(cfg.query || '')
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 3);
  const anchors = (cfg.anchors || []).map((a) => a.toLowerCase());
  const require = cfg.require ? String(cfg.require).toLowerCase() : null;

  const scored = results.map((r) => {
    const title = String(r.title || '').toLowerCase();
    const desc = String(r.description || '').toLowerCase();
    const hay = `${title} ${desc}`;
    const termHits = terms.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
    const label = labelForType(r.type, r.url);
    const minutes = Number(r.minuteTotal) || 0;
    const brevity = minutes > 0 ? Math.max(0, 1 - minutes / 240) : 0.3;
    const typeBoost = label === 'Module' || label === 'Project' || label === 'Quick Start' ? 0.5 : 0;

    // A mandatory `require` anchor must appear somewhere, or the card is out —
    // this is what stops a keyword hit on a loose topic anchor ("categor",
    // "lifecycle") from floating in a module that isn't about Knowledge at all.
    const meetsRequire = !require || hay.includes(require);
    const anchorInTitle = anchors.some((a) => title.includes(a));
    const anchorInHay = anchors.some((a) => hay.includes(a));
    const relevance = !meetsRequire ? 0 : anchorInTitle ? 10 : anchorInHay ? 5 : 0;

    return { r, label, minutes, relevance, score: relevance + termHits * 2 + brevity + typeBoost };
  });

  scored.sort((a, b) => b.score - a.score);

  const toCard = ({ r, label, minutes }) => ({
    title: (r.title || '').trim(),
    url: (r.url || '').trim(),
    synopsis: (r.description || `Trailhead learning for ${cfg.query}.`).slice(0, 200),
    type: label,
    level: cfg.level,
    minutes: minutes || null,
  });

  const usable = (s) => {
    const url = (s.r.url || '').trim();
    return url && /trailhead\.salesforce\.com/.test(url) && (s.r.title || '').trim();
  };

  // Staged catalog: on-topic only. relevance > 0 is the gate; no filler tier.
  const relevant = scored.filter((s) => s.relevance > 0 && usable(s));

  const cards = [];
  const seen = new Set();
  for (const s of relevant) {
    if (cards.length >= max) break;
    const url = (s.r.url || '').trim();
    if (seen.has(url)) continue;
    seen.add(url);
    cards.push(toCard(s));
  }
  return cards;
}

/**
 * Parse a content_search result into card objects. Prefers the clean
 * `structuredContent.results[]` array. Returns anchor-gated cards.
 */
function parseCards(mcpResult, cfg, max) {
  const structured = mcpResult && mcpResult.structuredContent;
  if (structured && Array.isArray(structured.results) && structured.results.length) {
    return rankStructured(structured.results, cfg, max);
  }
  return [];
}

/**
 * OFFLINE: pull the live MCP for one slug, anchor-gate, and return the staged
 * catalog entry `{ query, items }`. Used by scripts/refresh-trailhead.js. Throws
 * on MCP failure so the refresh script can keep the slug's prior committed items.
 */
export async function buildCatalogEntry(slug) {
  const cfg = CAPABILITY_QUERIES[slug];
  if (!cfg) throw new Error(`unknown capability: ${slug}`);
  const result = await contentSearch(cfg);
  const items = parseCards(result, cfg, cfg.max);
  return { query: cfg.query, items };
}
