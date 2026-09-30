import React from 'react';
import { Radio } from 'lucide-react';

// Green "LIVE against org" counterpart to FutureStateTag. Marks the parts of
// this teaching site that make real, verifiable calls to the Salesforce org
// (as opposed to narrative/roadmap sections). Keeping the live-vs-roadmap
// distinction sharp is what makes the live proofs credible.
export default function LiveBadge({ label = 'Live against org', note, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300 ${className}`}
      title={note || 'This section makes a real call to the connected Salesforce org.'}
    >
      <Radio size={9} className="animate-pulse" />
      {label}
    </span>
  );
}
