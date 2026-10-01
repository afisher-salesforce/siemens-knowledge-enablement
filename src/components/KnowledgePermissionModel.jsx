import React from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, PenLine, Pencil, ShieldCheck, Archive,
  FlaskConical, Lock, ArrowRight, Ban, GitBranch,
} from 'lucide-react';

// Knowledge-permission infographic: a visual synthesis of the permission model
// already asserted across C1 (author tiers), C2 (publication control), and
// SecurityMatrix (role × permission grid). It introduces NO new permission
// claims — it only makes the existing recommended model easy to see:
//   • a read → create → edit → publish (gated) → archive lifecycle rail that
//     walls off where API/CLI users stop (they draft/edit but never publish), and
//   • a sub-production (elevated) vs. production (governed) split.
// Illustrative recommended model — not a live permission read.

// Lifecycle stages, left → right. `holders` names who exercises the stage;
// `apiReaches` marks the stages an Integration (API/CLI) user can reach — the
// wall falls after Edit Draft, matching the SecurityMatrix Integration row.
const LIFECYCLE = [
  { key: 'read',    icon: Eye,        label: 'Read',         holders: 'Everyone with access — view published articles & drafts', apiReaches: true },
  { key: 'create',  icon: PenLine,    label: 'Create Draft', holders: 'Business authors, on their group record types',           apiReaches: true },
  { key: 'edit',    icon: Pencil,     label: 'Edit Draft',   holders: 'Authors & managers refine before review',                 apiReaches: true },
  { key: 'publish', icon: ShieldCheck, label: 'Publish',     holders: 'A small, audited group — only via approval',              apiReaches: false, gated: true },
  { key: 'archive', icon: Archive,    label: 'Archive',      holders: 'Knowledge managers / admins — restricted',                apiReaches: false },
];

// The sub-production vs. production split (C1: elevated authoring in sandbox;
// promotion to prod through a release process).
const ENVIRONMENTS = [
  {
    key: 'sandbox',
    icon: FlaskConical,
    tone: 'amber',
    pill: 'Elevated latitude',
    title: 'Sub-production (sandbox)',
    lines: [
      'Bulk load & direct publish for seeding content',
      'Broader author grants to move fast',
      'Mistakes are cheap and reversible here',
    ],
  },
  {
    key: 'prod',
    icon: Lock,
    tone: 'teal',
    pill: 'Governed',
    title: 'Production',
    lines: [
      'Publish gated by the approval process — for everyone',
      'API / CLI constrained to draft-only (never publish)',
      'Archive restricted to a few, audited roles',
      'Elevation only via a release process — never granted directly',
    ],
  },
];

function LifecycleRail() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
      {LIFECYCLE.map((s, i) => {
        const Icon = s.icon;
        return (
          <React.Fragment key={s.key}>
            <div
              className={`flex-1 rounded-lg border p-3 ${
                s.apiReaches
                  ? 'border-surface-border bg-surface-card-hover'
                  : 'border-amber-500/25 bg-amber-500/5'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={15} className="text-siemens-accent shrink-0" />
                <span className="text-sm font-semibold text-th-secondary">{s.label}</span>
              </div>
              {s.gated && (
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-full px-1.5 py-0.5 mb-1">
                  <ShieldCheck size={9} /> Gated by approval
                </span>
              )}
              <div className="text-[11px] text-th-muted leading-relaxed">{s.holders}</div>
              {!s.apiReaches && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-300 mt-1.5">
                  <Ban size={10} /> API / CLI stops here
                </div>
              )}
            </div>
            {i < LIFECYCLE.length - 1 && (
              <div className="hidden sm:flex items-center text-th-faint">
                <ArrowRight size={16} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function EnvironmentSplit() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ENVIRONMENTS.map((env) => {
        const Icon = env.icon;
        const toneClasses =
          env.tone === 'amber'
            ? 'text-amber-600 dark:text-amber-300 bg-amber-500/10 border-amber-500/25'
            : 'text-siemens-accent bg-siemens-teal/10 border-siemens-teal/25';
        return (
          <div key={env.key} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-siemens-accent" />
                <span className="text-sm font-semibold text-th-secondary">{env.title}</span>
              </div>
              <span className={`text-[9px] font-semibold uppercase tracking-wider rounded-full border px-1.5 py-0.5 ${toneClasses}`}>
                {env.pill}
              </span>
            </div>
            <ul className="space-y-1.5">
              {env.lines.map((line) => (
                <li key={line} className="flex items-start gap-2 text-[11px] text-th-muted leading-relaxed">
                  <span className="mt-1 w-1 h-1 rounded-full bg-siemens-accent shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function KnowledgePermissionModel({ compact = false }) {
  if (compact) {
    return (
      <Link
        to="/capabilities/publish"
        className="block card p-4 border-l-2 border-l-siemens-teal/50 hover:shadow-card-hover transition-shadow group"
      >
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={15} className="text-siemens-accent shrink-0" />
          <span className="text-sm font-semibold text-th-secondary">The permission model, at a glance</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-th-muted mb-2">
          {LIFECYCLE.map((s, i) => (
            <React.Fragment key={s.key}>
              <span className={s.gated ? 'text-amber-600 dark:text-amber-300' : 'text-th-secondary'}>
                {s.label}{s.gated ? ' (gated)' : ''}
              </span>
              {i < LIFECYCLE.length - 1 && <ArrowRight size={11} className="text-th-faint" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[11px] text-th-muted leading-relaxed">
          API / CLI users draft and edit, but never publish. Elevated authoring lives in sandbox;
          production stays gated, with promotion through a release process.
        </p>
        <div className="flex items-center gap-1 text-[11px] text-siemens-accent font-medium mt-2 group-hover:gap-2 transition-all">
          See the full model on Control Publication <ArrowRight size={12} />
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-th-secondary">The permission model, end to end</div>
        <p className="text-xs text-th-muted leading-relaxed">
          One picture of how a Knowledge article moves through its lifecycle, who holds each
          privilege, and how the latitude you grant in sandbox narrows to a governed model in production.
        </p>
      </div>

      {/* Section A — lifecycle rail */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-siemens-accent" />
          <span className="text-xs font-semibold text-th-secondary uppercase tracking-wider">Read → Publish → Archive lifecycle</span>
        </div>
        <LifecycleRail />
      </div>

      {/* Section B — sandbox vs. prod */}
      <EnvironmentSplit />

      <p className="text-[11px] text-th-faint italic">
        Illustrative recommended model — not a live permission read.
      </p>
    </div>
  );
}
