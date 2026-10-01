// What is ACTUALLY in this org's Knowledge base? Record-type breakdown + a
// sample of Online titles, to decide what DISW content must be seeded.
System.debug('===== Online article count by record type =====');
for (AggregateResult ar : [
        SELECT RecordType.DeveloperName rt, COUNT(Id) c
        FROM Knowledge__kav
        WHERE PublishStatus = 'Online'
        GROUP BY RecordType.DeveloperName
        ORDER BY COUNT(Id) DESC]) {
    System.debug('  ' + ar.get('rt') + ' = ' + ar.get('c'));
}

System.debug('===== Sample of 40 Online titles =====');
for (Knowledge__kav a : [
        SELECT Title FROM Knowledge__kav
        WHERE PublishStatus = 'Online' ORDER BY Title LIMIT 40]) {
    System.debug('  | ' + a.Title);
}

System.debug('===== Any DISW/EDA/Siemens-relevant titles? =====');
Integer hits = 0;
for (Knowledge__kav a : [
        SELECT Title FROM Knowledge__kav
        WHERE PublishStatus = 'Online'
          AND (Title LIKE '%Siemens%' OR Title LIKE '%Teamcenter%' OR Title LIKE '%Calibre%'
               OR Title LIKE '%NX%' OR Title LIKE '%Simcenter%' OR Title LIKE '%Polarion%'
               OR Title LIKE '%FlexLM%' OR Title LIKE '%license%' OR Title LIKE '%Xcelerator%')]) {
    System.debug('  RELEVANT -> ' + a.Title);
    hits++;
}
System.debug('  DISW-relevant Online article count = ' + hits);
