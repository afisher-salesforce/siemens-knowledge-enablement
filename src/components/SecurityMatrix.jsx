import React from 'react';
import { Check, X, Minus } from 'lucide-react';

// Role × permission grid making the least-privilege Knowledge security model
// concrete — showing how API access never implies publication rights. Purely
// illustrative of a recommended model; it does NOT read live permission
// assignments.
//
// Columns are the Knowledge permissions that matter; rows are personas. The
// point the grid makes visually: creation is separated from publication, and
// the Integration (API) user is the MOST constrained row — it can draft but
// never publish, and everything routes through approval.

const PERMISSIONS = [
  { key: 'createDraft', label: 'Create Draft' },
  { key: 'edit', label: 'Edit Draft' },
  { key: 'publish', label: 'Publish' },
  { key: 'archive', label: 'Archive' },
  { key: 'manage', label: 'Manage Knowledge' },
  { key: 'approve', label: 'Approve' },
];

// 'yes' = granted · 'no' = withheld · 'gated' = only via approval process
const ROLES = [
  {
    role: 'Business Author',
    tagline: 'Distributed authoring',
    perms: { createDraft: 'yes', edit: 'yes', publish: 'no', archive: 'no', manage: 'no', approve: 'no' },
  },
  {
    role: 'Knowledge Manager',
    tagline: 'Small, trusted team',
    perms: { createDraft: 'yes', edit: 'yes', publish: 'gated', archive: 'yes', manage: 'no', approve: 'yes' },
  },
  {
    role: 'Integration User (API)',
    tagline: 'Least privilege',
    highlight: true,
    perms: { createDraft: 'yes', edit: 'yes', publish: 'no', archive: 'no', manage: 'no', approve: 'no' },
  },
  {
    role: 'Knowledge Admin',
    tagline: 'Very few, audited',
    perms: { createDraft: 'yes', edit: 'yes', publish: 'gated', archive: 'yes', manage: 'yes', approve: 'yes' },
  },
];

function Cell({ value }) {
  if (value === 'yes') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/25">
        <Check size={13} className="text-emerald-500 dark:text-emerald-400" />
      </span>
    );
  }
  if (value === 'gated') {
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/15 border border-amber-500/25"
        title="Only through the Knowledge approval process"
      >
        <Minus size={13} className="text-amber-500 dark:text-amber-400" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-red-500/10 border border-red-500/20">
      <X size={13} className="text-red-500/70 dark:text-red-400/70" />
    </span>
  );
}

export default function SecurityMatrix() {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="px-4 py-3 text-xs font-semibold text-th-secondary uppercase tracking-wider">
                Persona / Permission set
              </th>
              {PERMISSIONS.map((p) => (
                <th
                  key={p.key}
                  className="px-3 py-3 text-center text-[11px] font-semibold text-th-muted uppercase tracking-wide"
                >
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((r) => (
              <tr
                key={r.role}
                className={`border-b border-surface-border last:border-b-0 ${
                  r.highlight ? 'bg-siemens-teal/5' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-th-secondary flex items-center gap-2">
                    {r.role}
                    {r.highlight && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-siemens-accent bg-siemens-teal/10 border border-siemens-teal/25 rounded-full px-1.5 py-0.5">
                        Least privilege
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-th-faint mt-0.5">{r.tagline}</div>
                </td>
                {PERMISSIONS.map((p) => (
                  <td key={p.key} className="px-3 py-3 text-center">
                    <div className="flex justify-center">
                      <Cell value={r.perms[p.key]} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-surface-border text-[11px] text-th-muted">
        <span className="inline-flex items-center gap-1.5">
          <Check size={12} className="text-emerald-500 dark:text-emerald-400" /> Granted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus size={12} className="text-amber-500 dark:text-amber-400" /> Only via approval process
        </span>
        <span className="inline-flex items-center gap-1.5">
          <X size={12} className="text-red-500/70 dark:text-red-400/70" /> Withheld
        </span>
        <span className="ml-auto text-th-faint italic">Illustrative recommended model — not a live permission read.</span>
      </div>
    </div>
  );
}
