import React, { useEffect, useState } from 'react';
import { GraduationCap, ExternalLink, CircleDashed } from 'lucide-react';
import { getTrailheadRecommendations } from '../api/km';

/**
 * TrailheadRail — a row of Salesforce Trailhead learning cards for a capability.
 * Content comes from a committed, human-reviewed catalog the BFF serves
 * (trailhead-catalog.json), curated from the public Trailhead MCP, so the
 * best-practice narrative on each capability page doubles as an actionable
 * enablement path. Cards are deterministic — no live MCP call on page view.
 *
 * Props:
 *   capability — the capability slug (matches the route segment, e.g. "review",
 *                "categories"), used to key the per-capability MCP query.
 *
 * States: loading (brief), populated (1-3 cards), or empty (a quiet note, never
 * an error) when no on-topic content is staged for the capability — consistent
 * with the site's "panels show guidance instead of erroring" principle.
 */
export default function TrailheadRail({ capability }) {
  const [state, setState] = useState({ loading: true, items: [], degraded: false });

  useEffect(() => {
    let active = true;
    setState({ loading: true, items: [], degraded: false });
    getTrailheadRecommendations(capability)
      .then((data) => {
        if (!active) return;
        setState({ loading: false, items: data.items || [], degraded: !!data.degraded });
      })
      .catch(() => {
        if (active) setState({ loading: false, items: [], degraded: true });
      });
    return () => {
      active = false;
    };
  }, [capability]);

  const { loading, items, degraded } = state;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap size={16} className="text-siemens-accent" />
        <span className="text-sm font-semibold text-th-secondary">Learn this on Trailhead</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-siemens-accent/70">
          Curated from Trailhead
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-th-muted">
          <CircleDashed size={13} className="animate-spin" />
          Finding relevant Trailhead content…
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <a
              key={it.url}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-surface-border bg-surface-card-hover p-3 hover:border-siemens-teal/40 transition-colors flex flex-col"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-th-faint">
                  {it.type}
                  {it.level ? ` · ${it.level}` : ''}
                </span>
                <ExternalLink size={12} className="text-th-faint group-hover:text-siemens-accent transition-colors" />
              </div>
              <div className="text-xs font-semibold text-th-primary leading-snug mb-1">{it.title}</div>
              <p className="text-[11px] text-th-muted leading-relaxed flex-1">{it.synopsis}</p>
            </a>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-xs text-th-muted leading-relaxed">
          {degraded
            ? 'No Trailhead match staged for this capability yet.'
            : 'No matching Trailhead content for this capability right now.'}
        </p>
      )}
    </div>
  );
}
