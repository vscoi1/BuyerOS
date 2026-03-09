import { describe, expect, it, beforeEach } from "vitest";
import {
    attachComplianceEvidence,
    getComplianceChecklist,
    migrateComplianceChecklist
} from "./data-access";
import { db, seedStore } from "../store";

describe("compliance evidence and migration", () => {
    const session = {
        organizationId: "org_demo",
        user: {
            id: "agent_demo_agent",
            email: "agent@demo.com",
            name: "Agent",
            role: "AGENT" as const,
        }
    };

    beforeEach(() => {
        // Reset DB
        db.complianceChecklists = [];
        seedStore();
    });

    it("attaches evidence to a checklist item", async () => {
        // 1. Initialise
        await getComplianceChecklist(session, { state: "NSW" });

        // 2. Attach evidence
        const result = await attachComplianceEvidence(session, {
            state: "NSW",
            code: "NSW-01",
            fileName: "authority.pdf",
            url: "https://storage.example.com/authority.pdf"
        });

        expect(result).not.toBeNull();
        const item = result?.items.find(i => i.code === "NSW-01");
        expect(item?.attachments).toHaveLength(1);
        expect(item?.attachments[0].fileName).toBe("authority.pdf");
    });

    it("migrates a checklist to current policy version", async () => {
        // 1. Setup a "stale" checklist in memory
        db.complianceChecklists.push({
            organizationId: "org_demo",
            state: "NSW",
            policyVersion: "2024.01", // Old version
            items: [
                {
                    code: "NSW-01",
                    label: "Old Label",
                    completed: true,
                    evidenceNote: "Done",
                    attachments: [{ fileName: "old.pdf", url: "...", createdAt: "..." }]
                }
            ],
            updatedAt: new Date().toISOString()
        });

        // 2. Migrate
        const result = await migrateComplianceChecklist(session, "NSW");

        // 3. Verify labels are updated but progress/evidence is kept
        expect(result.policyVersion).toBe("2026.03"); // Current master version
        const item = result.items.find(i => i.code === "NSW-01");
        expect(item?.label).toBe("Agency authority and buyer representation confirmed"); // New label
        expect(item?.completed).toBe(true);
        expect(item?.evidenceNote).toBe("Done");
        expect(item?.attachments).toHaveLength(1);

        // Verify new items from template are added
        expect(result.items.length).toBeGreaterThan(1);
    });
});
