// Compare SOSL top-hit for a filler-heavy sentence vs. distilled keywords.
// Hypothesis: stripping stop-words ("find","articles","about","in","my","area")
// makes SearchDISWKnowledge return the same license article the agent describes.
Map<String, String> cases = new Map<String, String>{
    'RAW'       => 'Find articles about license activation.',
    'DISTILLED' => 'license activation',
    'ACTIVATE'  => 'activate license',
    'CALIBRE'   => 'Calibre DRC crash resolution'
};
for (String k : cases.keySet()) {
    SearchDISWKnowledge.SearchRequest req = new SearchDISWKnowledge.SearchRequest();
    req.searchQuery = cases.get(k);
    List<SearchDISWKnowledge.SearchResult> res = SearchDISWKnowledge.search(
        new List<SearchDISWKnowledge.SearchRequest>{ req }
    );
    System.debug(k + ' q=[' + cases.get(k) + '] -> TITLE1=[' + res[0].articleTitle1 + ']');
}
