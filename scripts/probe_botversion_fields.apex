// Discover how a BotVersion links to its planner. Dump BotVersion field names,
// then dump the active version's full field set so we can see the planner ref.

Schema.DescribeSObjectResult d = ((SObject) Type.forName('Schema.BotVersion').newInstance()) != null
    ? Schema.getGlobalDescribe().get('BotVersion').getDescribe()
    : null;

Map<String, Schema.SObjectField> fields = Schema.getGlobalDescribe().get('BotVersion').getDescribe().fields.getMap();
System.debug('=== BotVersion FIELDS ===');
List<String> names = new List<String>(fields.keySet());
names.sort();
System.debug(String.join(names, ', '));

// Reference-ish fields likely to point at a planner.
System.debug('=== candidate planner-link fields ===');
for (String n : names) {
    String ln = n.toLowerCase();
    if (ln.contains('plan') || ln.contains('genai') || ln.contains('definition') || ln.endsWith('id')) {
        System.debug('  ' + n + ' -> ' + fields.get(n).getDescribe().getType());
    }
}
