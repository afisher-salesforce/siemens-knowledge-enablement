import React from 'react';
import { GraduationCap, Boxes } from 'lucide-react';
import FutureStateTag from './FutureStateTag';
import LiveBadge from './LiveBadge';

// Section shell shared by every capability page. Gives each capability a
// consistent frame: an eyebrow number + title, a live/roadmap status chip, a
// "What this teaches" panel, a "Salesforce features referenced" list, and a
// slot for the live widget or illustrative content.
//
// Props:
//   number        — capability number (1–8), shown as an eyebrow
//   title         — capability title
//   subtitle      — one-line description under the title
//   status        — 'live' | 'roadmap' | 'partial'  (drives the header chip)
//   statusNote    — tooltip text for the status chip
//   teaches       — string or string[] for the "What this teaches" panel
//   features      — string[] of Salesforce features referenced
//   children      — the capability body (prose + widgets)
export default function CapabilityLayout({
  number,
  title,
  subtitle,
  status = 'roadmap',
  statusNote,
  teaches,
  features = [],
  children,
}) {
  const teachesList = Array.isArray(teaches) ? teaches : teaches ? [teaches] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {number != null && (
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-siemens-accent">
              Capability {number}
            </span>
          )}
          {status === 'live' && <LiveBadge note={statusNote} />}
          {status === 'partial' && <LiveBadge label="Partly live" note={statusNote} />}
          {status === 'roadmap' && <FutureStateTag label="Roadmap" note={statusNote} />}
        </div>
        <h1 className="text-2xl font-bold text-th-primary">{title}</h1>
        {subtitle && <p className="text-sm text-th-muted leading-relaxed max-w-3xl">{subtitle}</p>}
      </div>

      {/* Teaching frame */}
      <div className="grid gap-4 md:grid-cols-2">
        {teachesList.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={15} className="text-siemens-accent" />
              <span className="text-xs font-semibold text-th-secondary uppercase tracking-wider">
                What this teaches
              </span>
            </div>
            <ul className="space-y-1.5">
              {teachesList.map((t, i) => (
                <li key={i} className="text-xs text-th-muted leading-relaxed flex gap-2">
                  <span className="text-siemens-accent mt-0.5">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {features.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Boxes size={15} className="text-siemens-accent" />
              <span className="text-xs font-semibold text-th-secondary uppercase tracking-wider">
                Salesforce features referenced
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {features.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md border border-surface-border bg-surface-card-hover px-2 py-1 text-[11px] text-th-secondary"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
