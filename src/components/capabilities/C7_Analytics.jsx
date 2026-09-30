import React from 'react';
import {
  BarChart3, TrendingUp, SearchX, ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import CapabilityLayout from '../CapabilityLayout';
import FutureStateTag from '../FutureStateTag';

const VIEWS_OVER_TIME = [
  { month: 'Apr', views: 4200, deflected: 2600 },
  { month: 'May', views: 5100, deflected: 3300 },
  { month: 'Jun', views: 6400, deflected: 4500 },
  { month: 'Jul', views: 7200, deflected: 5300 },
  { month: 'Aug', views: 8100, deflected: 6100 },
  { month: 'Sep', views: 9300, deflected: 7200 },
];

const UNMATCHED_TERMS = [
  { term: 'FlexLM -96', searches: 340 },
  { term: 'BMIDE upgrade', searches: 280 },
  { term: 'STAR-CCM+ license', searches: 210 },
  { term: 'Calibre nmDRC', searches: 190 },
  { term: 'NX AWC login', searches: 150 },
];

const AXIS = { fontSize: 11, fill: 'var(--text-muted)' };

export default function C7_Analytics() {
  return (
    <CapabilityLayout
      number={7}
      title="Analytics"
      subtitle="Knowledge is a feedback loop. Usage, deflection, and — most valuable — the searches that returned nothing tell you exactly what to write next and which articles to retire. The charts below are illustrative of the reports the platform provides."
      status="roadmap"
      statusNote="Illustrative charts with sample data — the real reports come from Knowledge reporting, Search Activity, and Tableau Next."
      teaches={[
        'Track views and case deflection to prove knowledge ROI.',
        'Unmatched search terms are a ranked backlog of articles to write.',
        'Per-article metrics tell you what to update, retire, or promote.',
        'Feed the same signals back into the review and archival processes.',
      ]}
      features={['Knowledge reports', 'Search Activity', 'Case deflection dashboards', 'Tableau Next', 'Report types on Knowledge__kav']}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Views & deflection */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-siemens-accent" />
            <span className="text-sm font-semibold text-th-secondary">Views & case deflection</span>
            <FutureStateTag label="Sample data" />
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={VIEWS_OVER_TIME} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                <XAxis dataKey="month" tick={AXIS} stroke="var(--surface-border)" />
                <YAxis tick={AXIS} stroke="var(--surface-border)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="views" stroke="#009999" strokeWidth={2} dot={false} name="Article views" />
                <Line type="monotone" dataKey="deflected" stroke="#6366f1" strokeWidth={2} dot={false} name="Cases deflected" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unmatched search terms */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <SearchX size={16} className="text-siemens-accent" />
            <span className="text-sm font-semibold text-th-secondary">Top unmatched searches</span>
            <FutureStateTag label="Sample data" />
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={UNMATCHED_TERMS} layout="vertical" margin={{ top: 5, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" horizontal={false} />
                <XAxis type="number" tick={AXIS} stroke="var(--surface-border)" />
                <YAxis type="category" dataKey="term" tick={AXIS} stroke="var(--surface-border)" width={92} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="searches" fill="#009999" radius={[0, 4, 4, 0]} name="Searches with no result" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-th-muted leading-relaxed mt-3">
            Each bar is an article waiting to be written. This is the single most actionable Knowledge report.
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-siemens-accent" />
          <span className="text-sm font-semibold text-th-secondary">Closing the loop</span>
        </div>
        <p className="text-sm text-th-muted leading-relaxed">
          Analytics isn't a dashboard you admire — it drives the other capabilities. Unmatched searches feed
          <span className="text-th-secondary"> creation</span> (capability&nbsp;1), low-view stale articles feed
          <span className="text-th-secondary"> review</span> (capability&nbsp;3) and
          <span className="text-th-secondary"> archival</span> (capability&nbsp;8), and deflection proves the
          program's value to the business.
        </p>
      </div>
    </CapabilityLayout>
  );
}
