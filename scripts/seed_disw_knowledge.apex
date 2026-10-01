/**
 * Seed DISW Knowledge articles — the real grounding corpus for proof point (b).
 *
 * Creates draft Knowledge__kav records under the DISW_Knowledge record type,
 * populates the KCSArticle_* body fields (which SearchDISWKnowledge.buildBody()
 * already reads), sets NextReviewDate for the review-cadence capability (#3),
 * and PUBLISHES each to Online via KbManagement.PublishingService so SOSL
 * indexes them and the agent can genuinely ground.
 *
 * Idempotent: skips any article whose Title already exists Online under the
 * DISW_Knowledge record type, so it is safe to re-run.
 *
 * Run (writes are gated — user's terminal, not sandbox):
 *   sf apex run --file scripts/seed_disw_knowledge.apex -o siemens-eda-hav-l15viz
 */

// ── Resolve the DISW_Knowledge record type Id ────────────────────────────────
Id rtId;
for (RecordType rt : [
        SELECT Id, DeveloperName FROM RecordType
        WHERE SobjectType = 'Knowledge__kav' AND DeveloperName = 'DISW_Knowledge' LIMIT 1]) {
    rtId = rt.Id;
}
if (rtId == null) {
    System.debug('ERROR: DISW_Knowledge record type not found. Deploy the record type first.');
    return;
}

// ── Article definitions (Title, Summary, Issue, Environment, Cause, Resolution)
List<Map<String, String>> defs = new List<Map<String, String>>();

defs.add(new Map<String, String>{
    'title' => 'How to Activate Your Siemens DISW Software License',
    'summary' => 'Step-by-step guide to activating a Siemens Digital Industries Software license using Siemens License Server (SSL) and the FlexNet-based license file.',
    'issue' => 'A new user needs to activate a Siemens DISW product license and is unsure how to apply the license file received from the Siemens Support Center.',
    'environment' => 'Siemens Xcelerator portfolio (NX, Teamcenter, Simcenter) with Siemens License Server (SSL) or standalone node-locked licensing.',
    'cause' => 'The license file has not yet been installed and pointed to by the client application, or the SIEMENS_LIC or SPLM_LICENSE_SERVER environment variable is unset.',
    'resolution' => '1. Download the license file (.dat/.lic) from the Siemens Support Center under License Management. 2. For a floating license, install Siemens License Server (SSL) and load the file via the SSL admin console. 3. Set the SPLM_LICENSE_SERVER environment variable to port@host (default 28000@localhost for standalone). 4. Launch the product; if activation fails, verify the composite host ID in the license file matches the machine, and confirm the SSL service is running. 5. Confirm license checkout in the SSL log.',
    'keywords' => 'license activation, how to activate, activate license, license file, .dat, .lic, SPLM_LICENSE_SERVER, node-locked, floating license, composite host ID, Siemens License Server, SSL, FlexNet, port@host, 28000, entitlement'
});

defs.add(new Map<String, String>{
    'title' => 'Resolving a Calibre nmDRC Crash During Rule-Deck Execution',
    'summary' => 'Diagnose and resolve crashes of Calibre nmDRC during physical verification, including memory, rule-deck, and layer-mapping causes.',
    'issue' => 'Calibre nmDRC terminates unexpectedly (segmentation fault or "unexpected internal error") partway through a DRC run on a large layout.',
    'environment' => 'Calibre nmDRC (EDA physical verification) on Linux, invoked via calibre -drc against a foundry rule deck.',
    'cause' => 'Common causes: insufficient host memory / swap for the design size, a corrupt or mismatched GDS layer map, an unsupported rule-deck construct for the installed Calibre version, or a stale results database lock.',
    'resolution' => '1. Re-run with -turbo limited to available cores and confirm host RAM covers the peak reported in the transcript. 2. Validate the rule deck against the Calibre version (calibre -drc -version) and update to the foundry-certified deck. 3. Check the layer map (LAYOUT SYSTEM GDSII / LAYER MAP) for undefined layers. 4. Remove any stale .cellmap/.db locks from a prior aborted run. 5. If the crash persists, capture the transcript and svdb and open a case with the layout, rule-deck version, and Calibre build.',
    'keywords' => 'Calibre, nmDRC, DRC crash, segmentation fault, segfault, rule deck, physical verification, GDS layer map, layer mapping, turbo, foundry rule deck, results database lock, out of memory'
});

