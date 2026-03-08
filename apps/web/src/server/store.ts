import type { z } from "zod";
import type {
  briefParseInput,
  clientCreateInput,
  dueDiligenceRunInput,
  offMarketSubmitInput,
  portalFeedbackInput,
  propertyCreateInput,
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
  matchScore: number;
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
  createdAt: string;
};

export const db = {
  clients: [] as ClientRecord[],
  properties: [] as PropertyRecord[],
  offMarketSubmissions: [] as OffMarketRecord[],
  dueDiligenceReports: new Map<string, z.infer<typeof dueDiligenceRunInput> & { riskScore: number; flags: string[]; summary: string; createdAt: string }>(),
  portalFeedback: [] as Array<z.infer<typeof portalFeedbackInput> & { createdAt: string }>,
};

export function seedStore() {
  if (db.clients.length > 0) {
    return;
  }

  const baseClient: z.infer<typeof clientCreateInput> = {
    firstName: "Amelia",
    lastName: "Cooper",
    email: "amelia@example.com",
    budgetMin: 950000,
    budgetMax: 1200000,
    targetSuburbs: ["Brunswick", "Northcote"],
    briefSummary: "Owner-occupier, 2 bed minimum, close to tram and schools.",
  };

  db.clients.push({
    id: "client_demo_1",
    organizationId: "org_demo",
    agentId: "agent_demo_1",
    createdAt: new Date().toISOString(),
    ...baseClient,
  });

  const property: z.infer<typeof propertyCreateInput> = {
    clientId: "client_demo_1",
    address: "17 Albert St",
    suburb: "Brunswick",
    state: "VIC",
    postcode: "3056",
    price: 1110000,
    stage: "SHORTLISTED",
    isOffMarket: false,
  };

  db.properties.push({
    id: "property_demo_1",
    organizationId: "org_demo",
    agentId: "agent_demo_1",
    matchScore: 87,
    createdAt: new Date().toISOString(),
    ...property,
  });

  const offMarket: z.infer<typeof offMarketSubmitInput> = {
    sellingAgent: "Olivia Grant",
    agency: "Bayside Realty",
    address: "8 Cedar Cl",
    suburb: "Ryde",
    state: "NSW",
    postcode: "2112",
    askPrice: 1820000,
  };

  db.offMarketSubmissions.push({
    id: "off_market_demo_1",
    organizationId: "org_demo",
    status: "NEW",
    createdAt: new Date().toISOString(),
    ...offMarket,
  });

  const parsedBrief: z.infer<typeof briefParseInput> = {
    sourceText:
      "Client is looking in Brunswick or Northcote, budget up to 1.2m, needs at least 2 bedrooms and close transport.",
  };

  void parsedBrief;
}

seedStore();
