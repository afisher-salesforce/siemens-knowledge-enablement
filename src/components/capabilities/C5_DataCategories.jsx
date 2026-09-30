import React from 'react';
import { FolderTree, Lock, Search, Tags } from 'lucide-react';
import CapabilityLayout from '../CapabilityLayout';
import FutureStateTag from '../FutureStateTag';

const USES = [
  {
    icon: Lock,
    title: 'Security & visibility',
    body: 'Data category visibility maps categories to roles and permission sets — an NX author sees NX categories, a partner sees only external-facing ones. Categorization becomes an access-control lever, not just a filing scheme.',
  },
  {
    icon: Search,
    title: 'Search & filtering',
    body: 'Readers narrow to their product group and sub-area before searching. Fewer, more relevant results — and the same category filter powers list views and agent retrieval scoping.',
  },
  {
    icon: Tags,
    title: 'Topics for cross-cutting themes',
    body: 'Topics tag articles across the category tree — "licensing", "installation", "performance" — so a theme that spans Teamcenter and Calibre stays findable without duplicating the hierarchy.',
  },
];

export default function C5_DataCategories() {
  return (
    <CapabilityLayout
      number={5}
      title="Data Categories & Topics"
      subtitle="One category hierarchy that does triple duty — security, search scoping, and categorization — across the four DISW product groups. Topics layer cross-cutting themes on top without forcing them into the tree."
      status="roadmap"
      statusNote="Data Category Group configuration isn't confirmed live in the connected org — treated as roadmap until verified in Setup."
      teaches={[
        'A single category group can drive security, search, and organization at once.',
        'Category visibility ties categories to roles / permission sets — access control by taxonomy.',
        'Topics handle cross-cutting themes the hierarchy can\'t express cleanly.',
        'Scope agent retrieval to a category so grounding stays on-product.',
      ]}
      features={['Data Category Groups', 'Category Visibility', 'Topics', 'Knowledge search filters', 'Category-scoped retrieval']}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {USES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className="text-siemens-accent" />
              <span className="text-sm font-semibold text-th-secondary">{title}</span>
            </div>
            <p className="text-xs text-th-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Illustrative category tree */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <FolderTree size={16} className="text-siemens-accent" />
          <span className="text-sm font-semibold text-th-secondary">A DISW category group</span>
          <FutureStateTag label="Illustrative" note="Example hierarchy — confirm the org's Data Category Groups in Setup before demoing live." />
        </div>
        <div className="font-mono text-xs text-th-muted leading-relaxed">
          <div className="text-th-secondary font-semibold">DISW_Product</div>
          <div className="pl-4 mt-1 space-y-1">
            <div>├─ Teamcenter <span className="text-th-faint">→ PLM, BMIDE, Active Workspace</span></div>
            <div>├─ NX <span className="text-th-faint">→ CAD, CAM, Design</span></div>
            <div>├─ Simcenter <span className="text-th-faint">→ 3D, STAR-CCM+, Amesim</span></div>
            <div>└─ Calibre&nbsp;EDA <span className="text-th-faint">→ DRC, LVS, PERC</span></div>
          </div>
        </div>
        <p className="text-xs text-th-muted leading-relaxed mt-4">
          Each top node maps to a product group's record type and its authoring permission set. Category visibility
          then decides who reads what — the same tree that organizes also secures.
        </p>
      </div>
    </CapabilityLayout>
  );
}
