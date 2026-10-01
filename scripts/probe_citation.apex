// Probe: confirm citation1 is a fully-formed Markdown link after the deploy.
SearchDISWKnowledge.SearchRequest req = new SearchDISWKnowledge.SearchRequest();
req.searchQuery = 'license activation';
List<SearchDISWKnowledge.SearchResult> res = SearchDISWKnowledge.search(
    new List<SearchDISWKnowledge.SearchRequest>{ req }
);
System.debug('CITATION1=[' + res[0].citation1 + ']');
System.debug('CITATION2=[' + res[0].citation2 + ']');
