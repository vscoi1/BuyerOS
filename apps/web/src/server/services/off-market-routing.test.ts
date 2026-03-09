import { describe, it, expect } from "vitest";
import { rankAgentsForSubmission } from "./matching-engine";

describe("Off-Market Routing Logic", () => {
    const mockAgents = [
        {
            id: "agent_1",
            name: "Agent One",
            clients: [
                {
                    budgetMin: 1_000_000,
                    budgetMax: 1_500_000,
                    targetSuburbs: ["Richmond", "Burnley"],
                },
            ],
        },
        {
            id: "agent_2",
            name: "Agent Two",
            clients: [
                {
                    budgetMin: 800_000,
                    budgetMax: 1_200_000,
                    targetSuburbs: ["Fitzroy", "Collingwood"],
                },
            ],
        },
    ];

    it("should rank Agent One highest for a Richmond submission", () => {
        const submission = {
            suburb: "Richmond",
            state: "VIC",
            askPrice: 1_200_000,
        };

        const results = rankAgentsForSubmission(submission, mockAgents);

        expect(results[0].agentId).toBe("agent_1");
        expect(results[0].bestScore).toBeGreaterThan(70);
        expect(results[0].reasons).toContain("Suburb aligned with brief (Richmond)");
    });

    it("should rank Agent Two highest for a Fitzroy submission", () => {
        const submission = {
            suburb: "Fitzroy",
            state: "VIC",
            askPrice: 1_100_000,
        };

        const results = rankAgentsForSubmission(submission, mockAgents);

        expect(results[0].agentId).toBe("agent_2");
        expect(results[0].bestScore).toBeGreaterThan(70);
    });

    it("should provide reasons when no match is found", () => {
        const submission = {
            suburb: "Bondi",
            state: "NSW",
            askPrice: 500_000,
        };

        const results = rankAgentsForSubmission(submission, mockAgents);

        // Base 10 + 8 (off-market) - 15 (penalty) = 3
        expect(results[0].bestScore).toBe(3);
    });
});
