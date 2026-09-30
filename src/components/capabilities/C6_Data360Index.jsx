import React, { useContext } from 'react';
import { Database, ArrowRight, Bot, Layers, Sparkles } from 'lucide-react';
import CapabilityLayout from '../CapabilityLayout';
import FutureStateTag from '../FutureStateTag';
import { AgentChatContext } from '../Layout';

const PIPELINE = [
  { label: 'Knowledge__kav', body: '132 published articles across the four product groups.' },
  { label: 'Data 360 index', body: 'Articles ingested as a retrieval source — chunked, embedded, searchable semantically.' },
  { label: 'Agentforce grounding', body: 'The agent retrieves relevant chunks at answer time instead of guessing.' },
];

export default function C6_Data360Index() {
  const openAgent = useContext(AgentChatContext);
  return (
    <CapabilityLayout
      number={6}
      title="Index in Data 360"
      subtitle="Published articles become a governed retrieval source in Data Cloud / Data 360 — the substrate that lets Agentforce answer from your knowledge base instead of hallucinating, and lets reporting span Knowledge alongside every other object."
      status="roadmap"
      statusNote="Data 360 indexing is roadmap; the grounded-answer experience it enables is live via the KM agent."
      teaches={[
        'Indexing turns static articles into semantic retrieval for agents.',
        'Grounded retrieval is what separates a useful agent from a plausible-sounding one.',
        'The same index feeds unified reporting across Knowledge and other objects.',
        'Governance carries through — categories and security scope what gets retrieved.',
      ]}
      features={['Data Cloud / Data 360', 'Retrieval-augmented grounding', 'Search Index', 'Unified reporting', 'Tableau Next']}
    >
      {/* Pipeline */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={16} className="text-siemens-accent" />
          <span className="text-sm font-semibold text-th-secondary">From article to grounded answer</span>
          <FutureStateTag label="Roadmap" note="Data 360 ingestion is future-state; the agent grounding below is live." />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
          {PIPELINE.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex-1 rounded-lg border border-surface-border bg-surface-card-hover p-3">
                <div className="text-sm font-mono font-semibold text-siemens-accent mb-1">{s.label}</div>
                <div className="text-[11px] text-th-muted leading-relaxed">{s.body}</div>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className="hidden sm:flex items-center text-th-faint">
                  <ArrowRight size={16} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Live tie-in to proof (b) */}
      <div className="card p-5 border-l-2 border-l-siemens-teal/50">
        <div className="flex items-center gap-2 mb-2">
          <Bot size={16} className="text-siemens-accent" />
          <span className="text-sm font-semibold text-th-secondary">Grounded retrieval feels like this</span>
        </div>
        <p className="text-sm text-th-muted leading-relaxed mb-3">
          Even before a full Data 360 index, the KM agent grounds its answers in the 132 published articles. Ask it a
          product question and watch it cite knowledge rather than improvise — that's the experience Data 360 scales
          across every source.
        </p>
        <button
          onClick={() => openAgent?.('Find articles about license activation and summarize the steps.')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-siemens-teal/10 border border-siemens-teal/25 text-siemens-accent hover:bg-siemens-teal/20 transition-colors text-xs font-medium"
        >
          <Sparkles size={13} />
          Ask the grounded agent
        </button>
      </div>
    </CapabilityLayout>
  );
}
