/**
 * Agentforce Invocable Action — Search DISW Knowledge
 *
 * Called by the technical_issue, license_support, and onboarding_setup subagents.
 * SOSL-searches published Knowledge__kav articles and returns the top 2 matches
 * with title, a plain-text article body, and a RELATIVE in-app article URL.
 *
 * The body is assembled from the record-type-specific rich-text fields that
 * actually hold the article content (FAQ_Answer__c for FAQ articles,
 * KCSArticle_Issue__c/Resolution__c for KCS articles, Chat_Answer__c as a
 * fallback), with HTML stripped and the result truncated to keep the grounding
 * payload within a sane token budget. The agent LLM summarizes this body into a
 * 2-3 sentence abstract and cites the article via the returned URL.
 *
 * The URL is RELATIVE (/article/<Id>) so the citation renders INSIDE the KM
 * site's own in-app article viewer (ArticleView.jsx → GET /api/km/article/:id),
 * rather than jumping out to Salesforce Lightning — showcasing the full
 * Agentforce-grounded experience end-to-end within the app.
 *
 * Deploy: sf project deploy start --metadata ApexClass:SearchDISWKnowledge -o siemens-eda-hav-l15viz
 */
global without sharing class SearchDISWKnowledge {
    // Max characters of body returned per article. Enough for the LLM to write a
    // faithful 2-3 sentence abstract without blowing the context/token budget.
    private static final Integer BODY_MAX = 1200;

    global class SearchRequest {
        @InvocableVariable(label='Search Query' required=true)
        global String searchQuery;
    }

    global class SearchResult {
        @InvocableVariable(label='Article Title 1')
        global String articleTitle1;

        @InvocableVariable(label='Article Summary 1')
        global String articleSummary1;

        @InvocableVariable(label='Article Body 1')
        global String articleBody1;

        @InvocableVariable(label='Article Portal URL 1')
        global String articlePortalUrl1;

        @InvocableVariable(label='Article Citation 1')
        global String citation1;

        @InvocableVariable(label='Article Id 1')
        global String articleId1;

        @InvocableVariable(label='Article Title 2')
        global String articleTitle2;

        @InvocableVariable(label='Article Summary 2')
        global String articleSummary2;

        @InvocableVariable(label='Article Body 2')
        global String articleBody2;

        @InvocableVariable(label='Article Portal URL 2')
        global String articlePortalUrl2;

        @InvocableVariable(label='Article Citation 2')
        global String citation2;

        @InvocableVariable(label='Article Id 2')
        global String articleId2;

        @InvocableVariable(label='Result Count')
        global Integer resultCount;
    }

    @InvocableMethod(
        label='Search DISW Knowledge'
        description='Searches Salesforce Knowledge for published DISW support articles. Returns the top 2 matching articles with title, a plain-text article body to summarize, and a relative in-app article link.'
        category='Knowledge'
    )
    global static List<SearchResult> search(List<SearchRequest> requests) {
        List<SearchResult> results = new List<SearchResult>();

        for (SearchRequest req : requests) {
            SearchResult result = new SearchResult();
            result.resultCount = 0;

            if (String.isBlank(req.searchQuery)) {
                results.add(result);
                continue;
            }

            try {
                String query = req.searchQuery;
                List<List<SObject>> searchResults = [
                    FIND :query
                    IN ALL FIELDS
                    RETURNING
                        Knowledge__kav(
                            Id,
                            Title,
                            Summary,
                            FAQ_Question__c,
                            FAQ_Answer__c,
                            Chat_Answer__c,
                            KCSArticle_Issue__c,
                            KCSArticle_Cause__c,
                            KCSArticle_Environment__c,
                            KCSArticle_Resolution__c,
                            Search_Keywords__c
                            WHERE PublishStatus = 'Online' AND RecordType.DeveloperName = 'DISW_Knowledge'
                            LIMIT 2)
                ];

                List<Knowledge__kav> articles = (List<Knowledge__kav>) searchResults[0];
                result.resultCount = articles.size();

                if (articles.size() >= 1) {
                    Knowledge__kav a = articles[0];
                    result.articleTitle1 = a.Title;
                    result.articleSummary1 = String.isNotBlank(a.Summary)
                        ? a.Summary
                        : 'View the full article for resolution steps.';
                    result.articleBody1 = buildBody(a);
                    result.articlePortalUrl1 = articleUrl(a.Id);
                    result.citation1 = markdownCitation(a.Title, a.Id);
                    result.articleId1 = a.Id;
                }

                if (articles.size() >= 2) {
                    Knowledge__kav a = articles[1];
                    result.articleTitle2 = a.Title;
                    result.articleSummary2 = String.isNotBlank(a.Summary)
                        ? a.Summary
                        : 'View the full article for resolution steps.';
                    result.articleBody2 = buildBody(a);
                    result.articlePortalUrl2 = articleUrl(a.Id);
                    result.citation2 = markdownCitation(a.Title, a.Id);
                    result.articleId2 = a.Id;
                }
            } catch (Exception e) {
                result.resultCount = 0;
            }

            results.add(result);
        }

        return results;
    }

    // Relative in-app article URL. The KM site renders the article inside its own
    // viewer (ArticleView.jsx → GET /api/km/article/:id) instead of jumping out
    // to Salesforce Lightning, so the citation stays within the Agentforce-
    // grounded experience. The agent emits this verbatim as a Markdown link.
    private static String articleUrl(Id recordId) {
        return '/article/' + recordId;
    }

    // Pre-built Markdown citation the agent prints VERBATIM: [Title](/article/Id).
    // Building the link in Apex (rather than asking the LLM to assemble it from a
    // separate title + URL) is far more reliable — the agent reproduces a literal
    // string consistently but frequently drops link syntax it has to construct.
    // Square brackets in the title are escaped so they can't break the link.
    private static String markdownCitation(String title, Id recordId) {
        String safeTitle = String.isBlank(title) ? 'View article' : title.replace('[', '(').replace(']', ')');
        return '[' + safeTitle + '](' + articleUrl(recordId) + ')';
    }

    // Assemble a plain-text article body from whichever record-type-specific
    // fields are populated, in a sensible reading order, then strip HTML and
    // truncate. Falls back to Summary when no body field carries content.
    private static String buildBody(Knowledge__kav a) {
        List<String> parts = new List<String>();

        // KCS articles: Issue → Environment → Cause → Resolution
        addPart(parts, 'Issue', a.KCSArticle_Issue__c);
        addPart(parts, 'Environment', a.KCSArticle_Environment__c);
        addPart(parts, 'Cause', a.KCSArticle_Cause__c);
        addPart(parts, 'Resolution', a.KCSArticle_Resolution__c);

        // FAQ articles: Question → Answer
        addPart(parts, 'Question', a.FAQ_Question__c);
        addPart(parts, null, a.FAQ_Answer__c);

        // Chat-answer fallback
        addPart(parts, null, a.Chat_Answer__c);

        String body = String.join(parts, '\n\n');
        if (String.isBlank(body)) {
            body = String.isNotBlank(a.Summary) ? a.Summary : '';
        }

        body = stripHtml(body);

        if (body.length() > BODY_MAX) {
            body = body.substring(0, BODY_MAX) + '…';
        }
        return body;
    }

    private static void addPart(List<String> parts, String label, String value) {
        if (String.isBlank(value)) {
            return;
        }
        parts.add(String.isBlank(label) ? value : (label + ': ' + value));
    }

    // Turn stored rich text into readable plain text: block/line tags become
    // newlines, all other tags are removed, and HTML entities are decoded.
    private static String stripHtml(String input) {
        if (String.isBlank(input)) {
            return '';
        }
        String s = input;
        // Preserve structure: <br>, </p>, </div>, </li> → newlines
        s = s.replaceAll('(?i)<\\s*br\\s*/?\\s*>', '\n');
        s = s.replaceAll('(?i)</\\s*(p|div|li|h[1-6])\\s*>', '\n');
        // Strip all remaining tags
        s = s.replaceAll('<[^>]+>', '');
        // Decode the entities that actually appear in the seeded content
        s = s.replace('&nbsp;', ' ')
            .replace('&amp;#39;', '\'')
            .replace('&#39;', '\'')
            .replace('&amp;', '&')
            .replace('&lt;', '<')
            .replace('&gt;', '>')
            .replace('&quot;', '"');
        // Collapse runs of blank lines / whitespace
        s = s.replaceAll('[ \\t]+', ' ');
        s = s.replaceAll('\\n{3,}', '\n\n');
        return s.trim();
    }
}