defs.add(new Map<String, String>{
    'title' => 'Onboarding a New User to Siemens Xcelerator and Teamcenter',
    'summary' => 'The standard onboarding checklist for a new Siemens DISW user: WebKey account, license entitlement, Teamcenter access, and client install.',
    'issue' => 'A new engineer is joining the team and needs access to Siemens Xcelerator resources and Teamcenter.',
    'environment' => 'Siemens Xcelerator (Support Center, WebKey), Teamcenter PLM, NX or other DISW clients.',
    'cause' => 'New user has no WebKey account, no license entitlement, and no Teamcenter role assignment yet.',
    'resolution' => '1. Register a Siemens WebKey account tied to the company WebKey Access Code. 2. Have the license administrator assign product entitlement in the Support Center. 3. Request a Teamcenter user and role/group assignment from the PLM administrator. 4. Install the client (NX/Teamcenter) and point it at the license server (SPLM_LICENSE_SERVER) and Teamcenter FMS/FSC. 5. Verify login and a test check-in/check-out. Escalate access gaps to the site administrator.',
    'keywords' => 'onboarding, new user, new hire, WebKey, WebKey Access Code, entitlement, Teamcenter access, role assignment, client install, Xcelerator, PLM administrator, cannot log in, access request'
});

defs.add(new Map<String, String>{
    'title' => 'Resolving Siemens SSL / FlexNet License Manager Errors',
    'summary' => 'Troubleshooting the most common Siemens License Server (SSL) and FlexNet errors, including -15, -96, and composite host ID mismatches.',
    'issue' => 'A DISW application fails to start with a licensing error such as "Cannot connect to license server system (-15)" or "License server machine is down (-96)".',
    'environment' => 'Siemens License Server (SSL) built on FlexNet Publisher; NX/Teamcenter/Simcenter clients checking out floating licenses.',
    'cause' => 'The license daemon is not running, the client points at the wrong port@host, a firewall blocks the vendor daemon port, or the license file host ID no longer matches the server.',
    'resolution' => '1. On the server, confirm the lmgrd and siemensd (vendor) daemons are up (lmstat -a). 2. On the client, verify SPLM_LICENSE_SERVER = port@host and that both the lmgrd port and the vendor-daemon port are reachable through the firewall. 3. For -15, open the vendor daemon port explicitly (VENDOR siemensd PORT=xxxxx). 4. For a host ID mismatch, re-host the license file to the current composite ID via the Support Center. 5. Restart SSL and re-test with lmstat.',
    'keywords' => 'NX, Teamcenter, Simcenter, error -15, -15, error -96, -96, cannot connect to license server, license server system, license server machine is down, connection failed, activation failure, won\'t activate, will not activate, license won\'t activate, license server unreachable, lmgrd, siemensd, vendor daemon, lmstat, UGS_LICENSE_SERVER, SPLM_LICENSE_SERVER, FlexNet, FlexNet Publisher, SSL, Siemens License Server, firewall, vendor daemon port, port@host, composite host ID mismatch, re-host license'
});

defs.add(new Map<String, String>{
    'title' => 'Configuring Teamcenter BMIDE for a New Data Model',
    'summary' => 'How to set up a Teamcenter BMIDE project, define a custom business object, and deploy the template to a Teamcenter server.',
    'issue' => 'A PLM administrator needs to extend the Teamcenter data model with a custom business object and deploy it safely.',
    'environment' => 'Teamcenter Business Modeler IDE (BMIDE), Teamcenter server (two-tier or four-tier), Eclipse-based BMIDE client.',
    'cause' => 'The data model change requires a BMIDE template project, a defined business object with persistent properties, and a packaged deployment rather than a direct server edit.',
    'resolution' => '1. In BMIDE, create or open the template project and load the current server template as a dependency. 2. Add a custom business object extending the appropriate base type; define persistent properties and LOVs. 3. Save and package the template (Package Template). 4. Deploy in maintenance mode via the deploy scripts (install -deploy) against the target server. 5. Restart the Teamcenter services and verify the new type appears in Rich/Active Workspace. Always deploy to a test environment before production.',
    'keywords' => 'Teamcenter, BMIDE, Business Modeler IDE, data model, custom business object, persistent property, LOV, template project, deploy template, maintenance mode, Active Workspace, Rich Client, two-tier, four-tier'
});

