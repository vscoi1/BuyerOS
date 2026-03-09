import { describe, it, expect, beforeEach } from "vitest";
import {
    createClient,
    createProperty,
    createOffMarketSubmission,
    getClient,
    updateClient,
    getProperty,
    updateProperty,
    saveDueDiligence,
    getDueDiligence,
    assignOffMarketSubmission,
    createPortalSession,
    createPortalFeedback,
    registerDocumentUpload,
    listDocuments,
    getDocumentWithFlags,
    extractDocumentRedFlags,
    updateRedFlagStatus,
    canAccessDocumentStorageKey,
} from "./data-access";

// Two completely separate tenants
const sessionA = {
    organizationId: "org_isolation_a",
    user: { id: "agent_isolation_a", email: "a@test.com", name: "Agent A", role: "ADMIN" as const },
};
const sessionB = {
    organizationId: "org_isolation_b",
    user: { id: "agent_isolation_b", email: "b@test.com", name: "Agent B", role: "AGENT" as const },
};

describe("Tenant Isolation — cross-org bypass attempts (in-memory)", () => {
    let clientAId: string;
    let propertyAId: string;
    let submissionAId: string;
    let documentAId: string;
    let documentAStorageKey: string;

    // Create Org A's data before each test
    beforeEach(async () => {
        const clientA = await createClient(sessionA, {
            firstName: "Alice",
            lastName: "A",
            email: `alice-${Date.now()}@orga.com`,
            budgetMin: 500_000,
            budgetMax: 900_000,
            targetSuburbs: ["Bondi"],
            briefSummary: "Alice wants a place in Bondi near the beach.",
        });
        clientAId = clientA.id;

        const propertyA = await createProperty(sessionA, {
            address: "1 Org-A Street",
            suburb: "Bondi",
            state: "NSW",
            postcode: "2026",
            stage: "SEARCHING",
            isOffMarket: false,
        });
        propertyAId = propertyA.id;

        const submissionA = await createOffMarketSubmission(sessionA, {
            sellingAgent: "Org A Agent",
            agency: "Org A Realty",
            address: "99 Org-A Ave",
            suburb: "Bondi",
            state: "NSW",
            postcode: "2026",
        });
        submissionAId = submissionA.id;

        documentAStorageKey = `documents/test-${Date.now()}.pdf`;
        await registerDocumentUpload(
            sessionA,
            {
                propertyId: propertyAId,
                fileName: "Contract.pdf",
                mimeType: "application/pdf",
                sizeBytes: 1024,
            },
            documentAStorageKey,
        );
        const docs = await listDocuments(sessionA, propertyAId);
        documentAId = docs[0]!.id;
    });

    describe("Clients", () => {
        it("getClient: Org B cannot read Org A client", async () => {
            const result = await getClient(sessionB, clientAId);
            expect(result).toBeNull();
        });

        it("updateClient: Org B cannot update Org A client", async () => {
            const result = await updateClient(sessionB, {
                id: clientAId,
                firstName: "Hacked",
                lastName: "B",
                email: "hacked@orgb.com",
                budgetMin: 1,
                budgetMax: 2,
                targetSuburbs: ["Bondi"],
                briefSummary: "Injected by Org B.",
            });
            expect(result).toBeNull();
        });
    });

    describe("Properties", () => {
        it("getProperty: Org B cannot read Org A property", async () => {
            const result = await getProperty(sessionB, propertyAId);
            expect(result).toBeNull();
        });

        it("updateProperty: Org B cannot update Org A property", async () => {
            const result = await updateProperty(sessionB, {
                id: propertyAId,
                address: "Hacked Address",
                suburb: "Injected",
                state: "VIC",
                postcode: "3000",
                stage: "CONTRACTED",
                isOffMarket: true,
            });
            expect(result).toBeNull();
        });

        it("saveDueDiligence: Org B cannot write DD report on Org A property", async () => {
            const result = await saveDueDiligence(sessionB, propertyAId, {
                propertyId: propertyAId,
                floodRisk: "LOW",
                bushfireRisk: "LOW",
                zoningChangeFlag: false,
                recentComparableDeltaPct: 0,
                riskScore: 10,
                flags: [],
                summary: "Injected by Org B.",
                createdAt: new Date().toISOString(),
                status: "COMPLETED",
            });
            expect(result).toBeNull();
        });

        it("getDueDiligence: Org B cannot read DD report for Org A property", async () => {
            // First write one as Org A
            await saveDueDiligence(sessionA, propertyAId, {
                propertyId: propertyAId,
                floodRisk: "LOW",
                bushfireRisk: "LOW",
                zoningChangeFlag: false,
                recentComparableDeltaPct: 5,
                riskScore: 20,
                flags: [],
                summary: "Org A report.",
                createdAt: new Date().toISOString(),
                status: "COMPLETED",
            });
            const result = await getDueDiligence(sessionB, propertyAId);
            expect(result).toBeNull();
        });
    });

    describe("Off-Market", () => {
        it("assignOffMarketSubmission: Org B cannot assign Org A submission", async () => {
            const result = await assignOffMarketSubmission(sessionB, submissionAId, sessionB.user.id);
            expect(result).toBeNull();
        });
    });

    describe("Portal", () => {
        it("createPortalSession: Org B cannot issue portal session for Org A client", async () => {
            await expect(createPortalSession(sessionB, clientAId)).rejects.toThrow("NOT_FOUND");
        });

        it("createPortalFeedback: Org B cannot create feedback on Org A property", async () => {
            await expect(
                createPortalFeedback(sessionB, {
                    clientId: clientAId,
                    propertyId: propertyAId,
                    status: "INTERESTED",
                    comment: "Injected by Org B",
                }),
            ).rejects.toThrow("NOT_FOUND");
        });
    });

    describe("Documents", () => {
        it("listDocuments: Org B cannot list Org A documents", async () => {
            const result = await listDocuments(sessionB, propertyAId);
            expect(result).toEqual([]);
        });

        it("getDocumentWithFlags: Org B cannot read Org A document with flags", async () => {
            const result = await getDocumentWithFlags(sessionB, documentAId);
            expect(result).toBeNull();
        });

        it("canAccessDocumentStorageKey: Org B cannot get signed URL access to Org A document", async () => {
            const allowed = await canAccessDocumentStorageKey(sessionB, documentAStorageKey);
            expect(allowed).toBe(false);
        });

        it("updateRedFlagStatus: Org B cannot approve Org A document red flags", async () => {
            const extracted = await extractDocumentRedFlags(sessionA, documentAId);
            const targetFlag = extracted[0];
            expect(targetFlag).toBeTruthy();

            const result = await updateRedFlagStatus(sessionB, targetFlag!.id, "APPROVED");
            expect(result).toBeNull();
        });
    });
});
