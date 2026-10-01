// Fetch the DISW article index straight from the BFF-equivalent SOQL path by
// asking the BFF's own /api/km/articles endpoint, so we see the exact Titles
// matchCitationFromReply compares against. BFF must be up on :3001.
const BASE = 'http://localhost:3001';
const r = await fetch(`${BASE}/api/km/articles`);
if (!r.ok) { console.error('articles fetch failed', r.status); process.exit(1); }
const data = await r.json();
const rows = Array.isArray(data) ? data : (data.articles || data.records || []);
console.log('count:', rows.length);
for (const a of rows) {
  const t = a.title || a.Title;
  const id = a.id || a.Id;
  if (/license|error|-15|borrow|activat/i.test(t || '')) console.log(id, '::', t);
}
