import React, { useState, useCallback, createContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, MessageSquareText } from 'lucide-react';
import Sidebar, { NAV_ITEMS } from './Sidebar';
import ThemeToggle from './ThemeToggle';
import ConnectionStatus from './ConnectionStatus';
import KnowledgeAgentChat from './KnowledgeAgentChat';

// Lets any capability page open the KM agent drawer with a pre-filled prompt
// (e.g. a "Try it with the agent" button inside a capability body).
export const AgentChatContext = createContext(null);

export default function Layout({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [agentPrefill, setAgentPrefill] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const current = NAV_ITEMS.find((n) => n.to === location.pathname);
  const pageTitle = current ? current.label.replace(/^\d+\s·\s/, '') : 'Knowledge Management';

  const openAgentWithPrompt = useCallback((prompt) => {
    setAgentPrefill(prompt);
    setChatOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-surface-bg">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
        {/* Top header */}
        <header className="sticky top-0 z-20 h-14 bg-[var(--table-header-bg)]/80 backdrop-blur-xl border-b border-surface-border flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-th-secondary tracking-wide">{pageTitle}</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-siemens-teal/10 border border-siemens-teal/20">
              <Sparkles size={10} className="text-siemens-accent" />
              <span className="text-[9px] font-bold text-siemens-accent uppercase tracking-[0.15em]">
                Best Practices
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setAgentPrefill(null); setChatOpen(true); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-siemens-teal/10 border border-siemens-teal/25 text-siemens-accent hover:bg-siemens-teal/20 transition-colors"
              title="Ask the KM Knowledge Agent (live grounded answer)"
            >
              <MessageSquareText size={14} />
              <span className="text-xs font-medium hidden sm:inline">Ask the KM Agent</span>
            </button>
            <ConnectionStatus />
            <ThemeToggle />
            <div className="w-px h-6 bg-surface-border mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-siemens-teal text-white flex items-center justify-center" title="Siemens">
                <span className="text-[5px] font-bold tracking-tight leading-none">SIEMENS</span>
              </div>
              <span className="text-sm text-th-muted hidden sm:inline">Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <AgentChatContext.Provider value={openAgentWithPrompt}>
            {children}
          </AgentChatContext.Provider>
        </main>
      </div>

      {/* Global KM agent drawer — proof point (b) */}
      <KnowledgeAgentChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        prefill={agentPrefill}
        onPrefillConsumed={() => setAgentPrefill(null)}
      />
    </div>
  );
}
