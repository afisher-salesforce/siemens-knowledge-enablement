// Probe SearchDISWKnowledge with the EXACT query the BFF/agent receives, to see
// whether the action itself returns the "events" article as the top hit.
SearchDISWKnowledge.SearchRequest req = new SearchDISWKnowledge.SearchRequest();
req.searchQuery = 'Find articles about license activation.';
List<SearchDISWKnowledge.SearchResult> res = SearchDISWKnowledge.search(
    new List<SearchDISWKnowledge.SearchRequest>{ req }
);
SearchDISWKnowledge.SearchResult r = res[0];
System.debug('QUERY=[Find articles about license activation.]');
System.debug('RESULTCOUNT=' + r.resultCount);
System.debug('TITLE1=[' + r.articleTitle1 + ']');
System.debug('URL1=[' + r.articlePortalUrl1 + ']');
System.debug('TITLE2=[' + r.articleTitle2 + ']');
System.debug('URL2=[' + r.articlePortalUrl2 + ']');
