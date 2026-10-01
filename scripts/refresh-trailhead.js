#!/usr/bin/env node
/**
 * Offline refresh for the staged Trailhead catalog.
 *
 *   npm run refresh:trailhead
 *
 * Re-pulls each capability's learning cards from the live Trailhead MCP, applies
 * the same anchor-gating the runtime trusts, and writes a PROPOSED
 * `trailhead-catalog.json`. It prints a per-slug diff vs. the committed catalog
 * and a review banner — it does NOT commit. A human eyeballs the diff and runs
 * `git add`/`git commit` if it looks right, or `git checkout trailhead-catalog.json`
 * to discard.
 *
 * This is the ONLY code path that calls the MCP. It needs network to
 * mcp.trailhead.salesforce.com, so run it in your own terminal (not sandboxed
 * tooling). The MCP needs no auth; `--env-file=.env` is just for parity with the
 * other scripts.
 *
 * Guard: if a slug returns 0 anchor-hit items on this pull (a bad MCP day), the
 * previous committed items for that slug are KEPT rather than blanked, and the
 * slug is flagged in the output.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CAPABILITY_QUERIES, buildCatalogEntry } from '../trailhead.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, '..', 'trailhead-catalog.json');

function loadCommitted() {
  try {
    return JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  } catch {
    return { capabilities: {} };
  }
}

function titlesOf(entry) {
  return new Set(((entry && entry.items) || []).map((it) => it.title));
}

// Readable per-slug diff: titles added / removed between committed and proposed.
function diffSlug(slug, before, after) {
  const b = titlesOf(before);
  const a = titlesOf(after);
  const added = [...a].filter((t) => !b.has(t));
  const removed = [...b].filter((t) => !a.has(t));
  return { added, removed, changed: added.length > 0 || removed.length > 0 };
}

async function main() {
  const committed = loadCommitted();
  const proposed = {
    generatedAt: new Date().toISOString(),
    source: 'Trailhead MCP content_search (staged, anchor-verified, human-reviewed)',
    note:
      'Each item is a real trailhead.salesforce.com Module/Project confirmed on-topic via content_search. ' +
      'A slug may legitimately carry 1-2 items (thin-but-honest). Review the diff before committing.',
    capabilities: {},
  };

  const kept = []; // slugs where the pull returned 0 and we kept prior items
  const failed = []; // slugs where the MCP call threw

  console.log('\nRefreshing staged Trailhead catalog from the live MCP…\n');

  for (const slug of Object.keys(CAPABILITY_QUERIES)) {
    const prior = (committed.capabilities && committed.capabilities[slug]) || null;
    try {
      const entry = await buildCatalogEntry(slug);
      if (!entry.items.length && prior && prior.items && prior.items.length) {
        // Bad MCP day for this slug — don't blank a good rail.
        proposed.capabilities[slug] = { query: entry.query, items: prior.items };
        kept.push(slug);
      } else {
        proposed.capabilities[slug] = entry;
      }
    } catch (err) {
      // MCP failed for this slug — keep whatever was committed.
      proposed.capabilities[slug] = prior || { query: CAPABILITY_QUERIES[slug].query, items: [] };
      failed.push(`${slug} (${err.message})`);
    }

    const d = diffSlug(slug, prior, proposed.capabilities[slug]);
    const n = proposed.capabilities[slug].items.length;
    const flag = kept.includes(slug) ? ' [kept prior — pull was empty]' : failed.some((f) => f.startsWith(slug)) ? ' [MCP error — kept prior]' : '';
    console.log(`  ${slug.padEnd(12)} ${n} card${n === 1 ? '' : 's'}${flag}`);
    for (const t of d.added) console.log(`      + ${t}`);
    for (const t of d.removed) console.log(`      - ${t}`);
  }

  writeFileSync(CATALOG_PATH, JSON.stringify(proposed, null, 2) + '\n', 'utf8');

  const anyChange = Object.keys(CAPABILITY_QUERIES).some((slug) => {
    const prior = (committed.capabilities && committed.capabilities[slug]) || null;
    return diffSlug(slug, prior, proposed.capabilities[slug]).changed;
  });

  console.log('\n' + '─'.repeat(72));
  console.log('Proposed catalog written to trailhead-catalog.json');
  if (!anyChange) {
    console.log('No card changes vs. the committed catalog (only generatedAt moved).');
  }
  if (kept.length) console.log(`Kept prior items (empty pull): ${kept.join(', ')}`);
  if (failed.length) console.log(`MCP errors (kept prior): ${failed.join('; ')}`);
  console.log('\nREVIEW the diff above, then:');
  console.log('   git add trailhead-catalog.json && git commit   # if correct');
  console.log('   git checkout trailhead-catalog.json            # to discard');
  console.log('─'.repeat(72) + '\n');
}

main().catch((err) => {
  console.error('\nrefresh-trailhead failed:', err.message, '\n');
  process.exit(1);
});
