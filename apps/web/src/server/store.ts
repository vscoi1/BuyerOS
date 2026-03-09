import type { z } from "zod";
import type {
  briefParseInput,
  dueDiligenceRunInput,
  portalFeedbackInput,
} from "@/server/validators";

export interface SessionContext {
  organizationId: string;
  agentId: string;
}

export type ClientRecord = {
  id: string;
  organizationId: string;
  agentId: string;
  firstName: string;
  lastName: string;
  email: string;
  budgetMin: number;
  budgetMax: number;
  targetSuburbs: string[];
  briefSummary: string;
  createdAt: string;
};

export type PropertyRecord = {
  id: string;
  organizationId: string;
  agentId: string;
  clientId?: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  price?: number;
  stage: string;
  isOffMarket: boolean;
  source: "MANUAL" | "WHISPER_NETWORK";
  matchScore: number;
  createdAt: string;
};

export type DealKillerReportRecord = {
  id: string;
  propertyId: string;
  overallRisk: "LOW" | "MODERATE" | "HIGH" | "CATASTROPHIC";
  summary: string;
  dealKillers: string[];
  generatedAt: string;
};

export type AgentRecord = {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: "ADMIN" | "AGENT" | "ASSISTANT";
  stateFocus: string[];
  createdAt: string;
};

export type OffMarketRecord = {
  id: string;
  organizationId: string;
  sellingAgent: string;
  agency: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  askPrice?: number;
  status: "NEW" | "ASSIGNED";
  assignedAgentId?: string;
  assignedAt?: string;
  createdAt: string;
};

export type DocumentRecord = {
  id: string;
  propertyId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  uploadedAt: string;
};