defs.add(new Map<String, String>{
    'title' => 'NX License Borrowing for Offline Use',
    'summary' => 'How to borrow an NX floating license for disconnected/offline work and return it early.',
    'issue' => 'An NX user needs to work offline (travel) but NX requires a connection to the floating license server.',
    'environment' => 'Siemens NX with floating licenses served by Siemens License Server (SSL) / FlexNet with borrowing enabled.',
    'cause' => 'The license was not borrowed before disconnecting, or borrowing is not enabled in the license options file.',
    'resolution' => '1. Confirm BORROW is permitted in the SSL options file for the feature. 2. Before going offline, borrow via the FlexNet lmborrow utility or the NX licensing dialog, specifying a return date within the max borrow period. 3. Verify the borrowed feature with lmborrow -status. 4. Work offline until the borrow expires. 5. To return early, reconnect and run lmborrow -return, then confirm the seat is back in the pool with lmstat.',
    'keywords' => 'NX, license borrowing, borrow license, offline, disconnected, travel, lmborrow, lmborrow -status, lmborrow -return, borrow period, options file, BORROW enabled, floating license, SSL, FlexNet'
});

defs.add(new Map<String, String>{
    'title' => 'Simcenter STAR-CCM+ Solver Fails to Launch on HPC Cluster',
    'summary' => 'Resolving Simcenter STAR-CCM+ launch failures in a batch/HPC environment, covering MPI, licensing, and Power-on-Demand.',
    'issue' => 'A Simcenter STAR-CCM+ batch job fails to start on the HPC cluster, reporting an MPI or license error before the solver initializes.',
    'environment' => 'Simcenter STAR-CCM+ on a Linux HPC cluster with a workload manager (Slurm/PBS), MPI, and floating or Power-on-Demand (PoD) licensing.',
    'cause' => 'MPI fabric mismatch between the launcher and compute nodes, an unreachable license server from the compute nodes, or an invalid PoD key.',
    'resolution' => '1. Confirm the MPI implementation and fabric flags match the cluster (e.g. -mpi openmpi -fabric ...). 2. Ensure compute nodes can reach the license server (SPLM_LICENSE_SERVER) or supply a valid PoD key with -power -podkey. 3. Verify the pod/floating feature count with lmstat. 4. Test a single-node interactive run before scaling out. 5. Check node-to-node SSH/interconnect for parallel launch. Capture the batch log for escalation.',
    'keywords' => 'Simcenter, STAR-CCM+, STARCCM, solver fails to launch, HPC, cluster, batch job, MPI, fabric mismatch, Slurm, PBS, Power-on-Demand, PoD, podkey, license error, compute nodes, interconnect'
});

defs.add(new Map<String, String>{
    'title' => 'Polarion ALM Workflow Configuration for Requirements Approval',
    'summary' => 'Setting up a Polarion work-item workflow with an approval gate for requirements management.',
    'issue' => 'A Polarion administrator needs requirements to route through a formal review-and-approve workflow before reaching an Approved status.',
    'environment' => 'Siemens Polarion ALM, project or global work-item type configuration, workflow designer.',
    'cause' => 'The requirement work-item type uses the default workflow with no approval transition or signature gate.',
    'resolution' => '1. In Administration > Work Items > Workflow for the Requirement type, add a Review status and an Approved status. 2. Define transitions Draft to Review (submit) and Review to Approved (approve) with a workflow condition requiring a signature or specific role. 3. Add a workflow function to set the approving user and timestamp. 4. Assign the approver role in project permissions. 5. Save and test with a sample requirement, confirming non-approvers cannot make the Approved transition.',
    'keywords' => 'Polarion, ALM, workflow, requirements approval, approval gate, work item, Requirement type, Review status, Approved status, transition, signature, workflow function, approver role, requirements management'
});

