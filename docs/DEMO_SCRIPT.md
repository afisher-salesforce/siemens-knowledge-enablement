# Siemens DISW Knowledge Management — Demo / Review Script

A walkthrough script for reviewing the Knowledge Management best-practices site with the
Siemens DISW team. The site is a **teaching artifact**: eight KM capabilities arranged as a
knowledge loop, with a handful proven **live** against a connected Salesforce org and the rest
laid out as a clearly-labeled **roadmap**.

**Audience:** DISW knowledge team / admins (Teamcenter, NX, Simcenter, Calibre EDA).
**Duration:** ~25–30 min full; ~12 min short path (★ items only).
**Golden rule of this demo:** everything is honestly labeled. **Live proof** = reads/writes the
connected org right now. **Roadmap** = recommended model, illustrative, not a live read. Say which
is which out loud — the credibility of the whole conversation rests on it.

---

## 0 · Before you start (setup checklist)

- [ ] Site is open (Heroku app, or local `npm run dev` + `npm run dev:server`).
- [ ] Health indicator in the header reads **Connected** (green dot). Click it once to show the
      detail popover: *BFF up · Salesforce configured · agent wired · writes disabled*. This is your
      "it's really talking to an org" proof — do it early.
- [ ] Writes are **disabled** (`ALLOW_KM_WRITES=false`) — the AI drafting demo returns text only.
      Leave it that way for a review; nothing you click can mutate the org.
- [ ] Decide live vs. offline: C3, C4 (custom column), C5, C8-count and the KM agent need the BFF +
      org reachable. If you're off-network, the teaching content still renders — just narrate the
      live panels instead of running them.
- [ ] Optional: collapse the left sidebar (chevron at its base) when you want the room focused on a
      content panel. Expand it to navigate.

---

## 1 · Frame the conversation — Overview  ★

**Navigate:** Overview (landing page).

**Say:** "This isn't a slideware pitch — it's a working artifact. Eight capabilities, arranged as a
knowledge loop: **capture → structure → reuse → improve**. Three are proven live against a real
Salesforce org today, plus an always-on grounded agent; the rest are a labeled roadmap so you can
see exactly where this goes."

**Show, in order:**
1. **Hero + "The pain we're solving"** — the goal is a governed authoring framework: every product
   group contributes, but quality and control stay in the platform, not in tribal process.
2. **The permission model, at a glance** (the compact card right below the pain statement) — one-line
   lifecycle *Read → Create Draft → Edit Draft → Publish (gated) → Archive*, with the note that
   **API/CLI users draft and edit but never publish**, and elevated authoring lives in sandbox.
   Click **"See the full model on Control Publication →"** to tee up the security story — this is the
   Siemens blind spot we built for, so plant the flag here.
3. **How this maps to KCS** — the four-phase card; this reassures a KCS-literate audience the model
   isn't ad hoc.
4. **Learn this on Trailhead** rail — curated, human-reviewed modules (not a live scrape).
5. **Capability grid** — point out the **Live proof** vs **Roadmap** pills. Set the expectation that
   you'll prove the live ones and sketch the roadmap ones.

**Transition:** "Let's start where Siemens has told us the discomfort is — permissions."

---

## 2 · The security story — Control Publication (C2)  ★  *(centerpiece)*

**Navigate:** 2 · Control Publication.

> This is the heart of the review. Spend real time here.

**Say:** "The fear with distributed authoring is always: *if we let business users and APIs create
content, what stops something wrong — or something automated — from going live?* The answer is two
controls plus one picture."

**Show, in order:**
1. **The failure mode we design out** — when any identity that can *create* can also *publish*, and
   nothing gates the transition, one actor or one API call pushes content live at scale. Name it.
2. **The two controls** — (1) Publish is a *distinct permission*, separate from create/edit; (2) an
   *approval process* gates Draft → Online for everyone. "Same API call either lands in Draft awaiting
   approval, or is rejected outright."
3. **The approval flow** — Draft → Submit → Review → Publish. Note bulk API publish is blocked at
   entry criteria regardless of the caller's permissions.
4. **The permission model, end to end** (the infographic) — walk it deliberately:
   - **Lifecycle rail:** Read → Create Draft → Edit Draft → **Publish (gated by approval)** → **Archive**.
     Point to the amber **"API / CLI stops here"** markers — the wall falls after Edit. API access is
     the *tightest* tier, not the most powerful.
   - **Sub-production vs. Production split:** sandbox gets *elevated latitude* (bulk load, direct
     publish for seeding, "mistakes are cheap and reversible"); production is *governed* (publish
     gated, API/CLI draft-only, archive restricted, elevation only via a release process — never
     granted directly against prod).
   - Read the footnote aloud: *"Illustrative recommended model — not a live permission read."* This is
     a recommendation to configure, not a claim about their org.
