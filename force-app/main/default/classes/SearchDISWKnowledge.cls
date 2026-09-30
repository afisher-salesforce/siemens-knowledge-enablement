/**
 * Agentforce Invocable Action — Search DISW Knowledge
 *
 * Called by the technical_issue, license_support, and onboarding_setup subagents.
 * SOSL-searches published Knowledge__kav articles and returns the top 2 matches
 * with title, summary, and a portal-relative URL for the in-portal article drawer.
 *
 * Deploy: sf project deploy start --metadata ApexClass:SearchDISWKnowledge -o disw-demo
 */
global without sharing class SearchDISWKnowledge {
    global class SearchRequest {
        @InvocableVariable(label='Search Query' required=true)
        global String searchQuery;
    }

    global class SearchResult {
        @InvocableVariable(label='Article Title 1')
        global String articleTitle1;

        @InvocableVariable(label='Article Summary 1')
        global String articleSummary1;

        @InvocableVariable(label='Article Portal URL 1')
        global String articlePortalUrl1;

        @InvocableVariable(label='Article Title 2')
        global String articleTitle2;

        @InvocableVariable(label='Article Summary 2')
        global String articleSummary2;

        @InvocableVariable(label='Article Portal URL 2')
        global String articlePortalUrl2;

        @InvocableVariable(label='Result Count')
        global Integer resultCount;
    }

    @InvocableMethod(
        label='Search DISW Knowledge'
        description='Searches Salesforce Knowledge for published DISW support articles. Returns top 2 matching articles with title, summary, and portal URL for the in-portal article drawer.'
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
                    RETURNING Knowledge__kav(Id, Title, Summary, UrlName WHERE PublishStatus = 'Online' LIMIT 2)
                ];

                List<Knowledge__kav> articles = (List<Knowledge__kav>) searchResults[0];
                result.resultCount = articles.size();

                if (articles.size() >= 1) {
                    Knowledge__kav a = articles[0];
                    result.articleTitle1 = a.Title;
                    result.articleSummary1 = String.isNotBlank(a.Summary)
                        ? a.Summary
                        : 'View the full article for resolution steps.';
                    result.articlePortalUrl1 = '/article?id=' + a.Id;
                }

                if (articles.size() >= 2) {
                    Knowledge__kav a = articles[1];
                    result.articleTitle2 = a.Title;
                    result.articleSummary2 = String.isNotBlank(a.Summary)
                        ? a.Summary
                        : 'View the full article for resolution steps.';
                    result.articlePortalUrl2 = '/article?id=' + a.Id;
                }
            } catch (Exception e) {
                result.resultCount = 0;
            }

            results.add(result);
        }

        return results;
    }
}