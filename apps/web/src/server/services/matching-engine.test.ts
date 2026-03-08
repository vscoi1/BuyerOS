import { describe, expect, it } from "vitest";
import { calculatePropertyMatch } from "./matching-engine";

describe("calculatePropertyMatch", () => {
  it("returns strong/perfect score for suburb and budget fit", () => {
    const result = calculatePropertyMatch({
      suburb: "Brunswick",
      state: "VIC",
      targetSuburbs: ["Brunswick", "Northcote"],
      targetStates: ["VIC"],
      budgetMin: 900000,
      budgetMax: 1200000,
      price: 1050000,
      isOffMarket: false,
      isOffMarketPreferred: false,
      urgency: "HOT",
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(["STRONG", "PERFECT"]).toContain(result.category);
    expect(result.reasons.length).toBeGreaterThan(1);
  });

  it("penalizes properties far outside budget", () => {
    const result = calculatePropertyMatch({
      suburb: "Brunswick",
      state: "VIC",
      targetSuburbs: ["Brunswick"],
      targetStates: ["VIC"],
      budgetMin: 850000,
      budgetMax: 1100000,
      price: 1900000,
      isOffMarket: false,
      isOffMarketPreferred: false,
      urgency: "CASUAL",
    });

    expect(result.score).toBeLessThan(70);
  });
});
