import { describe, expect, it } from "vitest";
import { canAccessRecord } from "./permissions";

describe("canAccessRecord", () => {
  it("allows owner in same organization", () => {
    expect(
      canAccessRecord(
        { organizationId: "org-1", actorAgentId: "agent-1" },
        { organizationId: "org-1", ownerAgentId: "agent-1" },
      ),
    ).toBe(true);
  });

  it("blocks cross-org access", () => {
    expect(
      canAccessRecord(
        { organizationId: "org-1", actorAgentId: "agent-1" },
        { organizationId: "org-2", ownerAgentId: "agent-1" },
      ),
    ).toBe(false);
  });

  it("blocks different owner in same org", () => {
    expect(
      canAccessRecord(
        { organizationId: "org-1", actorAgentId: "agent-1" },
        { organizationId: "org-1", ownerAgentId: "agent-2" },
      ),
    ).toBe(false);
  });
});
