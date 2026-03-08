import { describe, expect, it } from "vitest";
import { getChecklistForState, supportedStates } from "./compliance";

describe("compliance", () => {
  it("supports NSW and VIC", () => {
    expect(supportedStates()).toEqual(["NSW", "VIC"]);
  });

  it("returns non-empty checklist", () => {
    const checklist = getChecklistForState("NSW");
    expect(checklist.items.length).toBeGreaterThan(0);
    expect(checklist.policyVersion).toMatch(/^2026\./);
  });
});
