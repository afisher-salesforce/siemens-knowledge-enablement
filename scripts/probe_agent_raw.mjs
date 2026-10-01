// Probe the KM agent through the running BFF and print the RAW reply text,
// so we can see exactly what the agent emits (is the [title](/article/Id)
// citation present or not?) without the React renderer in the way.
//
//   node scripts/probe_agent_raw.mjs "Find articles about license activation."
//
// Requires the BFF running on :3001 (npm run dev:server).

const BASE = process.env.BFF_BASE || 'http://localhost:3001';
const prompt = process.argv[2] || 'Find articles about license activation.';

async function main() {
  const cfg = await (await fetch(`${BASE}/api/agent/config`)).json();
  console.log('[config]', JSON.stringify(cfg));

  const sRes = await fetch(`${BASE}/api/agent/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!sRes.ok) throw new Error(`session create ${sRes.status}: ${await sRes.text()}`);
  const sData = await sRes.json();
  const sid = sData.sessionId || sData.id;
  console.log('[session]', sid);

  const mRes = await fetch(`${BASE}/api/agent/sessions/${sid}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt }),
  });
  console.log('[message status]', mRes.status, 'content-type:', mRes.headers.get('content-type'));

  const ct = mRes.headers.get('content-type') || '';
  let full = '';
  let jsonData = null;
  let sseCitation = null;
  if (ct.includes('text/event-stream')) {
    const text = await mRes.text();
    console.log('\n===== RAW SSE =====\n' + text + '\n===== END =====\n');
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const ev = JSON.parse(line.slice(6));
          if (ev.type === 'Citation') sseCitation = ev.citation;
          full += ev.text || ev.message || '';
        } catch {}
      }
    }
  } else {
    jsonData = await mRes.json();
    console.log('\n===== RAW JSON =====\n' + JSON.stringify(jsonData, null, 2) + '\n===== END =====\n');
    full =
      jsonData.messages?.[0]?.text ||
      jsonData.messages?.[0]?.message ||
      jsonData.text ||
      jsonData.message ||
      '';
  }

  console.log('\n===== ASSEMBLED AGENT TEXT =====\n' + full + '\n===== END =====\n');
  const md = /\[([^\]]+)\]\((\/article\/[A-Za-z0-9]+|https?:\/\/[^\s)]+)\)/.exec(full);
  console.log('[markdown-link present?]', md ? `YES → ${md[0]}` : 'NO');
  // The deterministic pill signal: citation attached by the BFF (JSON path).
  const citation = jsonData?.citation || sseCitation;
  console.log('[BFF citation attached?]', citation ? `YES → ${JSON.stringify(citation)}` : 'NO');
}

main().catch((e) => { console.error('PROBE ERROR:', e); process.exit(1); });