export type DocumentRedFlagRecord = {
  id: string;
  documentId: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  content: string;
  status: "UNREVIEWED" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export type ComplianceChecklistItemRecord = {
  code: string;
  label: string;
  completed: boolean;
  evidenceNote?: string;
  attachments: { fileName: string; url: string; createdAt: string }[];
  completedAt?: string;
  completedBy?: string;
};

export type ComplianceChecklistRecord = {
  organizationId: string;
  state: "NSW" | "VIC";
  policyVersion: string;
  items: ComplianceChecklistItemRecord[];
  updatedAt: string;
};

export const db = {
  agents: [] as AgentRecord[],
  clients: [] as ClientRecord[],
  properties: [] as PropertyRecord[],
  offMarketSubmissions: [] as OffMarketRecord[],
  complianceChecklists: [] as ComplianceChecklistRecord[],
  dueDiligenceReports: new Map<string, z.infer<typeof dueDiligenceRunInput> & { riskScore: number; flags: string[]; summary: string; status: "PENDING" | "COMPLETED" | "FAILED"; lastFetchedAt?: string; createdAt: string }>(),
  portalFeedback: [] as Array<z.infer<typeof portalFeedbackInput> & { createdAt: string }>,
  documents: [] as DocumentRecord[],
  documentRedFlags: [] as DocumentRedFlagRecord[],
  dealKillerReports: [] as DealKillerReportRecord[],
};

/**
 * Seeds 3 demo clients — one per demo user (Admin, Agent, Assistant) — so every
 * login persona lands on a meaningful, populated dashboard.
 *
 * All records belong to "org_demo" and are assigned to the corresponding demo agentId
 * so that listClients / listProperties (which filter by agentId) show data for each user.
 */
export function seedStore() {
  if (db.clients.length > 0) {
    return;
  }

  // ─── Agents ─────────────────────────────────────────────────────────────
  db.agents.push({
    id: "agent_demo_admin",
    organizationId: "org_demo",
    email: "alex@demo.com",
    name: "Alex Chen",
    role: "ADMIN",
    stateFocus: ["NSW", "VIC"],
    createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
  });

  db.agents.push({
    id: "agent_demo_agent",
    organizationId: "org_demo",
    email: "sarah@demo.com",
    name: "Sarah Williams",
    role: "AGENT",
    stateFocus: ["NSW"],
    createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
  });

  db.agents.push({
    id: "agent_demo_assistant",
    organizationId: "org_demo",
    email: "jordan@demo.com",
    name: "Jordan Lee",
    role: "ASSISTANT",
    stateFocus: ["VIC"],
    createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
  });

  // ─── Client 1: Amelia Cooper — Alex Chen (Admin) ─────────────────────────
  db.clients.push({
    id: "client_demo_1",
    organizationId: "org_demo",
    agentId: "agent_demo_admin",
    createdAt: new Date(Date.now() - 14 * 86400_000).toISOString(),
    firstName: "Amelia",
    lastName: "Cooper",
    email: "amelia.cooper@example.com",
    budgetMin: 950_000,
    budgetMax: 1_200_000,
    targetSuburbs: ["Brunswick", "Northcote"],
    briefSummary: "Owner-occupier, 2 bed minimum, close to tram and schools.",
  });

  db.properties.push({
    id: "property_demo_1",
    organizationId: "org_demo",
    agentId: "agent_demo_admin",
    clientId: "client_demo_1",
    address: "17 Albert St",
    suburb: "Brunswick",
    state: "VIC",
    postcode: "3056",
    price: 1_110_000,
    stage: "SHORTLISTED",
    isOffMarket: false,
    source: "MANUAL",
    matchScore: 87,
    createdAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
  });

  db.properties.push({
    id: "property_demo_2",
    organizationId: "org_demo",
    agentId: "agent_demo_admin",
    clientId: "client_demo_1",
    address: "42 Merri Parade",
    suburb: "Northcote",
    state: "VIC",
    postcode: "3070",
    price: 1_050_000,
    stage: "INSPECTED",
    isOffMarket: false,
    source: "MANUAL",
    matchScore: 74,
    createdAt: new Date(Date.now() - 8 * 86400_000).toISOString(),
  });

  // ─── Client 2: James Patel — Sarah Williams (Agent) ─────────────────────
  db.clients.push({
    id: "client_demo_2",
    organizationId: "org_demo",
    agentId: "agent_demo_agent",
    createdAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
    firstName: "James",
    lastName: "Patel",
    email: "james.patel@example.com",
    budgetMin: 1_400_000,
    budgetMax: 1_800_000,
    targetSuburbs: ["Mosman", "Cremorne", "Neutral Bay"],
    briefSummary: "Investment property, 3 bed+, harbour views preferred, NSW inner-north.",
  });

  db.properties.push({
    id: "property_demo_3",
    organizationId: "org_demo",
    agentId: "agent_demo_agent",
    clientId: "client_demo_2",
    address: "9 Royalist Rd",
    suburb: "Mosman",
    state: "NSW",
    postcode: "2088",
    price: 1_650_000,
    stage: "DUE_DILIGENCE",
    isOffMarket: false,
    source: "MANUAL",
    matchScore: 92,
    createdAt: new Date(Date.now() - 6 * 86400_000).toISOString(),
  });

  // ─── Client 3: Sophie Nguyen — Jordan Lee (Assistant) ───────────────────
  db.clients.push({
    id: "client_demo_3",
    organizationId: "org_demo",
    agentId: "agent_demo_assistant",
    createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
    firstName: "Sophie",
    lastName: "Nguyen",
    email: "sophie.nguyen@example.com",
    budgetMin: 700_000,
    budgetMax: 900_000,
    targetSuburbs: ["Fitzroy", "Collingwood", "Abbotsford"],
    briefSummary: "First home buyer, 2 bed, needs renovation potential, inner-east Melbourne.",
  });

  db.properties.push({
    id: "property_demo_4",
    organizationId: "org_demo",
    agentId: "agent_demo_assistant",
    clientId: "client_demo_3",
    address: "3 Smith St",
    suburb: "Fitzroy",
    state: "VIC",
    postcode: "3065",
    price: 860_000,
    stage: "SEARCHING",
    isOffMarket: false,
    source: "MANUAL",
    matchScore: 68,
    createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
  });

  // ─── Off-market submissions — visible to whole org ───────────────────────
  db.offMarketSubmissions.push({
    id: "off_market_demo_1",
    organizationId: "org_demo",
    sellingAgent: "Olivia Grant",
    agency: "Bayside Realty",
    address: "8 Cedar Cl",
    suburb: "Ryde",
    state: "NSW",
    postcode: "2112",
    askPrice: 1_820_000,
    status: "NEW",
    createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
  });

  db.offMarketSubmissions.push({
    id: "off_market_demo_2",
    organizationId: "org_demo",
    sellingAgent: "Marcus Li",
    agency: "InnerWest Property Group",
    address: "27 Norton St",
    suburb: "Leichhardt",
    state: "NSW",
    postcode: "2040",
    askPrice: 1_295_000,
    status: "ASSIGNED",
    assignedAgentId: "agent_demo_agent",
    createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
  });

  const parsedBrief: z.infer<typeof briefParseInput> = {
    sourceText:
      "Client is looking in Brunswick or Northcote, budget up to 1.2m, needs at least 2 bedrooms and close transport.",
  };

  void parsedBrief;

  // ─── Test Data for The Deal Killer ────────────────────────────────────────
  db.properties.push({
    id: "property_demo_dk_1",
    organizationId: "org_demo",
    agentId: "agent_demo_admin",
    clientId: "client_demo_1",
    address: "88 Sydney Rd",
    suburb: "Brunswick",
    state: "VIC",
    postcode: "3056",
    price: 1_050_000,
    stage: "DUE_DILIGENCE",
    isOffMarket: false,
    source: "MANUAL",
    matchScore: 89,
    createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
  });

  db.documents.push({
    id: "doc_demo_dk_1",
    propertyId: "property_demo_dk_1",
    fileName: "Strata_Inspection_Report.pdf",
    storageKey: "mock-key",
    mimeType: "application/pdf",
    sizeBytes: 2048000,
    status: "COMPLETED",
    uploadedAt: new Date().toISOString(),
  });

  db.documentRedFlags.push({
    id: "flag_demo_dk_1",
    documentId: "doc_demo_dk_1",
    severity: "HIGH",
    category: "STRUCTURAL",
    content: "Severe concrete spalling in basement parking level. Immediate rectification recommended ($400k+ estimate).",
    status: "UNREVIEWED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.documentRedFlags.push({
    id: "flag_demo_dk_2",
    documentId: "doc_demo_dk_1",
    severity: "HIGH",
    category: "LEGAL",
    content: "Unapproved balcony enclosures on levels 4-6 subject to current council rectification order.",
    status: "UNREVIEWED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.documentRedFlags.push({
    id: "flag_demo_dk_3",
    documentId: "doc_demo_dk_1",
    severity: "MEDIUM",
    category: "FINANCIAL",
    content: "Sinking fund balance is severely depleted ($12,000) for a building of this age.",
    status: "UNREVIEWED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.properties.push({
    id: "property_demo_dk_2",
    organizationId: "org_demo",
    agentId: "agent_demo_agent",
    clientId: "client_demo_2",
    address: "140a Spit Rd",
    suburb: "Mosman",
    state: "NSW",
    postcode: "2088",
    price: 1_700_000,
    stage: "DUE_DILIGENCE",
    isOffMarket: false,
    source: "MANUAL",
    matchScore: 95,
    createdAt: new Date(Date.now() - 1 * 86400_000).toISOString(),
  });

  db.documents.push({
    id: "doc_demo_dk_2",
    propertyId: "property_demo_dk_2",
    fileName: "Building_and_Pest.pdf",
    storageKey: "mock-key-2",
    mimeType: "application/pdf",
    sizeBytes: 1548000,
    status: "COMPLETED",
    uploadedAt: new Date().toISOString(),
  });

  db.documentRedFlags.push({
    id: "flag_demo_dk_4",
    documentId: "doc_demo_dk_2",
    severity: "HIGH",
    category: "PEST",
    content: "Active subterranean termite infestation detected in subfloor and eastern load-bearing wall.",
    status: "UNREVIEWED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // ─── Test Data for The Whisper Network ────────────────────────────────────
  db.properties.push({
    id: "property_demo_whisper_1",
    organizationId: "org_demo",
    agentId: "agent_demo_admin",
    clientId: "client_demo_1", // Auto-matched
    address: "12 Secret Lane",
    suburb: "Brunswick East",
    state: "VIC",
    postcode: "3057",
    price: 1_150_000,
    stage: "SEARCHING",
    isOffMarket: true,
    source: "WHISPER_NETWORK",
    matchScore: 98,
    createdAt: new Date().toISOString(),
  });
}

seedStore();
