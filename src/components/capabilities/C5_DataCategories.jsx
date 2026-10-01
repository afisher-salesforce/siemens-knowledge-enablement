import React from 'react';
import { FolderTree, Lock, Search, Tags } from 'lucide-react';
import CapabilityLayout from '../CapabilityLayout';

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
      status="live"
      statusNote="The org-standard Product data category group was repurposed with the DISW taxonomy and is active in the connected org, all nine DISW articles are tagged, and the KM agent's search action scopes retrieval with WITH DATA CATEGORY."
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

      {/* The live category group deployed to the connected org */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <FolderTree size={16} className="text-siemens-accent" />
          <span className="text-sm font-semibold text-th-secondary">The live DISW category group</span>
        </div>
        <div className="font-mono text-xs text-th-muted leading-relaxed">
          <div className="text-th-secondary font-semibold">Product → All</div>
          <div className="pl-4 mt-1 space-y-1">
            <div>├─ Teamcenter <span className="text-th-faint">→ Onboarding, BMIDE</span></div>
            <div>├─ NX <span className="text-th-faint">→ License Borrowing</span></div>
            <div>├─ Simcenter <span className="text-th-faint">→ STAR-CCM+ on HPC</span></div>
            <div>├─ Calibre <span className="text-th-faint">→ nmDRC crash</span></div>
            <div>├─ Polarion <span className="text-th-faint">→ ALM approval workflow</span></div>
            <div>├─ Capital <span className="text-th-faint">→ Harness data sync</span></div>
            <div>└─ Licensing <span className="text-th-faint">→ Activation, SSL / FlexNet errors</span></div>
          </div>
        </div>
        <p className="text-xs text-th-muted leading-relaxed mt-4">
          The org-standard <span className="font-mono text-th-secondary">Product</span> category group was repurposed
          with this DISW taxonomy — it is active in the connected org, and every DISW article is tagged into one node:
          the six products plus a non-product <span className="font-mono text-th-secondary">Licensing</span> node that
          keeps the SSL/FlexNet and activation articles out of any single product's tree. The KM agent's search action
          scopes retrieval with <span className="font-mono text-th-secondary">WITH DATA CATEGORY Product__c BELOW All__c</span>,
          so grounding stays on-taxonomy. Category visibility layers on top to decide who reads what — the same tree
          that organizes also secures.
        </p>
      </div>
    </CapabilityLayout>
  );
}