5. **Who can do what** (the role × permission grid) — the detailed version of the same model.
   Highlight the **Integration User (API)** row carrying the **"Least privilege"** badge: Create Draft
   ✓, Edit ✓, Publish ✗, Archive ✗. "This single row is the control that keeps API-driven content in
   check."

**Likely question — "Is this reading our actual permissions?"**
Answer plainly: "No — this is the *recommended* model, labeled illustrative. It's the configuration
we'd stand up with you. The live proofs are on the Review, Drafting, and Data Categories pages."

**Transition:** "That's the control side. Here's the other half — distributing creation *without*
loosening that control."

---

## 3 · Distribute creation to the business (C1)

**Navigate:** 1 · Distribute Creation.  *(Roadmap — recommended permission-set model.)*

**Say:** "Distribution and control aren't in tension. The permission model lets you push authoring to
the people with the expertise while publication authority stays narrow."

**Show:**
- **The four author tiers:** business authors draft freely on their group's record types; **API-enabled
  users are the tightest tier** (draft programmatically, explicitly denied Publish — "API access never
  equals publication rights"); **elevated authoring lives in sandbox**; promotion to prod runs through a
  **release process** (change sets / DevOps Center), never by granting elevated rights against prod.
- The **compact permission-model card** here echoes C2 — tie it back: "same model you just saw."
- **Per-product-group record types** — Teamcenter / NX / Simcenter / Calibre each author in their own
  shape (fields, layout, validation) under one governance model.

**Transition:** "Now let's prove the model is real — these next pages touch the org live."

---

## 4 · LIVE — Control reviews from metadata (C3)  ★

**Navigate:** 3 · Review Process.  **← Live proof.**

**Say:** "Knowledge decays. Instead of tribal 'is this still true?', we make staleness a *queryable*
signal."

**Do (live):**
- The page auto-queries the org on load. Point at the **Live** badge and the SOQL it runs:
  `... WHERE PublishStatus='Online' AND NextReviewDate < TODAY`.
- Hit **Refresh** to show it round-tripping to the org in real time.
- Note the footer: *"N article(s) returned · live from the connected org."* (Today's data set has no
  overdue articles, so expect a clean empty-state — that's honest, not a bug. Say: "Nothing's overdue
  right now; the point is the *mechanism* — one SOQL filter, no manual tracking.")
- **"From list to action"** — click **"Ask the agent to triage reviews"** to show the same signal
  feeding an agent (optional; see the agent note in §5).

**Point:** This uses the **standard `NextReviewDate` field** — no custom field required to get started.

---

## 5 · LIVE — The grounded KM agent  ★  *(the showstopper)*

**Where:** The **"Ask the KM Agent"** button in the header (available on every page). This is proof
point (b) — a published, activated Agentforce agent grounded in the org's Knowledge base.

**Say:** "This is a real Agentforce agent — published and activated in the org — answering from the
knowledge base, not improvising."

**Do (live):**
- Open the drawer and ask the proven query:
  **"My NX license won't activate — error -15."**
- Watch it: create a session → ground via the Knowledge search action → return a short abstract **and
  a citation pill**. The pill is **"Resolving Siemens SSL / FlexNet License Manager Errors"** — note it
  correctly resolves the *symptom* ("NX / -15") to the right *article*, not the tempting-but-wrong "NX
  License Borrowing" one. (That correctness is a tuned retrieval behavior, worth calling out to a
  technical audience.)
- Click the **citation pill** → it opens the article **in-app** (`/article/:id`) with the real
  rich-text body rendered — no jump to a Lightning login. "The grounded answer *and* the source,
  inside the experience."

**Scope point (worth saying):** the agent's search action is scoped to the **DISW record type** — it
grounds only on the nine DISW knowledge articles, not on everything in the org. That's deliberate:
the retrieval surface is exactly the governed, reviewed DISW base, nothing bleeds in from other teams.

**Honesty note if asked:** writes are off; the agent reads and grounds, it doesn't publish. Case
creation is a wired fallback action, not exercised in a read-only review.

---

## 6 · LIVE — AI-assisted drafting, two ways (C4)  ★

**Navigate:** 4 · AI Drafting.  **← Partial: custom-agent column is live; Einstein column is illustrative.**

**Say:** "AI drafting isn't one thing. Here's the built-in Einstein path side-by-side with a custom
Agentforce agent — and why DISW's four very different product groups favor the custom path."

**Do (live, right column — "Custom Agentforce agent"):**
- Pick a **product group** (e.g. NX).
- Paste a problem, e.g.: *"Users hit a FlexLM -15 error when the license server hostname changes after
  a VM migration."*
- Click **Draft with the agent**. It calls `DraftKnowledgeArticle` live and returns a structured draft
  (title / summary / Problem–Resolution–Verification body) with a recommended **record type** +
  **"Text only"** badge.
- Call out the badge: **text-only**, double-gated behind `ALLOW_KM_WRITES` — "nothing was written to
  the org; in a review we keep it that way."

**Left column (Einstein):** labeled **"If enabled"** — explain it's the zero-build, platform-managed,
uniform option, live only when Einstein for Knowledge is turned on. Don't click it live unless you've
confirmed enablement in the org.

**"When to use each" table:** land the thesis — Einstein for fast/uniform/governed; custom agent when
groups differ and per-group record types + few-shot steering matter. **That's DISW.**

---

## 7 · LIVE — Data Categories & Topics (C5)  ★

**Navigate:** 5 · Data Categories.  **← Live proof.**

**Say:** "One category hierarchy doing triple duty — security, search scoping, and organization —
across the four product groups."

**Show:**
- **The three uses:** security/visibility (categories → roles/permission sets), search filtering, and
  Topics for cross-cutting themes.
- **The live DISW category group** — the org-standard **`Product`** group was repurposed with the DISW
  taxonomy and is **active in the connected org**: Teamcenter / NX / Simcenter / Calibre / Polarion /
  Capital, plus a non-product **Licensing** node for the SSL/FlexNet + activation articles. All nine
  DISW articles are tagged.
- The clincher: the agent's search action scopes retrieval with
  `WITH DATA CATEGORY Product__c BELOW All__c` — "the same tree that *organizes* also *secures* and
  *scopes grounding*." This is why the agent in §5 cited the right article.

---

## 8 · The roadmap — Data 360, Analytics, Archival (C6–C8)

> Shorter — these are the "where this goes" pages. Be explicit that they're roadmap.

**C6 · Index in Data 360** *(Roadmap)* — published articles become a governed retrieval source in
Data Cloud / Data 360; the grounded-answer experience it enables is already live (tie back to §5:
the **nine DISW articles** authored for this walkthrough — the agent's search is scoped to the DISW
record type, so it grounds on DISW knowledge, not the whole org). Pipeline:
`Knowledge__kav → Data 360 index → Agentforce grounding`.

**C7 · Analytics** *(Roadmap — sample data)* — views & deflection trend, and the most actionable
report: **top unmatched searches** = a ranked backlog of articles to write. Make clear the charts are
illustrative sample data; the real reports come from Knowledge reporting / Search Activity / Tableau
Next. Point out it closes the loop → feeds creation (C1), review (C3), archival (C8).

**C8 · Archival** *(Partial — live stale-count, roadmap process)* — the **"Retirement candidates right
now"** count is a **live** read (same overdue-review query); the archive/restore lifecycle
(Online → Flagged → Archived → Restored) is the recommended process. Key point: archival is its own
permission, reversible (restore to Draft), and driven by the same `NextReviewDate` signal as review —
so the base shrinks deliberately, and stale content stops grounding agents.

---

## 9 · Close

**Say:** "So: a governed authoring model where business users create, APIs stay least-privilege,
publication is gated, and the same reviewed base grounds both your people and your agents — proven live
on Review, Drafting, Data Categories, and the grounded agent, with a clear roadmap for Data 360,
Analytics, and Archival. The permission model you were worried about is the thing we lead with."

**Suggested next steps to offer:**
- Enable Einstein for Knowledge to light up the C4 left column live.
- A working session to map the illustrative permission model (C2) onto their actual permission sets.
- Stand up the review-date cadence + an archival policy on their real article set.

---

## Quick reference — live vs. roadmap

| Capability | Status | What's live in a demo |
|---|---|---|
| Overview | — | Header **Connected** indicator (live health read) |
| 1 · Distribute Creation | Roadmap | Teaching + compact permission model |
| 2 · Control Publication | Roadmap | Teaching + permission infographic + matrix (illustrative) |
| 3 · Review Process | **Live** | SOQL read of overdue articles from the org |
| 4 · AI Drafting | **Partial** | Custom-agent column drafts live (text-only); Einstein col illustrative |
| 5 · Data Categories | **Live** | Repurposed `Product` group active in org; 9 articles tagged |
| 6 · Index in Data 360 | Roadmap | Pipeline teaching; grounded agent is the live tie-in |
| 7 · Analytics | Roadmap | Illustrative charts (sample data) |
| 8 · Archival | **Partial** | Live stale-candidate count; archive/restore process is roadmap |
| **KM Agent** (header) | **Live** | Published+activated Agentforce agent, grounded answer + in-app citation |

**Proven agent query:** *"My NX license won't activate — error -15"* → cites *Resolving Siemens SSL /
FlexNet License Manager Errors*, opens in-app.
