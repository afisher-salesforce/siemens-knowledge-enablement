import React from 'react';
import { Link } from 'react-router-dom';
import {
  Share2, ShieldCheck, CalendarClock, Sparkles, FolderTree, Database,
  BarChart3, Archive, ArrowRight, CheckCircle2, CircleDashed,
  PenLine, Layers, Workflow, RefreshCw,
} from 'lucide-react';
import { KCS_PHASES, KCS_PHASE_ORDER, CAPABILITY_PHASE } from '../content/kcsPhases';
import TrailheadRail from './TrailheadRail';
import KnowledgePermissionModel from './KnowledgePermissionModel';

const CAPABILITIES = [
  { n: 1, to: '/capabilities/distribute', icon: Share2, title: 'Distribute knowledge creation', blurb: 'Let business users draft, while publication stays controlled — tighter for API users, elevated in sandbox with a release process.', status: 'roadmap' },
  { n: 2, to: '/capabilities/publish', icon: ShieldCheck, title: 'Control publication', blurb: 'Security model + approval processes — publication is a distinct privilege, and no single actor or API integration can push content live without review.', status: 'roadmap' },
  { n: 3, to: '/capabilities/review', icon: CalendarClock, title: 'Control review processes', blurb: 'Drive review cadence from article metadata — a standard review-date field, list views, and agentic recommendations.', status: 'live' },
  { n: 4, to: '/capabilities/ai-drafting', icon: Sparkles, title: 'AI-assisted drafting', blurb: 'Few-shot drafting with Einstein vs. a custom Agentforce agent — record types and security differ across product groups.', status: 'live' },
  { n: 5, to: '/capabilities/categories', icon: FolderTree, title: 'Data Categories & Topics', blurb: 'Category groups and Topics for security, search, and categorization across the DISW product groups.', status: 'live' },
  { n: 6, to: '/capabilities/data360', icon: Database, title: 'Index in Data 360', blurb: 'Index articles in Data Cloud / Data 360 for Agentforce grounding and unified reporting.', status: 'roadmap' },
  { n: 7, to: '/capabilities/analytics', icon: BarChart3, title: 'Analytics', blurb: 'Article usage, deflection, and unmatched search terms — the feedback loop that tells you what to write next.', status: 'roadmap' },
  { n: 8, to: '/capabilities/archival', icon: Archive, title: 'Archival', blurb: 'Retire stale articles with a retrieval/restore path, driven by the same review-date signal.', status: 'roadmap' },
];

// Icon per KCS phase (loop order), for the "How this maps to KCS" card.
const PHASE_ICON = { capture: PenLine, structure: Layers, reuse: Workflow, improve: RefreshCw };

// Capability numbers serving each phase, derived from the shared mapping so the
// card and the per-page eyebrows can never drift apart. e.g. capture → [1, 4].
const PHASE_CAPS = KCS_PHASE_ORDER.reduce((acc, key) => {
  acc[key] = CAPABILITIES.filter((c) => CAPABILITY_PHASE[c.to.split('/').pop()] === key).map((c) => c.n);
  return acc;
}, {});

function StatusPill({ status }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
        <CheckCircle2 size={11} /> Live proof
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-300">
      <CircleDashed size={11} /> Roadmap
    </span>
  );
}

export default function OverviewView() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-siemens-accent">
          Siemens Digital Industries Software
        </span>
        <h1 className="text-3xl font-bold text-th-primary leading-tight">
          Knowledge Management, done the Salesforce way
        </h1>
        <p className="text-sm text-th-muted leading-relaxed max-w-3xl">
          A working teaching artifact for the DISW knowledge team: eight capabilities arranged as a
          knowledge loop — <strong className="text-th-secondary">capture, structure, reuse, improve</strong> —
          adapted for a governed authoring model across product groups (Teamcenter, NX, Simcenter,
          Calibre&nbsp;EDA). Three of the eight are proven <strong className="text-th-secondary">live</strong> against
          the connected Salesforce org — plus the always-on grounded KM agent; the rest are laid out as a roadmap and clearly labeled as such.
        </p>
      </div>

      {/* The pain we're solving */}
      <div className="card p-5 border-l-2 border-l-siemens-teal/50">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="text-siemens-accent mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-th-secondary mb-1">The pain we're solving</div>
            <p className="text-sm text-th-muted leading-relaxed">
              Knowledge is only an asset when the business can trust it. The goal is a
              robust knowledge management and creation framework — one that lets every product group
              contribute, but keeps quality and control in the platform rather than in tribal process.
            </p>
            <p className="text-sm text-th-muted leading-relaxed mt-2">
              We deliver that with three things Salesforce already does well:{' '}
              <strong className="text-th-secondary">the full security model</strong> governing who can create,
              edit, publish, and archive;{' '}
              <strong className="text-th-secondary">AI-assisted knowledge generation</strong> that drafts from
              real source material and existing articles; and{' '}
              <strong className="text-th-secondary">publication approvals</strong> so nothing reaches customers
              until the right people have signed off — without slowing down the business users who <em>should</em> be
              drafting. The same trusted, reviewed base then grounds both your people and your agents.
            </p>
          </div>
        </div>
      </div>

      {/* Compact pointer to the full permission model on C2 */}
      <KnowledgePermissionModel compact />

      {/* How this maps to KCS */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Workflow size={18} className="text-siemens-accent" />
          <span className="text-sm font-semibold text-th-secondary">How this maps to KCS</span>
        </div>
        <p className="text-sm text-th-muted leading-relaxed mb-4 max-w-3xl">
          We follow the Knowledge-Centered Service loop, adapted: a focused set of authors capture and
          AI-assist drafts, publication stays reviewed and gated, and the result grounds both human
          agents and Agentforce — not open frontline publishing, but the same capture → structure →
          reuse → improve rhythm.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KCS_PHASE_ORDER.map((key, i) => {
            const { label, tagline } = KCS_PHASES[key];
            const Icon = PHASE_ICON[key];
            const caps = PHASE_CAPS[key] || [];
            return (
              <div key={key} className="rounded-lg border border-surface-border bg-surface-card-hover p-3 flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-th-faint">{i + 1}</span>
                  <Icon size={15} className="text-siemens-accent" />
                  <span className="text-xs font-semibold text-th-primary">{label}</span>
                </div>
                <p className="text-[11px] text-th-muted leading-relaxed flex-1">{tagline}</p>
                {caps.length > 0 && (
                  <div className="text-[10px] text-th-faint mt-2">
                    Capabilit{caps.length > 1 ? 'ies' : 'y'} {caps.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* KCS learning rail — surfaces the staged `kcs` Trailhead catalog key */}
      <TrailheadRail capability="kcs" />

      {/* Capability grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CAPABILITIES.map(({ n, to, icon: Icon, title, blurb, status }) => (
          <Link
            key={n}
            to={to}
            className="card p-5 hover:shadow-card-hover transition-shadow group flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-siemens-teal/10 border border-siemens-teal/20 flex items-center justify-center">
                  <Icon size={17} className="text-siemens-accent" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-th-faint">
                  Capability {n}
                </span>
              </div>
              <StatusPill status={status} />
            </div>
            <div className="text-sm font-semibold text-th-primary mb-1.5">{title}</div>
            <p className="text-xs text-th-muted leading-relaxed flex-1">{blurb}</p>
            <div className="flex items-center gap-1 text-[11px] text-siemens-accent font-medium mt-3 group-hover:gap-2 transition-all">
              Explore <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
