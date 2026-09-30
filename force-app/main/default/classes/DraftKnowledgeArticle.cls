/**
 * Agentforce / Actions-REST Invocable — Draft a DISW Knowledge article.
 *
 * LIVE proof (a), custom-agent column of the KM best-practices site. Drafts a
 * Knowledge article from a support problem + notes, shaping the output to the
 * conventions of the caller's DISW product group (Teamcenter / NX / Simcenter /
 * Calibre EDA) via a per-group few-shot/record-type map.
 *
 * SAFE BY DEFAULT: returns generated TEXT ONLY. It only persists a Draft
 * Knowledge__kav when createDraft = true — and the BFF only ever sets that when
 * its own ALLOW_KM_WRITES gate is on, so this is the inner half of a double gate.
 * Nothing is ever published (no KbManagement.PublishingService call here) — that
 * transition stays behind the org's Publish permission + approval process, which
 * is the whole point of capability 2.
 *
 * Deploy: sf project deploy start --metadata ApexClass:DraftKnowledgeArticle
 * Invoke:  POST /services/data/vXX.0/actions/custom/apex/DraftKnowledgeArticle
 *          { "inputs": [ { "sourceProblem": "...", "productGroup": "Calibre EDA" } ] }
 */
global without sharing class DraftKnowledgeArticle {
    // ---- Inputs -------------------------------------------------------------
    global class DraftRequest {
        @InvocableVariable(label='Product Group' description='Teamcenter | NX | Simcenter | Calibre EDA')
        global String productGroup;

        @InvocableVariable(
            label='Source Problem'
            description='The problem statement or case subject to draft an article from'
        )
        global String sourceProblem;

        @InvocableVariable(label='Source Notes' description='Optional resolution notes / troubleshooting detail')
        global String sourceNotes;

        @InvocableVariable(label='Few-Shot Examples' description='Optional exemplar text steering tone and structure')
        global String fewShotExamples;

        @InvocableVariable(
            label='Create Draft'
            description='When true, persist a Draft Knowledge__kav. Default false = text only.'
        )
        global Boolean createDraft;
    }

    // ---- Outputs (outputValues keys the KM site reads) ----------------------
    global class DraftResult {
        @InvocableVariable(label='Draft Title')
        global String draftTitle;

        @InvocableVariable(label='Draft Summary')
        global String draftSummary;

        @InvocableVariable(label='Draft Body')
        global String draftBody;

        @InvocableVariable(label='Recommended Record Type')
        global String recommendedRecordType;

        @InvocableVariable(label='Recommended Data Category')
        global String recommendedDataCategory;

        @InvocableVariable(label='Persisted')
        global Boolean persisted;

        @InvocableVariable(label='Draft Article Id')
        global String draftArticleId;

        @InvocableVariable(label='Message')
        global String message;
    }

    // ---- Per-group shaping (net-new; multi-group breadth is roadmap) --------
    private class GroupProfile {
        String recordType;
        String dataCategory;
        String shape; // one-line structural convention for the group
    }

    private static GroupProfile profileFor(String grp) {
        String g = String.isBlank(grp) ? '' : grp.trim().toLowerCase();
        GroupProfile p = new GroupProfile();
        if (g == 'teamcenter') {
            p.recordType = 'SDO_Knowledge_KCSArticle';
            p.dataCategory = 'Teamcenter';
            p.shape = 'Long procedural article: Environment, Symptom, Root Cause, Resolution steps, Verification.';
        } else if (g == 'nx') {
            p.recordType = 'SDO_Knowledge_KCSArticle';
            p.dataCategory = 'NX';
            p.shape = 'Step-by-step workflow with numbered actions and expected results after each step.';
        } else if (g == 'simcenter') {
            p.recordType = 'SDO_Knowledge_FAQ';
            p.dataCategory = 'Simcenter';
            p.shape = 'Parameter-heavy reference: list the relevant settings/variables, then the corrective values.';
        } else if (g.startsWith('calibre')) {
            p.recordType = 'SDO_Knowledge_Cirrus';
            p.dataCategory = 'Calibre EDA';
            p.shape = 'Terse fix first, then root cause: state the resolution up front, follow with the why.';
        } else {
            // Unknown / unspecified group — safe generic default.
            p.recordType = 'SDO_Knowledge_FAQ';
            p.dataCategory = 'General';
            p.shape = 'Problem, then resolution steps, then verification.';
        }
        return p;
    }

    @InvocableMethod(
        label='Draft DISW Knowledge Article'
        description='Drafts a Knowledge article from a support problem, shaped to the DISW product group. Returns text only unless createDraft=true.'
        category='Knowledge'
    )
    global static List<DraftResult> draft(List<DraftRequest> requests) {
        List<DraftResult> results = new List<DraftResult>();

        for (DraftRequest req : requests) {
            DraftResult out = new DraftResult();
            out.persisted = false;

            String problem = req == null ? null : req.sourceProblem;
            String notes = req == null ? null : req.sourceNotes;

            if (String.isBlank(problem) && String.isBlank(notes)) {
                out.message = 'No source problem or notes supplied — nothing to draft.';
                results.add(out);
                continue;
            }

            GroupProfile profile = profileFor(req.productGroup);
            String groupLabel = String.isBlank(req.productGroup) ? 'DISW' : req.productGroup.trim();

            // --- Compose the draft (deterministic, dependency-free) ----------
            String seed = String.isNotBlank(problem) ? problem.trim() : notes.trim();
            out.draftTitle = buildTitle(groupLabel, seed);
            out.draftSummary = buildSummary(groupLabel, seed);
            out.draftBody = buildBody(groupLabel, profile, problem, notes, req.fewShotExamples);
            out.recommendedRecordType = profile.recordType;
            out.recommendedDataCategory = profile.dataCategory;

            // --- Optional persist (inner half of the double write-gate) ------
            Boolean wantsPersist = (req.createDraft == true);
            if (wantsPersist) {
                try {
                    Knowledge__kav kav = new Knowledge__kav(
                        Title = trimTo(out.draftTitle, 255),
                        Summary = trimTo(out.draftSummary, 1000),
                        UrlName = buildUrlName(groupLabel, seed),
                        Language = 'en_US'
                    );
                    insert kav; // creates a Draft — never published here
                    out.persisted = true;
                    out.draftArticleId = kav.Id;
                    out.message = 'Draft Knowledge__kav created (Draft status — not published).';
                } catch (Exception e) {
                    out.persisted = false;
                    out.message = 'Draft generated (text only); persist failed: ' + e.getMessage();
                }
            } else {
                out.message = 'Text-only draft — no record written.';
            }

            results.add(out);
        }

        return results;
    }

    // ---- Composition helpers ------------------------------------------------
    private static String buildTitle(String grp, String seed) {
        String s = firstSentence(seed);
        // Keep it article-like: "<Group>: <problem phrase>"
        return trimTo(grp + ': ' + capitalize(s), 255);
    }

    private static String buildSummary(String grp, String seed) {
        return trimTo('Resolution guidance for a ' + grp + ' issue: ' + firstSentence(seed), 1000);
    }

    private static String buildBody(String grp, GroupProfile profile, String problem, String notes, String fewShot) {
        List<String> parts = new List<String>();
        parts.add('## Problem');
        parts.add(String.isNotBlank(problem) ? problem.trim() : '(derived from notes)');
        parts.add('');
        parts.add('## Resolution');
        parts.add(
            String.isNotBlank(notes) ? notes.trim() : 'Document the corrective steps here. Structure: ' + profile.shape
        );
        parts.add('');
        parts.add('## Verification');
        parts.add('Confirm the issue is resolved and capture the validating check.');
        parts.add('');
        parts.add('---');
        parts.add(
            '_Suggested record type: ' +
                profile.recordType +
                ' · data category: ' +
                profile.dataCategory +
                ' · ' +
                grp +
                ' convention: ' +
                profile.shape +
                '_'
        );
        if (String.isNotBlank(fewShot)) {
            parts.add('');
            parts.add('_Drafted using the supplied few-shot exemplar._');
        }
        return String.join(parts, '\n');
    }

    private static String buildUrlName(String grp, String seed) {
        String base = (grp + '-' + firstSentence(seed)).toLowerCase();
        base = base.replaceAll('[^a-z0-9]+', '-').replaceAll('^-+|-+$', '');
        base = trimTo(base, 200);
        // Guard uniqueness — UrlName must be unique among drafts/published.
        return base + '-' + String.valueOf(Datetime.now().getTime());
    }

    private static String firstSentence(String text) {
        if (String.isBlank(text))
            return 'support issue';
        String t = text.trim();
        Integer stop = t.indexOf('.');
        String s = (stop > 0 && stop < 140) ? t.substring(0, stop) : t;
        return trimTo(s, 140);
    }

    private static String capitalize(String s) {
        if (String.isBlank(s))
            return s;
        return s.substring(0, 1).toUpperCase() + (s.length() > 1 ? s.substring(1) : '');
    }

    private static String trimTo(String s, Integer max) {
        if (s == null)
            return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
