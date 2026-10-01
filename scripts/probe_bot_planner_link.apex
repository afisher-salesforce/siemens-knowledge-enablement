// Which planner does the LIVE agent actually run?
// The Agent API targets BotDefinition 0XxWt000000wwbVKAQ. Its ACTIVE BotVersion
// references a GenAiPlannerDefinition. If that planner is NOT the newest
// (DISW_Support_Assistant_v5 / 16jWt000000g4td), the live agent runs stale
// reasoning that may lack working search_knowledge wiring.

void q(String label, String soql) {
    try {
        List<SObject> rows = Database.query(soql);
        System.debug('=== ' + label + ' (' + rows.size() + ') ===');
        for (SObject r : rows) System.debug(label + ' | ' + JSON.serialize(r));
    } catch (Exception e) {
        System.debug('=== ' + label + ' ERR: ' + e.getMessage());
    }
}

// The BotDefinition the Agent API points at, and its versions + planner links.
q('BOTDEF', 'SELECT Id, DeveloperName, MasterLabel FROM BotDefinition WHERE Id = \'0XxWt000000wwbVKAQ\'');

// BotVersion carries the planner reference. Field name varies by release —
// try the common ones. Status=Active is the one the API runs.
q('BOTVER_PLANNER', 'SELECT Id, VersionNumber, Status, PlannerId, LastModifiedDate FROM BotVersion WHERE BotDefinitionId = \'0XxWt000000wwbVKAQ\' ORDER BY VersionNumber DESC');
