import React, { useEffect, useState } from 'react';
import { Archive, RotateCcw, ArrowRight, Loader2 } from 'lucide-react';
import CapabilityLayout from '../CapabilityLayout';
import FutureStateTag from '../FutureStateTag';
import LiveBadge from '../LiveBadge';
import { getArticles } from '../../api/km';

const LIFECYCLE = [
  { label: 'Online', body: 'Published and current — passing its review cadence.' },
  { label: 'Flagged', body: 'Past NextReviewDate or marked Requires_Revision__c — a retirement candidate.' },
  { label: 'Archived', body: 'PublishStatus = Archived. Out of search and agent grounding, but retained.' },
  { label: 'Restored', body: 'Archived articles can return to Draft for revision — nothing is truly lost.' },
];

export default function C8_Archival() {
  const [staleCount, setStaleCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticles({ scope: 'overdue', limit: 200 })
      .then((data) => setStaleCount(data?.count ?? data?.articles?.length ?? 0))
      .catch(() => setStaleCount(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityLayout
      number={8}
      title="Archival"
      subtitle="Retiring an article should be as governed as publishing one. Archival is a permission-gated, reversible transition driven by the same review-date signal — so the knowledge base shrinks deliberately, not by accident, and stale content stops grounding agents."
      status="partial"
      statusNote="The archival process is roadmap; the stale-candidate count below is a live read of overdue articles."
      teaches={[
        'Archival is its own permission — separate from publish, held by few.',
        'PublishStatus = Archived removes an article from search and grounding without deleting it.',
        'Drive retirement from the same NextReviewDate signal that drives review.',
        'Restore keeps it reversible — archive confidently, recover when needed.',
      ]}
      features={['"Archive Articles" permission', 'PublishStatus = Archived', 'Restore to Draft', 'NextReviewDate-driven retirement', 'Retention policy']}
    >
      {/* Live stale-candidate count */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Archive size={16} className="text-siemens-accent" />
          <span className="text-sm font-semibold text-th-secondary">Retirement candidates right now</span>
          <LiveBadge note="Same overdue-review query — articles past NextReviewDate are archival candidates." />
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-th-muted">
            <Loader2 size={15} className="animate-spin" /> Counting overdue articles…
          </div>
        ) : staleCount == null ? (
          <p className="text-sm text-th-muted">
            Couldn't reach the org — start the BFF to see the live count. The process below stands on its own.
          </p>
        ) : (
          <p className="text-sm text-th-muted leading-relaxed">
            <span className="text-2xl font-bold text-th-primary">{staleCount}</span> published article
            {staleCount === 1 ? ' is' : 's are'} past their review date — the working set an archival policy would
            triage. Retire, refresh, or reaffirm each; the review signal (capability&nbsp;3) is what makes the queue
            actionable instead of guesswork.
          </p>
        )}
      </div>

      {/* Lifecycle */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-semibold text-th-secondary">The article lifecycle</span>
          <FutureStateTag label="Roadmap" note="The archival transitions and restore path are the recommended process." />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
          {LIFECYCLE.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex-1 rounded-lg border border-surface-border bg-surface-card-hover p-3">
                <div className="text-sm font-semibold text-siemens-accent mb-1">{s.label}</div>
                <div className="text-[11px] text-th-muted leading-relaxed">{s.body}</div>
              </div>
              {i < LIFECYCLE.length - 1 && (
                <div className="hidden sm:flex items-center text-th-faint">
                  <ArrowRight size={16} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-th-muted mt-4">
          <RotateCcw size={13} className="text-siemens-accent" />
          Restore makes every archival reversible — retention keeps the record even when it leaves search.
        </div>
      </div>
    </CapabilityLayout>
  );
}
