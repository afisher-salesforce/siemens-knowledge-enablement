import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import LiveBadge from './LiveBadge';
import { getArticle } from '../api/km';

// Dependency-free HTML sanitizer for stored Knowledge rich text. Salesforce
// rich-text fields hold reasonably clean markup, but we never trust it blindly:
// we drop <script>/<style>/<iframe>/<object> and their content, strip on* event
// handlers, and neutralize javascript:/data: URLs on href/src. Everything else
// (paragraphs, lists, tables, links, formatting) renders as-is so the article
// reads the way it does in Salesforce — inside this Heroku app.
function sanitizeHtml(html) {
  if (!html) return '';
  let s = String(html);
  // Remove dangerous elements INCLUDING their contents.
  s = s.replace(/<(script|style|iframe|object|embed|link|meta|base|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<(script|style|iframe|object|embed|link|meta|base|form)\b[^>]*\/?>/gi, '');
  // Strip inline event handlers: on*="..." / on*='...' / on*=bare
  s = s.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
  s = s.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
  s = s.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
  // Neutralize javascript:/vbscript:/data: in href/src attributes.
  s = s.replace(/(href|src)\s*=\s*"(\s*(?:javascript|vbscript|data):[^"]*)"/gi, '$1="#"');
  s = s.replace(/(href|src)\s*=\s*'(\s*(?:javascript|vbscript|data):[^']*)'/gi, "$1='#'");
  return s;
}

export default function ArticleView() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, error: null, data: null });
    getArticle(id)
      .then((data) => active && setState({ loading: false, error: null, data }))
      .catch((err) => active && setState({ loading: false, error: err.message, data: null }));
    return () => {
      active = false;
    };
  }, [id]);

  const article = state.data;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/overview"
        className="inline-flex items-center gap-1.5 text-xs text-th-muted hover:text-siemens-accent transition-colors mb-5"
      >
        <ArrowLeft size={13} />
        Back to overview
      </Link>

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-siemens-teal/15 border border-siemens-teal/25 flex items-center justify-center">
              <BookOpen size={14} className="text-siemens-accent" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-siemens-accent">
              Knowledge Article
            </span>
            <LiveBadge note="SELECT ... FROM Knowledge__kav WHERE Id = :id AND PublishStatus='Online'" />
          </div>

          {state.loading ? (
            <div className="h-6 w-2/3 rounded bg-surface-card-hover animate-pulse" />
          ) : article ? (
            <>
              <h1 className="text-xl font-semibold text-th-primary leading-snug">{article.title}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-th-muted">
                {article.recordType && (
                  <span className="badge badge-teal text-[9px]">{article.recordType}</span>
                )}
                {article.lastPublished && (
                  <span>Published {new Date(article.lastPublished).toLocaleDateString()}</span>
                )}
                <span className="inline-flex items-center gap-1 text-siemens-accent">
                  <ShieldCheck size={11} />
                  Rendered in-app from the connected org
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {state.loading ? (
            <div className="flex items-center justify-center py-12 text-th-muted">
              <Loader2 size={18} className="animate-spin mr-2" />
              <span className="text-sm">Loading article from the org…</span>
            </div>
          ) : state.error ? (
            <div className="flex items-start gap-2 text-sm text-amber-500">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-th-secondary">Couldn't load this article</div>
                <div className="text-xs text-th-muted mt-1">{state.error}</div>
                <div className="text-xs text-th-faint mt-2">
                  The article must be published (<span className="font-mono">PublishStatus='Online'</span>) and the
                  BFF must have Salesforce credentials. Start it with{' '}
                  <span className="font-mono">npm run dev:server</span>.
                </div>
              </div>
            </div>
          ) : !article || article.sections.length === 0 ? (
            <div className="py-8 text-center text-sm text-th-muted">
              This article has no rendered body content.
              {article?.summary && (
                <p className="mt-3 text-th-secondary max-w-prose mx-auto">{article.summary}</p>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {article.sections.map((sec, i) => (
                <section key={i}>
                  {sec.label && (
                    <h2 className="text-[11px] font-semibold uppercase tracking-wide text-th-muted mb-1.5">
                      {sec.label}
                    </h2>
                  )}
                  <div
                    className="km-article-body text-sm text-th-secondary leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(sec.html) }}
                  />
                </section>
              ))}
            </div>
          )}
        </div>

        {!state.loading && !state.error && article && (
          <div className="px-6 py-3 border-t border-surface-border text-[11px] text-th-faint">
            Live from the connected org · article rendered inside this app, never fetched from Salesforce by the
            browser.
          </div>
        )}
      </div>
    </div>
  );
}
