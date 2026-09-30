import React, { useEffect, useState, useContext } from 'react';
import { CalendarClock, RefreshCw, Loader2, AlertCircle, Sparkles, ListChecks } from 'lucide-react';
import CapabilityLayout from '../CapabilityLayout';
import LiveBadge from '../LiveBadge';
import SalesforceLink from '../SalesforceLink';
import { AgentChatContext } from '../Layout';
import { getArticles } from '../../api/km';

function daysAgo(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.round(diff / 86400000);
}

export default function C3_ReviewProcess() {
  const openAgent = useContext(AgentChatContext);
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = () => {
    setState({ loading: true, error: null, data: null });
    getArticles({ scope: 'overdue', limit: 25 })
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((err) => setState({ loading: false, error: err.message, data: null }));
  };

  useEffect(load, []);

  const articles = state.data?.articles || [];

  return (
    <CapabilityLayout
      number={3}
      title="Control review processes via article metadata"
      subtitle="Knowledge decays. A review-date field on every article turns “is this still true?” into a queryable, reportable, automatable signal — driving list views, dashboards, and agentic recommendations."
      status="live"
      statusNote="Reads the standard NextReviewDate field from the connected org in real time."
      teaches={[
        'Store a review cadence as metadata (a review-date field) on the article.',
        'Overdue articles become a simple SOQL filter — no manual tracking.',
        'Feed the same signal to list views, reports, and an agent that recommends what to review.',
        'This uses the standard NextReviewDate field — no custom field required.',
      ]}
      features={['Standard NextReviewDate field', 'List Views', 'Knowledge reports', 'Agentforce recommendations', 'Requires_Revision__c']}
    >
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-siemens-accent" />
            <span className="text-sm font-semibold text-th-secondary">Articles overdue for review</span>
            <LiveBadge note="SELECT ... FROM Knowledge__kav WHERE PublishStatus='Online' AND NextReviewDate < TODAY" />
          </div>
          <button
            onClick={load}
            disabled={state.loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-th-muted hover:text-siemens-accent hover:bg-surface-card-hover transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={state.loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {state.loading ? (
          <div className="flex items-center justify-center py-12 text-th-muted">
            <Loader2 size={18} className="animate-spin mr-2" />
            <span className="text-sm">Querying the org…</span>
          </div>
        ) : state.error ? (
          <div className="p-5">
            <div className="flex items-start gap-2 text-sm text-amber-500">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-th-secondary">Couldn't reach the org</div>
                <div className="text-xs text-th-muted mt-1">{state.error}</div>
                <div className="text-xs text-th-faint mt-2">
                  Start the BFF with <span className="font-mono">npm run dev:server</span> and confirm Salesforce
                  credentials are set. The teaching content above renders without a live connection.
                </div>
              </div>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-sm text-th-muted">
            No published articles are past their <span className="font-mono">NextReviewDate</span> right now — the
            review cadence is current. (Or no articles carry a review date yet.)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-th-muted uppercase tracking-wide">Title</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-th-muted uppercase tracking-wide">Record Type</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-th-muted uppercase tracking-wide">Review Due</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-th-muted uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => {
                  const overdueDays = daysAgo(a.nextReviewDate);
                  return (
                    <tr key={a.id} className="border-b border-surface-border last:border-b-0 hover:bg-surface-card-hover transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="text-sm text-th-secondary">{a.title}</div>
                        {a.requiresRevision && (
                          <span className="badge badge-orange text-[9px] mt-1">Flagged for revision</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-th-muted">{a.recordType || '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="text-xs text-th-secondary">
                          {a.nextReviewDate ? new Date(a.nextReviewDate).toLocaleDateString() : '—'}
                        </div>
                        {overdueDays != null && overdueDays > 0 && (
                          <div className="text-[10px] text-red-500 dark:text-red-400 font-medium">
                            {overdueDays} days overdue
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <SalesforceLink recordId={a.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!state.loading && !state.error && (
          <div className="px-4 py-2.5 border-t border-surface-border text-[11px] text-th-faint">
            {state.data?.count ?? articles.length} article(s) returned · live from the connected org
          </div>
        )}
      </div>

      {/* Agentic recommendation tie-in */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks size={16} className="text-siemens-accent" />
          <span className="text-sm font-semibold text-th-secondary">From list to action</span>
        </div>
        <p className="text-sm text-th-muted leading-relaxed mb-3">
          The same overdue signal powers a Knowledge Manager's list view, a weekly dashboard, and an agent that can
          summarize what changed and suggest edits. Ask the KM agent to help triage a review.
        </p>
        <button
          onClick={() => openAgent?.('Which of our published knowledge articles are likely stale, and what should I review first?')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-siemens-teal/10 border border-siemens-teal/25 text-siemens-accent hover:bg-siemens-teal/20 transition-colors text-xs font-medium"
        >
          <Sparkles size={13} />
          Ask the agent to triage reviews
        </button>
      </div>
    </CapabilityLayout>
  );
}
