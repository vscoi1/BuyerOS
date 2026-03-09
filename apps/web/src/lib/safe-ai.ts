export const SAFE_AI_COPY = {
  global: {
    title: "Decision support only",
    body: "BuyerOS provides operational insights for licensed buyers' agents. It does not provide legal, financial, or credit advice.",
  },
  briefParser: {
    title: "Draft brief extraction",
    body: "Review and correct extracted fields before using them in client recommendations.",
  },
  dueDiligence: {
    title: "Preliminary risk indicators",
    body: "This summary is operational intelligence only. Confirm legal implications with a licensed conveyancer or solicitor before client communication.",
  },
  redFlags: {
    title: "Review required",
    body: "Extracted findings remain unreviewed until approved by an authorized agent.",
  },
  dealKiller: {
    title: "Client-ready output gate",
    body: "Risk reports use approved findings only. Pending findings must be reviewed before sharing conclusions with clients.",
  },
  assistant: {
    title: "Assistant scope",
    body: "The assistant can navigate data and workflows. It cannot provide legal advice, personal financial advice, or credit recommendations.",
  },
} as const;
