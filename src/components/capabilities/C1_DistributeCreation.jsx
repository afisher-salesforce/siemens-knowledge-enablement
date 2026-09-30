import React from 'react';
import { Users, KeyRound, FlaskConical, GitBranch } from 'lucide-react';
import CapabilityLayout from '../CapabilityLayout';
import FutureStateTag from '../FutureStateTag';

const TIERS = [
  {
    icon: Users,
    title: 'Business authors draft freely',
    body: 'Product-group SMEs get create/edit-draft on the record types they own. They contribute knowledge where the expertise lives — without ever touching the Publish transition.',
  },
  {
    icon: KeyRound,
    title: 'API-enabled users are the tightest tier',
    body: 'Integration users can create drafts programmatically but are explicitly denied Publish. API access never equals publication rights — the single most important rule for keeping automated content under control.',
  },
  {
    icon: FlaskConical,
    title: 'Elevated authoring in sandbox',
    body: 'Higher permissions (bulk load, direct publish for seeding) live in sandbox, where mistakes are cheap and reversible.',
  },
  {
    icon: GitBranch,
    title: 'Promotion via a release process',
    body: 'Content and metadata promote to production through change sets / a release pipeline — never by granting elevated authoring directly against prod.',
  },
];

export default function C1_DistributeCreation() {
  return (
    <CapabilityLayout
      number={1}
      title="Distribute knowledge creation to business users"
      subtitle="Push authoring out to the people with the expertise, while publication authority stays narrow and deliberate. Distribution and control are not in tension — the permission model lets you have both."
      status="roadmap"
      statusNote="Recommended permission-set model; not a live permission read."
      teaches={[
        'Separate the right to create a draft from the right to publish it.',
        'API-enabled users get the least privilege, not the most.',
        'Use sandbox for elevated authoring; promote to prod through a release process.',
        'Per-product-group record types let each group author in its own shape.',
      ]}
      features={['Permission Sets', 'Create/Edit Draft article actions', 'Record Types', 'Sandbox → Prod release', 'Change Sets / DevOps Center']}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {TIERS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className="text-siemens-accent" />
              <span className="text-sm font-semibold text-th-secondary">{title}</span>
            </div>
            <p className="text-xs text-th-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-th-secondary">Per-product-group authoring</span>
          <FutureStateTag label="Roadmap" note="Multi-group record types + few-shot sets are illustrative here." />
        </div>
        <p className="text-sm text-th-muted leading-relaxed mb-3">
          DISW's four product groups don't write knowledge the same way. Record types let each group carry
          its own fields, layouts, and validation — while sharing one governance model.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['Teamcenter', 'PLM config & BMIDE — long procedural articles'],
            ['NX', 'CAD/CAM workflows — step-by-step with screenshots'],
            ['Simcenter', 'Simulation setup — parameter-heavy reference'],
            ['Calibre EDA', 'DRC/LVS resolutions — terse fix + root cause'],
          ].map(([group, shape]) => (
            <div key={group} className="rounded-md border border-surface-border bg-surface-card-hover px-3 py-2">
              <div className="text-xs font-semibold text-th-secondary">{group}</div>
              <div className="text-[11px] text-th-muted mt-0.5">{shape}</div>
            </div>
          ))}
        </div>
      </div>
    </CapabilityLayout>
  );
}
