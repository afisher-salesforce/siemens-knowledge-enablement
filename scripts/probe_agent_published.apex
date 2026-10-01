// What is actually DEPLOYED for the DISW_Support_Assistant agent?
// Uses dynamic SOQL so a type the org doesn't expose to Apex doesn't abort the
// whole script. Each block is independent.

void q(String label, String soql) {
    try {
        List<SObject> rows = Database.query(soql);
        System.debug('=== ' + label + ' (' + rows.size() + ') ===');
        for (SObject r : rows) System.debug(label + ' | ' + JSON.serialize(r));
    } catch (Exception e) {
        System.debug('=== ' + label + ' NOT QUERYABLE: ' + e.getMessage());
    }
}

q('BOT', 'SELECT Id, DeveloperName, MasterLabel, Type FROM BotDefinition WHERE DeveloperName = \'DISW_Support_Assistant\'');
q('BOTVERSION', 'SELECT Id, VersionNumber, Status, LastModifiedDate FROM BotVersion ORDER BY LastModifiedDate DESC LIMIT 10');
q('PLANNER', 'SELECT Id, DeveloperName, MasterLabel, LastModifiedDate FROM GenAiPlannerDefinition ORDER BY LastModifiedDate DESC LIMIT 10');
q('PLUGIN', 'SELECT Id, DeveloperName, MasterLabel, Language FROM GenAiPluginDefinition ORDER BY LastModifiedDate DESC LIMIT 30');