defs.add(new Map<String, String>{
    'title' => 'Capital Harness Data Synchronization Between Modules',
    'summary' => 'Resolving data-sync issues between Capital electrical design modules so harness changes propagate correctly.',
    'issue' => 'Changes made in Capital Logic or Capital Integrator are not reflected in the downstream Capital Harness design, causing stale connectivity.',
    'environment' => 'Siemens Capital (electrical/E/E systems) with Capital Logic, Integrator, and Harness modules sharing a project data model.',
    'cause' => 'The synchronization/publish step between modules was not run, or a data-model baseline mismatch blocked propagation.',
    'resolution' => '1. Confirm all modules reference the same project baseline and version. 2. Run the publish/synchronize action from the upstream module (Logic/Integrator) to push connectivity to Harness. 3. In Harness, refresh/import the published data and resolve any reported reconciliation conflicts. 4. Validate the harness against the logical design (design rule check). 5. If sync still fails, verify project permissions and that no module holds a blocking lock; escalate with the project archive.',
    'keywords' => 'Capital, Capital Harness, Capital Logic, Capital Integrator, data synchronization, data sync, publish, synchronize, propagate, stale connectivity, reconciliation conflict, baseline mismatch, design rule check, E/E systems, harness'
});

// Title → keyword string, for both the insert path and the idempotent update
// pass below. Built once from the defs so there is a single source of truth.
Map<String, String> keywordsByTitle = new Map<String, String>();
for (Map<String, String> d : defs) {
    keywordsByTitle.put(d.get('title'), d.get('keywords'));
}

// ── Skip titles that already exist Online under DISW_Knowledge (idempotency) ──
Set<String> existing = new Set<String>();
for (Knowledge__kav a : [
        SELECT Title FROM Knowledge__kav
        WHERE PublishStatus = 'Online' AND RecordTypeId = :rtId]) {
    existing.add(a.Title);
}

// ── Create drafts ────────────────────────────────────────────────────────────
Date reviewBase = Date.today();
List<Knowledge__kav> toInsert = new List<Knowledge__kav>();
Integer idx = 0;
for (Map<String, String> d : defs) {
    if (existing.contains(d.get('title'))) {
        System.debug('SKIP (already Online): ' + d.get('title'));
        continue;
    }
    Knowledge__kav k = new Knowledge__kav();
    k.RecordTypeId = rtId;
    k.Title = d.get('title');
    // UrlName must be unique and URL-safe.
    String slug = d.get('title').toLowerCase().replaceAll('[^a-z0-9]+', '-').replaceAll('(^-+|-+$)', '');
    if (slug.length() > 80) slug = slug.substring(0, 80);
    k.UrlName = slug;
    k.Summary = d.get('summary');
    k.KCSArticle_Issue__c = d.get('issue');
    k.KCSArticle_Environment__c = d.get('environment');
    k.KCSArticle_Cause__c = d.get('cause');
    k.KCSArticle_Resolution__c = d.get('resolution');
    k.Search_Keywords__c = d.get('keywords');
    // Stagger NextReviewDate so capability #3 (review cadence) has a mix of
    // overdue and upcoming articles to demonstrate against.
    k.NextReviewDate = reviewBase.addDays(-30 + (idx * 20));
    toInsert.add(k);
    idx++;
}

