/**
 * Tests for DraftKnowledgeArticle.
 *
 * Covers: all four product-group branches + the generic default, the
 * text-only path (createDraft unset/false), the persist path (createDraft=true),
 * and the empty-input guard. The persist assertions only run when Knowledge is
 * enabled in the org (Knowledge__kav is creatable), so the test stays green in
 * orgs without Lightning Knowledge while still exercising the write path where
 * it exists.
 */
@isTest
private class DraftKnowledgeArticleTest {
    private static DraftKnowledgeArticle.DraftRequest req(String grp, String problem, Boolean create) {
        DraftKnowledgeArticle.DraftRequest r = new DraftKnowledgeArticle.DraftRequest();
        r.productGroup = grp;
        r.sourceProblem = problem;
        r.createDraft = create;
        return r;
    }

    @isTest
    static void textOnly_shapesPerGroup() {
        List<DraftKnowledgeArticle.DraftRequest> reqs = new List<DraftKnowledgeArticle.DraftRequest>{
            req('Teamcenter', 'BMIDE deploy to staging fails.', false),
            req('NX', 'AWC login loops after SSO.', false),
            req('Simcenter', 'STAR-CCM+ license checkout error.', null),
            req('Calibre EDA', 'nmDRC crashes on large layout.', false),
            req('Unknown Group', 'Generic problem here.', false)
        };

        Test.startTest();
        List<DraftKnowledgeArticle.DraftResult> out = DraftKnowledgeArticle.draft(reqs);
        Test.stopTest();

        System.assertEquals(5, out.size(), 'one result per request');

        System.assertEquals('SDO_Knowledge_KCSArticle', out[0].recommendedRecordType, 'Teamcenter → KCS');
        System.assertEquals('SDO_Knowledge_KCSArticle', out[1].recommendedRecordType, 'NX → KCS');
        System.assertEquals('SDO_Knowledge_FAQ', out[2].recommendedRecordType, 'Simcenter → FAQ');
        System.assertEquals('SDO_Knowledge_Cirrus', out[3].recommendedRecordType, 'Calibre EDA → Cirrus');
        System.assertEquals('SDO_Knowledge_FAQ', out[4].recommendedRecordType, 'unknown → FAQ default');

        System.assertEquals('Calibre EDA', out[3].recommendedDataCategory);
        for (DraftKnowledgeArticle.DraftResult r : out) {
            System.assertNotEquals(null, r.draftTitle, 'title generated');
            System.assertNotEquals(null, r.draftBody, 'body generated');
            System.assert(r.draftBody.contains('## Resolution'), 'body has resolution section');
            System.assertEquals(false, r.persisted, 'text-only → not persisted');
            System.assertEquals(null, r.draftArticleId, 'no id when text-only');
        }
    }

    @isTest
    static void emptyInput_guarded() {
        Test.startTest();
        List<DraftKnowledgeArticle.DraftResult> out = DraftKnowledgeArticle.draft(
            new List<DraftKnowledgeArticle.DraftRequest>{ req('NX', null, false) }
        );
        Test.stopTest();

        System.assertEquals(1, out.size());
        System.assertEquals(false, out[0].persisted);
        System.assertEquals(null, out[0].draftTitle, 'no draft for empty input');
        System.assert(out[0].message.contains('nothing to draft'), 'guard message');
    }

    @isTest
    static void fewShot_notedInBody() {
        DraftKnowledgeArticle.DraftRequest r = req('Simcenter', 'Amesim solver diverges.', false);
        r.fewShotExamples = 'Example: state the parameter, then the fix.';

        Test.startTest();
        List<DraftKnowledgeArticle.DraftResult> out = DraftKnowledgeArticle.draft(
            new List<DraftKnowledgeArticle.DraftRequest>{ r }
        );
        Test.stopTest();

        System.assert(out[0].draftBody.contains('few-shot'), 'few-shot exemplar acknowledged in body');
    }

    @isTest
    static void persist_writesDraft_whenKnowledgeEnabled() {
        // Only exercise the write path if the org has Lightning Knowledge.
        if (!Schema.getGlobalDescribe().containsKey('Knowledge__kav')) {
            return;
        }
        if (!Knowledge__kav.SObjectType.getDescribe().isCreateable()) {
            return;
        }

        Test.startTest();
        List<DraftKnowledgeArticle.DraftResult> out = DraftKnowledgeArticle.draft(
            new List<DraftKnowledgeArticle.DraftRequest>{
                req('Teamcenter', 'TC_ROOT permissions block startup.', true)
            }
        );
        Test.stopTest();

        System.assertEquals(1, out.size());
        System.assertEquals(true, out[0].persisted, 'createDraft=true persists a Draft');
        System.assertNotEquals(null, out[0].draftArticleId, 'draft id returned');

        List<Knowledge__kav> drafts = [
            SELECT Id, Title, PublishStatus
            FROM Knowledge__kav
            WHERE Id = :out[0].draftArticleId
        ];
        System.assertEquals(1, drafts.size(), 'draft row exists');
        System.assertEquals('Draft', drafts[0].PublishStatus, 'created as Draft, never published');
    }
}
