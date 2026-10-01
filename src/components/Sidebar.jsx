import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Share2,
  ShieldCheck,
  CalendarClock,
  Sparkles,
  FolderTree,
  Database,
  BarChart3,
  Archive,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Navigation: Overview + the 8 KM capabilities, in narrative order. Each item
// carries a small live/roadmap marker so the sidebar itself communicates which
// capabilities are proven against the org.
export const NAV_ITEMS = [
  { to: '/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/capabilities/distribute', label: '1 · Distribute Creation', icon: Share2, tag: 'roadmap' },
  { to: '/capabilities/publish', label: '2 · Control Publication', icon: ShieldCheck, tag: 'roadmap' },
  { to: '/capabilities/review', label: '3 · Review Process', icon: CalendarClock, tag: 'live' },
  { to: '/capabilities/ai-drafting', label: '4 · AI Drafting', icon: Sparkles, tag: 'live' },
  { to: '/capabilities/categories', label: '5 · Data Categories', icon: FolderTree, tag: 'live' },
  { to: '/capabilities/data360', label: '6 · Index in Data 360', icon: Database, tag: 'roadmap' },
  { to: '/capabilities/analytics', label: '7 · Analytics', icon: BarChart3, tag: 'roadmap' },
  { to: '/capabilities/archival', label: '8 · Archival', icon: Archive, tag: 'roadmap' },
];

export default function Sidebar({ collapsed = false, onToggle }) {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[var(--table-header-bg)] border-r border-surface-border flex flex-col z-30 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Brand */}
      <div className={`h-14 flex items-center gap-2.5 border-b border-surface-border shrink-0 ${collapsed ? 'px-0 justify-center' : 'px-4'}`}>
        <div className="w-8 h-8 rounded-lg bg-siemens-teal flex items-center justify-center shrink-0" title="Siemens DISW · Knowledge Management">
          <BookOpen size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-xs font-bold text-th-primary leading-tight truncate">Siemens DISW</div>
            <div className="text-[10px] text-th-muted leading-tight truncate">Knowledge Management</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, tag }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-2.5 py-2 rounded-md text-[13px] transition-colors group ${
                collapsed ? 'px-0 justify-center' : 'px-3'
              } ${
                isActive
                  ? 'bg-siemens-teal/12 text-siemens-accent font-medium'
                  : 'text-th-muted hover:text-th-secondary hover:bg-surface-card-hover'
              }`
            }
          >
            <span className="relative shrink-0">
              <Icon size={15} className="shrink-0" />
              {/* When collapsed, the status marker rides the icon as a corner dot */}
              {collapsed && tag === 'live' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-[var(--table-header-bg)]" title="Live against org" />
              )}
              {collapsed && tag === 'roadmap' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 ring-1 ring-[var(--table-header-bg)]" title="Roadmap / illustrative" />
              )}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1 min-w-0 truncate">{label}</span>
                {tag === 'live' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Live against org" />
                )}
                {tag === 'roadmap' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 shrink-0" title="Roadmap / illustrative" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Legend footer — hidden when collapsed (the corner dots carry the signal) */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-surface-border shrink-0 space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-th-faint">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live against org
          </div>
          <div className="flex items-center gap-2 text-[10px] text-th-faint">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" /> Roadmap / illustrative
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-surface-border text-th-faint hover:text-th-secondary hover:bg-surface-card-hover transition-colors shrink-0"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