// ── Idempotent keyword backfill on already-Online articles ───────────────────
// The 9 articles are typically already Online from a prior run, so the insert
// path above skips them and never touches Search_Keywords__c. This pass runs
// REGARDLESS of the skip logic: for each Online DISW article whose keyword value
// differs from the def, update it. A plain update on the Online row works in
// this org's Knowledge config; if the platform rejects editing an Online row
// (FIELD_INTEGRITY / non-editable), fall back to edit-draft → update → republish.
Integer kwUpdated = 0;
for (Knowledge__kav a : [
        SELECT Id, Title, KnowledgeArticleId, Search_Keywords__c
        FROM Knowledge__kav
        WHERE PublishStatus = 'Online' AND RecordTypeId = :rtId]) {
    String desired = keywordsByTitle.get(a.Title);
    if (desired == null) {
        continue; // Online article not in our def set — leave it alone.
    }
    if (desired.equals(a.Search_Keywords__c)) {
        continue; // Already current — nothing to do.
    }
    try {
        Knowledge__kav upd = new Knowledge__kav(Id = a.Id, Search_Keywords__c = desired);
        update upd;
        kwUpdated++;
        System.debug('KEYWORDS UPDATED (online): ' + a.Title);
    } catch (Exception e1) {
        System.debug('Online update rejected for ' + a.Title + ' -> ' + e1.getMessage()
            + ' ; retrying via draft.');
        try {
            Id draftId = KbManagement.PublishingService.editOnlineArticle(a.KnowledgeArticleId, true);
            update new Knowledge__kav(Id = draftId, Search_Keywords__c = desired);
            KbManagement.PublishingService.publishArticle(a.KnowledgeArticleId, true);
            kwUpdated++;
            System.debug('KEYWORDS UPDATED (via draft+republish): ' + a.Title);
        } catch (Exception e2) {
            System.debug('KEYWORD UPDATE FAILED for ' + a.Title + ' -> ' + e2.getMessage());
        }
    }
}
System.debug('Backfilled keywords on ' + kwUpdated + ' already-Online DISW articles.');

// ── Idempotent Data Category tagging (Phase B) ───────────────────────────────
// Tag each Online DISW article into the "Product" data category group so
// capability #5 (Data Categories) is a LIVE proof and the Apex FIND can filter
// WITH DATA CATEGORY. The org already had the max number of category groups, so
// rather than add a new one we reuse the org-standard "Product" group, whose
// tree was repurposed with the DISW product taxonomy (Teamcenter, NX, Simcenter,
// Calibre, Polarion, Capital, Licensing under top category "All"). Tagging writes
// Knowledge__DataCategorySelection CHILD rows (ParentId = the Knowledge__kav
// version Id, DataCategoryGroupName = the group DeveloperName, DataCategoryName =
// the category name) — NOT a field on the article. Selections on an Online
// article cannot be inserted directly (INSUFFICIENT_ACCESS / non-editable), so,
// like the keyword backfill, fall back to edit-draft → insert selection on the
// draft → republish. Idempotent: query existing selections per parent and skip
// categories already present.
//
// Mapping is by Title (NOT stale hardcoded Ids — the draft/republish cycle mints
// new KAV version Ids each run). Licensing is the non-product home for the two
// license articles; everything else maps to its product.
final String DCG = 'Product';
Map<String, String> categoryByTitle = new Map<String, String>{
    'How to Activate Your Siemens DISW Software License'      => 'Licensing',
    'Resolving Siemens SSL / FlexNet License Manager Errors'  => 'Licensing',
    'NX License Borrowing for Offline Use'                    => 'NX',
    'Resolving a Calibre nmDRC Crash During Rule-Deck Execution' => 'Calibre',
    'Onboarding a New User to Siemens Xcelerator and Teamcenter' => 'Teamcenter',
    'Configuring Teamcenter BMIDE for a New Data Model'       => 'Teamcenter',
    'Simcenter STAR-CCM+ Solver Fails to Launch on HPC Cluster' => 'Simcenter',
    'Polarion ALM Workflow Configuration for Requirements Approval' => 'Polarion',
    'Capital Harness Data Synchronization Between Modules'    => 'Capital'
};

