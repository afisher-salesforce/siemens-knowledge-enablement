import React from 'react';
import { ArrowRight, ShieldCheck, GitPullRequestArrow } from 'lucide-react';
import CapabilityLayout from '../CapabilityLayout';
import SecurityMatrix from '../SecurityMatrix';
import KnowledgePermissionModel from '../KnowledgePermissionModel';

const APPROVAL_STEPS = [
  { label: 'Draft', body: 'Business author creates a draft on their group\'s record type.' },
  { label: 'Submit', body: 'Author submits for approval — cannot publish directly.' },
  { label: 'Review', body: 'A Knowledge Manager reviews against entry criteria (record type, category, completeness).' },
  { label: 'Publish', body: 'Only on approval does the article transition to Online. Bulk API publish is blocked at entry criteria.' },
];

export default function C2_ControlPublication() {
  return (
    <CapabilityLayout
      number={2}
      title="Control publication with security + approval"
      subtitle="Publication is a privilege held by a small, audited group and routed through an approval process — so no single actor, and no API integration, can push content live at scale without review."
      status="roadmap"
      statusNote="Recommended security + approval model; illustrative, not a live permission read."
      teaches={[
        'Publication is a distinct permission — grant it to very few.',
        'An approval process gates the Draft → Online transition for everyone.',
        'Entry criteria block bulk API publishes regardless of the caller\'s permissions.',
        'Least-privilege integration users mean API access never implies publish rights.',
      ]}
      features={['"Publish Articles" permission', 'Knowledge Approval Processes', 'Entry criteria', 'Permission Sets', 'Integration user least-privilege']}
    >
      {/* The failure mode */}
      <div className="card p-5 border-l-2 border-l-siemens-teal/50">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="text-siemens-accent mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-th-secondary mb-1">The failure mode we design out</div>
            <p className="text-sm text-th-muted leading-relaxed">
              When any identity that can create can also publish — and nothing gates the publish transition — a
              single actor or API integration can push content live at scale with no review. Two controls remove
              that risk: (1) publication is a distinct permission, separate from create/edit, and (2) an approval
              process gates the Draft&nbsp;→&nbsp;Online transition for everyone. With both in place, the same API
              call either lands in Draft awaiting approval, or is rejected outright.
            </p>
          </div>
        </div>
      </div>

      {/* Two controls */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-siemens-accent" />
            <span className="text-sm font-semibold text-th-secondary">Control 1 — Separate the permission</span>
          </div>
          <p className="text-xs text-th-muted leading-relaxed">
            "Publish Articles" is its own permission, granted only to a Knowledge Manager permission set. The
            integration user's permission set explicitly excludes it. API access no longer implies publish rights.
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitPullRequestArrow size={16} className="text-siemens-accent" />
            <span className="text-sm font-semibold text-th-secondary">Control 2 — Gate with approval</span>
          </div>
          <p className="text-xs text-th-muted leading-relaxed">
            A Knowledge approval process sits on the Draft → Online transition. Even publish-holders route through it,
            and entry criteria reject bulk/programmatic publishes before they ever go live.
          </p>
        </div>
      </div>

      {/* Approval flow */}
      <div className="card p-5">
        <div className="text-sm font-semibold text-th-secondary mb-4">The approval flow</div>
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
          {APPROVAL_STEPS.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex-1 rounded-lg border border-surface-border bg-surface-card-hover p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-siemens-accent mb-1">
                  Step {i + 1}
                </div>
                <div className="text-sm font-semibold text-th-secondary mb-1">{s.label}</div>
                <div className="text-[11px] text-th-muted leading-relaxed">{s.body}</div>
              </div>
              {i < APPROVAL_STEPS.length - 1 && (
                <div className="hidden sm:flex items-center text-th-faint">
                  <ArrowRight size={16} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Permission model — lifecycle rail + sandbox/prod split */}
      <KnowledgePermissionModel />

      {/* Security matrix */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-th-secondary">Who can do what</div>
        <p className="text-xs text-th-muted leading-relaxed">
          The recommended role × permission model. Note the Integration (API) user is the most constrained row —
          it can draft but never publish, which is precisely the control that keeps API-driven content in check.
        </p>
        <SecurityMatrix />
      </div>
    </CapabilityLayout>
  );
}
