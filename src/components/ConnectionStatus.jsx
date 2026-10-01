import React, { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, CircleDashed } from 'lucide-react';
import { getHealth } from '../api/km';

/**
 * ConnectionStatus — a compact header indicator for the BFF / Salesforce
 * connection. Shows a colored dot (green = live proofs ready, amber = BFF up but
 * Salesforce not fully configured, red = BFF unreachable, grey = checking). The
 * detail text is hidden by default and revealed in a popover on click, so the
 * Overview page stays clean for demos instead of carrying a full status banner.
 *
 * Replaces the old full-width connection card on OverviewView; lives in the
 * global header (Layout) so the signal is available on every page.
 */
export default function ConnectionStatus() {
  const [health, setHealth] = useState(null);
  const [healthErr, setHealthErr] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealthErr(true));
  }, []);

  // Close the popover on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Derive the visual state.
  let tone; // 'live' | 'partial' | 'down' | 'checking'
  if (healthErr) tone = 'down';
  else if (!health) tone = 'checking';
  else if (health.sfConfigured) tone = 'live';
  else tone = 'partial';

  const dotClass = {
    live: 'bg-emerald-500',
    partial: 'bg-amber-500',
    down: 'bg-rose-500',
    checking: 'bg-th-faint',
  }[tone];

  const label = {
    live: 'Connected',
    partial: 'Partial',
    down: 'Offline',
    checking: 'Checking',
  }[tone];

  const Icon = tone === 'down' ? WifiOff : tone === 'checking' ? CircleDashed : Wifi;
  const iconClass = {
    live: 'text-emerald-500',
    partial: 'text-amber-500',
    down: 'text-rose-500',
    checking: 'text-th-faint animate-spin',
  }[tone];

  // The detail copy shown in the popover (the text that used to sit on Overview).
  const detail = healthErr ? (
    <>
      BFF not reachable yet — run <span className="font-mono text-th-secondary">npm run dev:server</span> to
      enable the live proofs. The teaching content renders without it.
    </>
  ) : health ? (
    <>
      BFF is up.{' '}
      {health.sfConfigured
        ? 'Salesforce credentials configured — live proofs are ready.'
        : 'Salesforce credentials not set — live proofs will show setup guidance.'}
      {health.sfConfigured && (
        <>
          {' '}Agent {health.agentConfigured ? 'wired' : 'pending deploy'}; writes{' '}
          {health.writesEnabled ? 'enabled' : 'disabled (text-only drafts)'}.
        </>
      )}
    </>
  ) : (
    'Checking connection…'
  );

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-surface-border hover:bg-surface-card-hover transition-colors"
        title="Connection status"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={`relative flex h-2 w-2`}>
          {tone === 'live' && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
        </span>
        <span className="text-[11px] font-medium text-th-muted hidden md:inline">{label}</span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 mt-2 w-72 rounded-lg border border-surface-border bg-surface-card shadow-card-hover p-3 z-30"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Icon size={14} className={iconClass} />
            <span className="text-xs font-semibold text-th-secondary">Connection status</span>
          </div>
          <p className="text-xs text-th-muted leading-relaxed">{detail}</p>
        </div>
      )}
    </div>
  );
}