Integer tagged = 0;
for (Knowledge__kav a : [
        SELECT Id, Title, KnowledgeArticleId
        FROM Knowledge__kav
        WHERE PublishStatus = 'Online' AND RecordTypeId = :rtId]) {
    String wantCat = categoryByTitle.get(a.Title);
    if (wantCat == null) {
        continue; // Online article not in our mapping — leave it alone.
    }
    // Already tagged with the desired category on THIS version? Skip.
    Boolean already = false;
    for (Knowledge__DataCategorySelection sel : [
            SELECT DataCategoryName, DataCategoryGroupName
            FROM Knowledge__DataCategorySelection
            WHERE ParentId = :a.Id]) {
        if (DCG.equals(sel.DataCategoryGroupName) && wantCat.equals(sel.DataCategoryName)) {
            already = true;
            break;
        }
    }
    if (already) {
        System.debug('CATEGORY ALREADY SET: ' + a.Title + ' -> ' + wantCat);
        continue;
    }
    // Try a direct insert on the Online version first; on rejection, go through
    // a draft and republish.
    try {
        Knowledge__DataCategorySelection sel = new Knowledge__DataCategorySelection(
            ParentId = a.Id,
            DataCategoryGroupName = DCG,
            DataCategoryName = wantCat);
        insert sel;
        tagged++;
        System.debug('TAGGED (online): ' + a.Title + ' -> ' + wantCat);
    } catch (Exception e1) {
        System.debug('Online tag rejected for ' + a.Title + ' -> ' + e1.getMessage()
            + ' ; retrying via draft.');
        try {
            Id draftId = KbManagement.PublishingService.editOnlineArticle(a.KnowledgeArticleId, true);
            // The draft is a NEW version; skip if it somehow already carries the tag.
            Boolean draftHas = false;
            for (Knowledge__DataCategorySelection sel : [
                    SELECT DataCategoryName, DataCategoryGroupName
                    FROM Knowledge__DataCategorySelection
                    WHERE ParentId = :draftId]) {
                if (DCG.equals(sel.DataCategoryGroupName) && wantCat.equals(sel.DataCategoryName)) {
                    draftHas = true;
                    break;
                }
            }
            if (!draftHas) {
                insert new Knowledge__DataCategorySelection(
                    ParentId = draftId,
                    DataCategoryGroupName = DCG,
                    DataCategoryName = wantCat);
            }
            KbManagement.PublishingService.publishArticle(a.KnowledgeArticleId, true);
            tagged++;
            System.debug('TAGGED (via draft+republish): ' + a.Title + ' -> ' + wantCat);
        } catch (Exception e2) {
            System.debug('CATEGORY TAG FAILED for ' + a.Title + ' -> ' + e2.getMessage());
        }
    }
}
System.debug('Tagged ' + tagged + ' already-Online DISW articles into ' + DCG + '.');

if (toInsert.isEmpty()) {
    System.debug('Nothing to create — all DISW articles already Online.');
    return;
}

insert toInsert;
System.debug('Inserted ' + toInsert.size() + ' draft DISW articles.');

// Re-query to obtain KnowledgeArticleId (the parent article Id that
// PublishingService expects — it is not populated on the inserted rows in
// memory). Only the freshly-created drafts are selected.
Set<Id> newIds = new Set<Id>();
for (Knowledge__kav k : toInsert) newIds.add(k.Id);

// ── Publish each draft to Online (indexes for SOSL + grounds the agent) ──────
Integer published = 0;
Integer total = 0;
for (Knowledge__kav k : [
        SELECT Id, Title, KnowledgeArticleId FROM Knowledge__kav WHERE Id IN :newIds]) {
    total++;
    try {
        // Tag the fresh draft into Siemens_Product BEFORE publishing, so a
        // from-scratch seed lands categorized in one pass (the backfill tagging
        // above then finds it already-tagged and skips). Selection insert on a
        // draft is allowed; it carries forward when the draft is published.
        String wantCat = categoryByTitle.get(k.Title);
        if (wantCat != null) {
            try {
                insert new Knowledge__DataCategorySelection(
                    ParentId = k.Id,
                    DataCategoryGroupName = DCG,
                    DataCategoryName = wantCat);
                System.debug('TAGGED DRAFT: ' + k.Title + ' -> ' + wantCat);
            } catch (Exception eCat) {
                System.debug('DRAFT TAG FAILED for ' + k.Title + ' -> ' + eCat.getMessage());
            }
        }
        KbManagement.PublishingService.publishArticle(k.KnowledgeArticleId, true);
        published++;
        System.debug('PUBLISHED: ' + k.Title);
    } catch (Exception e) {
        System.debug('PUBLISH FAILED for ' + k.Title + ' -> ' + e.getMessage());
    }
}
System.debug('Published ' + published + ' / ' + total + ' DISW articles Online.');
