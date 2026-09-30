import React, { useState } from 'react';
import { Sparkles, Wand2, Bot, Loader2, AlertCircle, Check, Info } from 'lucide-react';
import CapabilityLayout from '../CapabilityLayout';
import LiveBadge from '../LiveBadge';
import FutureStateTag from '../FutureStateTag';
import { draftArticle } from '../../api/km';

const PRODUCT_GROUPS = ['Teamcenter', 'NX', 'Simcenter', 'Calibre EDA'];

const COMPARE_ROWS = [
  ['Build effort', 'Zero — platform-managed', 'Custom invocable Apex + few-shot sets'],
  ['Grounding', 'Platform grounding, per-org', 'Your few-shot examples + record-type context'],
  ['Customization', 'Low — one behavior for the org', 'High — differs per product group'],
  ['Record types / security', 'Uniform', 'Per-group record types & security'],
  ['Best when', 'You want fast, governed, uniform drafting', 'Groups differ and differentiation matters'],
];

export default function C4_AIDrafting() {
  const [productGroup, setProductGroup] = useState(PRODUCT_GROUPS[0]);
  const [sourceProblem, setSourceProblem] = useState('');
  const [state, setState] = useState({ loading: false, error: null, result: null, meta: null });

  const runDraft = () => {
    if (!sourceProblem.trim()) return;
    setState({ loading: true, error: null, result: null, meta: null });
    draftArticle({ productGroup, sourceProblem, createDraft: false })
      .then((resp) =>
        setState({
          loading: false,
          error: null,
          result: resp.result,
          meta: { writesEnabled: resp.writesEnabled, persisted: resp.persisted },
        })
      )
      .catch((err) => setState({ loading: false, error: err.message, result: null, meta: null }));
  };

  const r = state.result || {};
  const draftTitle = r.draftTitle || r.title;
  const draftSummary = r.draftSummary || r.summary;
  const draftBody = r.draftBody || r.body;
  const recordType = r.recommendedRecordType || r.recordType;

  return (
    <CapabilityLayout
      number={4}
      title="AI-assisted drafting — Einstein vs. a custom agent"
      subtitle="Two ways to draft an article with AI, compared. Salesforce's built-in Einstein is fast and governed; a custom Agentforce agent lets you tune few-shot examples, record types, and security per product group — which matters when the four DISW groups write so differently."
      status="partial"
      statusNote="The custom-agent column calls the org live. The Einstein column is illustrative unless Einstein for Knowledge is enabled."
      teaches={[
        'AI drafting is not one thing — pick the approach that fits your control needs.',
        'Few-shot examples steer tone and structure per product group.',
        'A custom invocable can return text only (safe) or persist a Draft (gated).',
        'DISW\'s heterogeneous groups favor the custom path where differentiation matters.',
      ]}
      features={['Einstein for Knowledge', 'Agentforce', 'Invocable Apex (@InvocableMethod)', 'Actions REST API', 'Record Types', 'Few-shot prompting']}
    >
      {/* Two-column compare */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Einstein column */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 size={16} className="text-siemens-accent" />
            <span className="text-sm font-semibold text-th-secondary">Salesforce Einstein (built-in)</span>
            <FutureStateTag label="If enabled" note="Live only when Einstein for Knowledge is turned on in the org." />
          </div>
          <p className="text-xs text-th-muted leading-relaxed mb-3">
            Generate a summary or draft from a case or notes using the platform's managed model. Zero build,
            governed by Salesforce, uniform across the org. Verify enablement in Setup → Einstein → Knowledge
            before demoing this column live.
          </p>
          <ul className="space-y-1.5 text-xs text-th-muted">
            <li className="flex gap-2"><Check size={13} className="text-emerald-500 mt-0.5 shrink-0" /> No custom code or maintenance</li>
            <li className="flex gap-2"><Check size={13} className="text-emerald-500 mt-0.5 shrink-0" /> Platform-managed grounding & governance</li>
            <li className="flex gap-2"><Info size={13} className="text-amber-500 mt-0.5 shrink-0" /> One behavior for the whole org — low per-group tuning</li>
          </ul>
        </div>

        {/* Custom agent column — LIVE */}
        <div className="card p-5 border-l-2 border-l-siemens-teal/50">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={16} className="text-siemens-accent" />
            <span className="text-sm font-semibold text-th-secondary">Custom Agentforce agent</span>
            <LiveBadge note="Invokes DraftKnowledgeArticle via the Actions REST API." />
          </div>
          <p className="text-xs text-th-muted leading-relaxed mb-4">
            A custom invocable (<span className="font-mono">DraftKnowledgeArticle</span>) drafts with per-group
            few-shot examples and record-type context. Returns text only by default — persisting a Draft is
            double-gated behind <span className="font-mono">ALLOW_KM_WRITES</span>.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-th-muted uppercase tracking-wide">Product group</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PRODUCT_GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setProductGroup(g)}
                    className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                      productGroup === g
                        ? 'bg-siemens-teal/15 border-siemens-teal/40 text-siemens-accent font-medium'
                        : 'border-surface-border text-th-muted hover:bg-surface-card-hover'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-th-muted uppercase tracking-wide">Problem / source notes</label>
              <textarea
                value={sourceProblem}
                onChange={(e) => setSourceProblem(e.target.value)}
                rows={3}
                placeholder="e.g. Users hit a FlexLM -15 error when the license server hostname changes after a VM migration…"
                className="mt-1.5 w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-card text-sm text-th-secondary placeholder:text-th-faint focus:outline-none focus:border-siemens-teal/50 focus:ring-1 focus:ring-siemens-teal/30 resize-none"
              />
            </div>

            <button
              onClick={runDraft}
              disabled={state.loading || !sourceProblem.trim()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-siemens-teal border border-siemens-teal text-white hover:bg-siemens-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {state.loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Draft with the agent
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {state.error && (
        <div className="card p-4">
          <div className="flex items-start gap-2 text-sm text-amber-500">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-th-secondary">Drafting call didn't complete</div>
              <div className="text-xs text-th-muted mt-1">{state.error}</div>
              <div className="text-xs text-th-faint mt-2">
                This is live: it needs the BFF running and <span className="font-mono">DraftKnowledgeArticle</span> deployed
                to the org. Until then the comparison above is the teaching content.
              </div>
            </div>
          </div>
        </div>
      )}

      {(draftTitle || draftBody || draftSummary) && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-th-secondary">Generated draft</span>
            <LiveBadge label={state.meta?.persisted ? 'Draft persisted' : 'Text only'} note={state.meta?.persisted ? 'A Draft Knowledge__kav was created (writes enabled).' : 'No record written — text-only mode.'} />
            {recordType && (
              <span className="badge badge-teal text-[10px]">{recordType}</span>
            )}
          </div>
          {draftTitle && <div className="text-base font-semibold text-th-primary">{draftTitle}</div>}
          {draftSummary && <p className="text-sm text-th-muted leading-relaxed italic">{draftSummary}</p>}
          {draftBody && (
            <div className="text-sm text-th-secondary leading-relaxed whitespace-pre-wrap border-t border-surface-border pt-3">
              {draftBody}
            </div>
          )}
          {!draftTitle && !draftBody && !draftSummary && (
            <pre className="text-xs text-th-muted overflow-x-auto">{JSON.stringify(state.result, null, 2)}</pre>
          )}
        </div>
      )}

      {/* When to use each */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-border text-sm font-semibold text-th-secondary">
          When to use each
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 py-2.5 text-[11px] font-semibold text-th-muted uppercase tracking-wide"></th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-th-muted uppercase tracking-wide">Einstein (built-in)</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-th-muted uppercase tracking-wide">Custom Agentforce agent</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(([dim, einstein, custom]) => (
                <tr key={dim} className="border-b border-surface-border last:border-b-0">
                  <td className="px-4 py-2.5 text-xs font-medium text-th-secondary">{dim}</td>
                  <td className="px-4 py-2.5 text-xs text-th-muted">{einstein}</td>
                  <td className="px-4 py-2.5 text-xs text-th-muted">{custom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CapabilityLayout>
  );
}
