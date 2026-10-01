// SOSL diagnostic — why does SearchDISWKnowledge return irrelevant articles?
// Separates: (1) does the relevant article EXIST + is Online? (SOQL truth)
//            (2) what does raw SOSL FIND actually return + score?
//            (3) does a Title-scoped SOSL do better than IN ALL FIELDS?

System.debug('===== (1) SOQL TRUTH: do license/Calibre articles exist Online? =====');
for (Knowledge__kav a : [
        SELECT Id, Title, PublishStatus, IsLatestVersion, RecordType.DeveloperName
        FROM Knowledge__kav
        WHERE PublishStatus = 'Online'
          AND (Title LIKE '%license%' OR Title LIKE '%licens%'
               OR Title LIKE '%activat%' OR Title LIKE '%Calibre%' OR Title LIKE '%DRC%')
        ORDER BY Title
        LIMIT 25]) {
    System.debug('  [' + a.RecordType.DeveloperName + '] ' + a.Title
        + ' | Online=' + a.PublishStatus + ' latest=' + a.IsLatestVersion + ' id=' + a.Id);
}

System.debug('===== (2) RAW SOSL: FIND {license activation} IN ALL FIELDS =====');
List<List<SObject>> r2 = [
    FIND 'license activation' IN ALL FIELDS
    RETURNING Knowledge__kav(Id, Title, PublishStatus WHERE PublishStatus = 'Online' LIMIT 10)
];
for (SObject o : r2[0]) {
    System.debug('  ALLFIELDS -> ' + (String) o.get('Title'));
}

System.debug('===== (3) SOSL scoped to Title/Summary fields =====');
List<List<SObject>> r3 = [
    FIND 'license activation' IN NAME FIELDS
    RETURNING Knowledge__kav(Id, Title, PublishStatus WHERE PublishStatus = 'Online' LIMIT 10)
];
for (SObject o : r3[0]) {
    System.debug('  NAMEFIELDS -> ' + (String) o.get('Title'));
}

System.debug('===== (4) SOSL Calibre DRC crash IN ALL FIELDS =====');
List<List<SObject>> r4 = [
    FIND 'Calibre DRC crash' IN ALL FIELDS
    RETURNING Knowledge__kav(Id, Title, PublishStatus WHERE PublishStatus = 'Online' LIMIT 10)
];
for (SObject o : r4[0]) {
    System.debug('  CALIBRE-ALLFIELDS -> ' + (String) o.get('Title'));
}
