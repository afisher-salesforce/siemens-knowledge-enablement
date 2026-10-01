// Probe SearchDISWKnowledge: what does articlePortalUrl1 actually contain?
SearchDISWKnowledge.SearchRequest req = new SearchDISWKnowledge.SearchRequest();
req.searchQuery = 'license activation';
List<SearchDISWKnowledge.SearchRequest> reqs = new List<SearchDISWKnowledge.SearchRequest>{ req };
List<SearchDISWKnowledge.SearchResult> res = SearchDISWKnowledge.search(reqs);
SearchDISWKnowledge.SearchResult r = res[0];
System.debug('RESULTCOUNT=' + r.resultCount);
System.debug('TITLE1=[' + r.articleTitle1 + ']');
System.debug('URL1=[' + r.articlePortalUrl1 + ']');
System.debug('SUMMARY1=[' + r.articleSummary1 + ']');
System.debug('BODY1LEN=' + (r.articleBody1 == null ? -1 : r.articleBody1.length()));
