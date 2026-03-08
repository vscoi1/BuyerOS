import { describe, expect, it } from "vitest";
import { computePropertyMatchScore } from "./scoring";

describe("computePropertyMatchScore", () => {
  it("rewards suburb and budget fit", () => {
    const score = computePropertyMatchScore({
      suburb: "Brunswick",
      targetSuburbs: ["Brunswick", "Northcote"],
      budgetMin: 900000,
      budgetMax: 1200000,
      price: 1050000,
      isOffMarket: false,
      isOffMarketPreferred: false,
    });

    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("penalizes budget miss", () => {
    const score = computePropertyMatchScore({
      suburb: "Brunswick",
      targetSuburbs: ["Brunswick", "Northcote"],
      budgetMin: 900000,
      budgetMax: 1200000,
      price: 1800000,
      isOffMarket: false,
      isOffMarketPreferred: false,
    });

    expect(score).toBeLessThan(80);
  });
});
