export type ComplianceState = "NSW" | "VIC";

interface ChecklistItem {
  code: string;
  label: string;
}

interface ComplianceChecklist {
  state: ComplianceState;
  policyVersion: string;
  items: ChecklistItem[];
}

const checklistByState: Record<ComplianceState, ComplianceChecklist> = {
  NSW: {
    state: "NSW",
    policyVersion: "2026.03",
    items: [
      { code: "NSW-01", label: "Agency authority and buyer representation confirmed" },
      { code: "NSW-02", label: "Contract reviewed by legal representative before exchange" },
      { code: "NSW-03", label: "Cooling-off and auction condition disclosures recorded" },
    ],
  },
  VIC: {
    state: "VIC",
    policyVersion: "2026.03",
    items: [
      { code: "VIC-01", label: "Section 32 review recorded and acknowledged" },
      { code: "VIC-02", label: "Due diligence risk summary delivered with evidence" },
      { code: "VIC-03", label: "Auction authority and bidding strategy consent captured" },
    ],
  },
};

export function getChecklistForState(state: ComplianceState): ComplianceChecklist {
  return checklistByState[state];
}

export function supportedStates(): ComplianceState[] {
  return Object.keys(checklistByState) as ComplianceState[];
}
