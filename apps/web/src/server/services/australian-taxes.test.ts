import { describe, expect, it } from "vitest";
import { estimateStampDuty } from "./australian-taxes";

describe("estimateStampDuty", () => {
  it("calculates VIC duty with no surcharge", () => {
    const result = estimateStampDuty({
      state: "VIC",
      purchasePrice: 1000000,
      isForeignBuyer: false,
    });

    expect(result.baseDuty).toBeGreaterThan(0);
    expect(result.foreignSurcharge).toBe(0);
    expect(result.totalDuty).toBe(result.baseDuty);
  });

  it("adds foreign surcharge when applicable", () => {
    const result = estimateStampDuty({
      state: "NSW",
      purchasePrice: 900000,
      isForeignBuyer: true,
    });

    expect(result.foreignSurcharge).toBe(72000);
    expect(result.totalDuty).toBeGreaterThan(result.baseDuty);
  });
});
