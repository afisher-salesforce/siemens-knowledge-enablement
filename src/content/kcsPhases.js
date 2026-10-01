/**
 * KCS (Knowledge-Centered Service) phase mapping — the methodology throughline
 * for the DISW KM site.
 *
 * Plain-language KCS, adapted for DISW's GOVERNED authoring model. Textbook KCS
 * has frontline agents capture and publish knowledge in the flow of every case.
 * DISW doesn't work that way: a focused set of authors drafts (SMEs + AI-assisted),
 * and publication stays reviewed and gated — end users generally don't publish
 * articles straight from cases. So we keep the KCS *loop* (capture → structure →
 * reuse → improve) as the organizing idea, but say openly that capture is curated
 * and publication is controlled. The payoff of the loop is a trusted, structured
 * knowledge base that grounds BOTH human agents and digital (Agentforce) agents.
 *
 * Single source of truth, consumed by OverviewView (the loop card) and
 * CapabilityLayout (the per-page "KCS · <phase>" eyebrow). The phase taglines
 * reframe language already present in each capability's blurb — no new claims.
 */

export const KCS_PHASES = {
  capture: {
    label: 'Capture',
    tagline: 'Draft knowledge where the expertise lives',
  },
  structure: {
    label: 'Structure',
    tagline: 'Make it findable — and gate it before it goes live',
  },
  reuse: {
    label: 'Reuse',
    tagline: 'Ground humans and agents in trusted answers',
  },
  improve: {
    label: 'Improve',
    tagline: 'Let demand and decay drive the next edit',
  },
};

// Loop order for rendering the phases in sequence.
export const KCS_PHASE_ORDER = ['capture', 'structure', 'reuse', 'improve'];

// Capability route slug → KCS phase key. Every capability serves one phase of the
// loop; the Overview groups capabilities by phase and each capability page shows
// its phase in the header eyebrow.
export const CAPABILITY_PHASE = {
  distribute: 'capture',
  'ai-drafting': 'capture',
  categories: 'structure',
  publish: 'structure',
  data360: 'reuse',
  review: 'improve',
  analytics: 'improve',
  archival: 'improve',
};
