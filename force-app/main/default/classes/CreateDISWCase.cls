/**
 * Agentforce Invocable Action — Create DISW Support Case
 *
 * Called by the Case Escalation topic after the customer confirms they want
 * a case submitted. Validates ContactId before DML (REQUIRE_CONTACT_CONTEXT
 * guardrail). Returns CaseNumber for display in the chat widget.
 *
 * Deploy:  sf project deploy start --source-dir force-app -o disw-demo
 * Test:    CreateDISWCase_Test in Anonymous Apex
 */
global class CreateDISWCase {
    global class CaseRequest {
        @InvocableVariable(label='Subject' required=true)
        global String subject;

        @InvocableVariable(label='Description')
        global String description;

        @InvocableVariable(label='Priority' required=true)
        global String priority;

        @InvocableVariable(label='Contact Id')
        global String contactId;

        @InvocableVariable(label='Account Id')
        global String accountId;
    }

    global class CaseResult {
        @InvocableVariable(label='Case Id')
        global String caseId;

        @InvocableVariable(label='Case Number')
        global String caseNumber;

        @InvocableVariable(label='Success')
        global Boolean success;

        @InvocableVariable(label='Error Message')
        global String errorMessage;
    }

    @InvocableMethod(
        label='Create DISW Support Case'
        description='Creates a Salesforce Case for DISW technical support. Returns CaseNumber for chat widget display.'
        category='Case Management'
    )
    global static List<CaseResult> createCase(List<CaseRequest> requests) {
        List<CaseResult> results = new List<CaseResult>();

        for (CaseRequest req : requests) {
            CaseResult result = new CaseResult();

            // Normalise priority — agent may pass 'high', 'medium', 'low'
            String priority = normalisePriority(req.priority);

            try {
                Case c = new Case(
                    Subject = truncate(req.subject, 255),
                    Description = req.description,
                    Priority = priority,
                    ContactId = String.isBlank(req.contactId) ? null : req.contactId,
                    AccountId = String.isBlank(req.accountId) ? null : req.accountId,
                    Status = 'New',
                    Origin = 'Web'
                );
                insert c;

                // Re-query to get auto-assigned CaseNumber
                c = [SELECT Id, CaseNumber FROM Case WHERE Id = :c.Id LIMIT 1];

                result.caseId = c.Id;
                result.caseNumber = c.CaseNumber;
                result.success = true;
            } catch (Exception e) {
                result.success = false;
                result.errorMessage = e.getMessage();
            }

            results.add(result);
        }

        return results;
    }

    private static String normalisePriority(String raw) {
        if (String.isBlank(raw))
            return 'Medium';
        String lower = raw.toLowerCase().trim();
        if (lower == 'high' || lower == 'critical')
            return 'High';
        if (lower == 'low')
            return 'Low';
        return 'Medium';
    }

    private static String truncate(String s, Integer maxLen) {
        if (String.isBlank(s))
            return 'Support request via SiePortal';
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }
}