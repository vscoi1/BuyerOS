import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { db } from "@/server/store";
import { getChecklistForState, type ComplianceState } from "@/server/services/compliance";
import type {
  clientCreateInput,
  complianceChecklistUpdateItemInput,
  complianceStateInput,
  clientUpdateInput,
  dueDiligenceRunInput,
  documentUploadInitiateInput,
  offMarketSubmitInput,
  portalFeedbackInput,
  propertyCreateInput,
  propertyListInput,
} from "@/server/validators";
import type { z } from "zod";

interface SessionInput {
  organizationId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "AGENT" | "ASSISTANT";
  };
}

type ClientCreate = z.infer<typeof clientCreateInput>;
type ClientUpdate = z.infer<typeof clientUpdateInput>;
type PropertyCreate = z.infer<typeof propertyCreateInput>;
type PropertyList = z.infer<typeof propertyListInput>;
type OffMarketCreate = z.infer<typeof offMarketSubmitInput>;
type DueDiligenceRun = z.infer<typeof dueDiligenceRunInput>;
type PortalFeedback = z.infer<typeof portalFeedbackInput>;
type DocumentUploadInitiate = z.infer<typeof documentUploadInitiateInput>;
type ComplianceChecklistStateInput = z.infer<typeof complianceStateInput>;
type ComplianceChecklistUpdateItemInput = z.infer<typeof complianceChecklistUpdateItemInput>;

export type PersistedClient = {
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

export type PersistedProperty = {
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

export type PersistedOffMarketSubmission = {
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

export type PersistedDueDiligenceReport = DueDiligenceRun & {
  riskScore: number;
  flags: string[];
  summary: string;
  createdAt: string;
};

export type PersistedComplianceChecklistItem = {
  code: string;
  label: string;
  completed: boolean;
  evidenceNote?: string;
  completedAt?: string;
  completedBy?: string;
};

export type PersistedComplianceChecklist = {
  state: ComplianceState;
  policyVersion: string;
  items: PersistedComplianceChecklistItem[];
  updatedAt: string;
};

async function ensureActor(prisma: PrismaClient, session: SessionInput): Promise<void> {
  await prisma.organization.upsert({
    where: { id: session.organizationId },
    update: {},
    create: {
      id: session.organizationId,
      name: "BuyerOS Demo Org",
      slug: `org-${session.organizationId}`,
    },
  });

  await prisma.agent.upsert({
    where: { id: session.user.id },
    update: {
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      organizationId: session.organizationId,
    },
    create: {
      id: session.user.id,
      organizationId: session.organizationId,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      stateFocus: ["NSW", "VIC"],
    },
  });
}

async function runWithFallback<T>(
  session: SessionInput,
  persistent: (prisma: PrismaClient) => Promise<T>,
  memory: () => T,
): Promise<T> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return memory();
  }

  try {
    await ensureActor(prisma, session);
    return await persistent(prisma);
  } catch (error) {
    console.error("Persistence fallback to in-memory store", error);
    return memory();
  }
}

function briefSummaryFromJson(briefJson: unknown): string {
  if (!briefJson || typeof briefJson !== "object") {
    return "";
  }

  const summary = (briefJson as { summary?: unknown }).summary;
  return typeof summary === "string" ? summary : "";
}

function mapClientRecord(client: {
  id: string;
  organizationId: string;
  agentId: string;
  firstName: string;
  lastName: string;
  email: string;
  budgetMin: number;
  budgetMax: number;
  targetSuburbs: string[];
  briefJson: unknown;
  createdAt: Date;
}): PersistedClient {
  return {
    id: client.id,
    organizationId: client.organizationId,
    agentId: client.agentId,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    budgetMin: client.budgetMin,
    budgetMax: client.budgetMax,
    targetSuburbs: client.targetSuburbs,
    briefSummary: briefSummaryFromJson(client.briefJson),
    createdAt: client.createdAt.toISOString(),
  };
}

function mapPropertyRecord(property: {
  id: string;
  organizationId: string;
  agentId: string;
  clientId: string | null;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  price: number | null;
  stage: string;
  isOffMarket: boolean;
  matchScore: number | null;
  createdAt: Date;
}): PersistedProperty {
  return {
    id: property.id,
    organizationId: property.organizationId,
    agentId: property.agentId,
    clientId: property.clientId ?? undefined,
    address: property.address,
    suburb: property.suburb,
    state: property.state,
    postcode: property.postcode,
    price: property.price ?? undefined,
    stage: property.stage,
    isOffMarket: property.isOffMarket,
    matchScore: property.matchScore ?? 0,
    createdAt: property.createdAt.toISOString(),
  };
}

function buildChecklistItems(state: ComplianceState): PersistedComplianceChecklistItem[] {
  return getChecklistForState(state).items.map((item) => ({
    code: item.code,
    label: item.label,
    completed: false,
  }));
}

function normaliseChecklistItems(
  state: ComplianceState,
  itemsJson: unknown,
): PersistedComplianceChecklistItem[] {
  const template = getChecklistForState(state).items;
  const existingByCode = new Map<string, PersistedComplianceChecklistItem>();

  if (Array.isArray(itemsJson)) {
    for (const item of itemsJson) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const asRecord = item as Record<string, unknown>;
      if (typeof asRecord.code !== "string") {
        continue;
      }
      existingByCode.set(asRecord.code, {
        code: asRecord.code,
        label: typeof asRecord.label === "string" ? asRecord.label : "",
        completed: asRecord.completed === true,
        evidenceNote:
          typeof asRecord.evidenceNote === "string" && asRecord.evidenceNote.length > 0
            ? asRecord.evidenceNote
            : undefined,
        completedAt:
          typeof asRecord.completedAt === "string" && asRecord.completedAt.length > 0
            ? asRecord.completedAt
            : undefined,
        completedBy:
          typeof asRecord.completedBy === "string" && asRecord.completedBy.length > 0
            ? asRecord.completedBy
            : undefined,
      });
    }
  }

  return template.map((templateItem) => {
    const existing = existingByCode.get(templateItem.code);
    return {
      code: templateItem.code,
      label: templateItem.label,
      completed: existing?.completed ?? false,
      evidenceNote: existing?.evidenceNote,
      completedAt: existing?.completedAt,
      completedBy: existing?.completedBy,
    };
  });
}

export async function listClients(session: SessionInput): Promise<PersistedClient[]> {
  return runWithFallback(
    session,
    async (prisma) => {
      const rows = await prisma.client.findMany({
        where: {
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(mapClientRecord);
    },
    () =>
      db.clients.filter(
        (client) =>
          client.organizationId === session.organizationId && client.agentId === session.user.id,
      ),
  );
}

export async function getClient(session: SessionInput, id: string): Promise<PersistedClient | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const row = await prisma.client.findFirst({
        where: {
          id,
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
      });
      return row ? mapClientRecord(row) : null;
    },
    () =>
      db.clients.find(
        (client) =>
          client.id === id &&
          client.organizationId === session.organizationId &&
          client.agentId === session.user.id,
      ) ?? null,
  );
}

export async function createClient(
  session: SessionInput,
  input: ClientCreate,
): Promise<PersistedClient> {
  return runWithFallback(
    session,
    async (prisma) => {
      const row = await prisma.client.create({
        data: {
          organizationId: session.organizationId,
          agentId: session.user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          budgetMin: input.budgetMin,
          budgetMax: input.budgetMax,
          targetSuburbs: input.targetSuburbs,
          briefJson: {
            summary: input.briefSummary,
          },
        },
      });
      return mapClientRecord(row);
    },
    () => {
      const client = {
        id: crypto.randomUUID(),
        organizationId: session.organizationId,
        agentId: session.user.id,
        createdAt: new Date().toISOString(),
        ...input,
      };
      db.clients.unshift(client);
      return client;
    },
  );
}

export async function updateClient(
  session: SessionInput,
  input: ClientUpdate,
): Promise<PersistedClient | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const existing = await prisma.client.findFirst({
        where: {
          id: input.id,
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
      });

      if (!existing) {
        return null;
      }

      const row = await prisma.client.update({
        where: { id: existing.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          budgetMin: input.budgetMin,
          budgetMax: input.budgetMax,
          targetSuburbs: input.targetSuburbs,
          briefJson: input.briefSummary
            ? {
                summary: input.briefSummary,
              }
            : undefined,
        },
      });

      return mapClientRecord(row);
    },
    () => {
      const index = db.clients.findIndex(
        (client) =>
          client.id === input.id &&
          client.organizationId === session.organizationId &&
          client.agentId === session.user.id,
      );

      if (index === -1) {
        return null;
      }

      const updated = {
        ...db.clients[index],
        ...input,
      };
      db.clients[index] = updated;
      return updated;
    },
  );
}

export async function listProperties(
  session: SessionInput,
  input: PropertyList,
): Promise<PersistedProperty[]> {
  return runWithFallback(
    session,
    async (prisma) => {
      const rows = await prisma.property.findMany({
        where: {
          organizationId: session.organizationId,
          agentId: session.user.id,
          clientId: input.clientId,
          stage: input.stage,
        },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(mapPropertyRecord);
    },
    () =>
      db.properties.filter((property) => {
        if (property.organizationId !== session.organizationId) {
          return false;
        }
        if (property.agentId !== session.user.id) {
          return false;
        }
        if (input.clientId && property.clientId !== input.clientId) {
          return false;
        }
        if (input.stage && property.stage !== input.stage) {
          return false;
        }
        return true;
      }),
  );
}

export async function getProperty(
  session: SessionInput,
  propertyId: string,
): Promise<PersistedProperty | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const row = await prisma.property.findFirst({
        where: {
          id: propertyId,
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
      });
      return row ? mapPropertyRecord(row) : null;
    },
    () =>
      db.properties.find(
        (property) =>
          property.id === propertyId &&
          property.organizationId === session.organizationId &&
          property.agentId === session.user.id,
      ) ?? null,
  );
}

export async function createProperty(
  session: SessionInput,
  input: PropertyCreate,
): Promise<PersistedProperty> {
  return runWithFallback(
    session,
    async (prisma) => {
      const row = await prisma.property.create({
        data: {
          organizationId: session.organizationId,
          agentId: session.user.id,
          clientId: input.clientId,
          address: input.address,
          suburb: input.suburb,
          state: input.state,
          postcode: input.postcode,
          price: input.price,
          stage: input.stage,
          isOffMarket: input.isOffMarket,
          matchScore: 0,
        },
      });
      return mapPropertyRecord(row);
    },
    () => {
      const property = {
        id: crypto.randomUUID(),
        organizationId: session.organizationId,
        agentId: session.user.id,
        matchScore: 0,
        createdAt: new Date().toISOString(),
        ...input,
      };
      db.properties.unshift(property);
      return property;
    },
  );
}

export async function updateProperty(
  session: SessionInput,
  input: Partial<PropertyCreate> & { id: string },
): Promise<PersistedProperty | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const existing = await prisma.property.findFirst({
        where: {
          id: input.id,
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
      });
      if (!existing) {
        return null;
      }

      const row = await prisma.property.update({
        where: { id: existing.id },
        data: {
          clientId: input.clientId,
          address: input.address,
          suburb: input.suburb,
          state: input.state,
          postcode: input.postcode,
          price: input.price,
          stage: input.stage,
          isOffMarket: input.isOffMarket,
        },
      });

      return mapPropertyRecord(row);
    },
    () => {
      const index = db.properties.findIndex(
        (property) =>
          property.id === input.id &&
          property.organizationId === session.organizationId &&
          property.agentId === session.user.id,
      );
      if (index === -1) {
        return null;
      }
      const updated = {
        ...db.properties[index],
        ...input,
      };
      db.properties[index] = updated;
      return updated;
    },
  );
}

export async function updatePropertyMatchScore(
  session: SessionInput,
  propertyId: string,
  matchScore: number,
): Promise<PersistedProperty | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const existing = await prisma.property.findFirst({
        where: {
          id: propertyId,
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
      });
      if (!existing) {
        return null;
      }
      const row = await prisma.property.update({
        where: { id: existing.id },
        data: {
          matchScore,
        },
      });
      return mapPropertyRecord(row);
    },
    () => {
      const property = db.properties.find(
        (row) =>
          row.id === propertyId &&
          row.organizationId === session.organizationId &&
          row.agentId === session.user.id,
      );
      if (!property) {
        return null;
      }
      property.matchScore = matchScore;
      return property;
    },
  );
}

export async function saveDueDiligence(
  session: SessionInput,
  propertyId: string,
  record: PersistedDueDiligenceReport,
): Promise<PersistedDueDiligenceReport | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
      });
      if (!property) {
        return null;
      }

      const row = await prisma.dueDiligenceReport.upsert({
        where: { propertyId },
        create: {
          propertyId,
          floodRisk: record.floodRisk,
          bushfireRisk: record.bushfireRisk,
          zoningChangeFlag: record.zoningChangeFlag,
          recentComparableDeltaPct: record.recentComparableDeltaPct,
          riskScore: record.riskScore,
          flagsJson: record.flags,
          summary: record.summary,
        },
        update: {
          floodRisk: record.floodRisk,
          bushfireRisk: record.bushfireRisk,
          zoningChangeFlag: record.zoningChangeFlag,
          recentComparableDeltaPct: record.recentComparableDeltaPct,
          riskScore: record.riskScore,
          flagsJson: record.flags,
          summary: record.summary,
        },
      });

      return {
        propertyId: row.propertyId,
        floodRisk: row.floodRisk as "LOW" | "MEDIUM" | "HIGH",
        bushfireRisk: row.bushfireRisk as "LOW" | "MEDIUM" | "HIGH",
        zoningChangeFlag: row.zoningChangeFlag,
        recentComparableDeltaPct: row.recentComparableDeltaPct,
        riskScore: row.riskScore,
        flags: Array.isArray(row.flagsJson) ? (row.flagsJson as string[]) : [],
        summary: row.summary,
        createdAt: row.createdAt.toISOString(),
      };
    },
    () => {
      db.dueDiligenceReports.set(propertyId, record);
      return record;
    },
  );
}

export async function getDueDiligence(
  session: SessionInput,
  propertyId: string,
): Promise<PersistedDueDiligenceReport | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
      });
      if (!property) {
        return null;
      }

      const row = await prisma.dueDiligenceReport.findUnique({ where: { propertyId } });
      if (!row) {
        return null;
      }

      return {
        propertyId: row.propertyId,
        floodRisk: row.floodRisk as "LOW" | "MEDIUM" | "HIGH",
        bushfireRisk: row.bushfireRisk as "LOW" | "MEDIUM" | "HIGH",
        zoningChangeFlag: row.zoningChangeFlag,
        recentComparableDeltaPct: row.recentComparableDeltaPct,
        riskScore: row.riskScore,
        flags: Array.isArray(row.flagsJson) ? (row.flagsJson as string[]) : [],
        summary: row.summary,
        createdAt: row.createdAt.toISOString(),
      };
    },
    () => db.dueDiligenceReports.get(propertyId) ?? null,
  );
}

export async function createOffMarketSubmission(
  session: SessionInput,
  input: OffMarketCreate,
): Promise<PersistedOffMarketSubmission> {
  return runWithFallback<PersistedOffMarketSubmission>(
    session,
    async (prisma) => {
      const row = await prisma.offMarketSubmission.create({
        data: {
          organizationId: session.organizationId,
          sellingAgent: input.sellingAgent,
          agency: input.agency,
          address: input.address,
          suburb: input.suburb,
          state: input.state,
          postcode: input.postcode,
          askPrice: input.askPrice,
          status: "NEW",
        },
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        sellingAgent: row.sellingAgent,
        agency: row.agency,
        address: row.address,
        suburb: row.suburb,
        state: row.state,
        postcode: row.postcode,
        askPrice: row.askPrice ?? undefined,
        status: row.status === "ASSIGNED" ? "ASSIGNED" : "NEW",
        assignedAgentId: row.assignedAgentId ?? undefined,
        createdAt: row.createdAt.toISOString(),
      };
    },
    () => {
      const submission = {
        id: crypto.randomUUID(),
        organizationId: session.organizationId,
        status: "NEW" as const,
        createdAt: new Date().toISOString(),
        ...input,
      };
      db.offMarketSubmissions.unshift(submission);
      return submission;
    },
  );
}

export async function listOffMarketSubmissions(
  session: SessionInput,
): Promise<PersistedOffMarketSubmission[]> {
  return runWithFallback<PersistedOffMarketSubmission[]>(
    session,
    async (prisma) => {
      const rows = await prisma.offMarketSubmission.findMany({
        where: {
          organizationId: session.organizationId,
        },
        orderBy: { createdAt: "desc" },
      });

      return rows.map((row: {
        id: string;
        organizationId: string;
        sellingAgent: string;
        agency: string;
        address: string;
        suburb: string;
        state: string;
        postcode: string;
        askPrice: number | null;
        status: string;
        assignedAgentId: string | null;
        createdAt: Date;
      }) => ({
        id: row.id,
        organizationId: row.organizationId,
        sellingAgent: row.sellingAgent,
        agency: row.agency,
        address: row.address,
        suburb: row.suburb,
        state: row.state,
        postcode: row.postcode,
        askPrice: row.askPrice ?? undefined,
        status: row.status === "ASSIGNED" ? "ASSIGNED" : "NEW",
        assignedAgentId: row.assignedAgentId ?? undefined,
        createdAt: row.createdAt.toISOString(),
      }));
    },
    () =>
      db.offMarketSubmissions.filter(
        (submission) => submission.organizationId === session.organizationId,
      ),
  );
}

export async function assignOffMarketSubmission(
  session: SessionInput,
  submissionId: string,
  agentId: string,
): Promise<PersistedOffMarketSubmission | null> {
  return runWithFallback<PersistedOffMarketSubmission | null>(
    session,
    async (prisma) => {
      const existing = await prisma.offMarketSubmission.findFirst({
        where: {
          id: submissionId,
          organizationId: session.organizationId,
        },
      });
      if (!existing) {
        return null;
      }

      const row = await prisma.offMarketSubmission.update({
        where: { id: existing.id },
        data: {
          status: "ASSIGNED",
          assignedAgentId: agentId,
        },
      });

      return {
        id: row.id,
        organizationId: row.organizationId,
        sellingAgent: row.sellingAgent,
        agency: row.agency,
        address: row.address,
        suburb: row.suburb,
        state: row.state,
        postcode: row.postcode,
        askPrice: row.askPrice ?? undefined,
        status: row.status === "ASSIGNED" ? "ASSIGNED" : "NEW",
        assignedAgentId: row.assignedAgentId ?? undefined,
        createdAt: row.createdAt.toISOString(),
      };
    },
    () => {
      const submission = db.offMarketSubmissions.find(
        (row) => row.id === submissionId && row.organizationId === session.organizationId,
      );
      if (!submission) {
        return null;
      }
      submission.assignedAgentId = agentId;
      submission.status = "ASSIGNED";
      return submission;
    },
  );
}

export async function createPortalSession(
  session: SessionInput,
  clientId: string,
): Promise<{ clientId: string; token: string; expiresAt: string }> {
  return runWithFallback(
    session,
    async (prisma) => {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
      });
      if (!client) {
        throw new Error("NOT_FOUND");
      }

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.portalSession.create({
        data: {
          clientId,
          tokenHash: token,
          expiresAt,
        },
      });
      return {
        clientId,
        token,
        expiresAt: expiresAt.toISOString(),
      };
    },
    () => {
      const token = crypto.randomUUID();
      return {
        clientId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    },
  );
}

export async function listPortalShortlist(
  session: SessionInput,
  clientId: string,
): Promise<PersistedProperty[]> {
  return runWithFallback(
    session,
    async (prisma) => {
      const rows = await prisma.property.findMany({
        where: {
          organizationId: session.organizationId,
          clientId,
        },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(mapPropertyRecord);
    },
    () =>
      db.properties.filter(
        (property) =>
          property.clientId === clientId && property.organizationId === session.organizationId,
      ),
  );
}

export async function listPortalMilestones(
  session: SessionInput,
  clientId: string,
): Promise<Array<{ propertyId: string; address: string; stage: string; updatedAt: string }>> {
  return runWithFallback(
    session,
    async (prisma) => {
      const rows = await prisma.property.findMany({
        where: {
          organizationId: session.organizationId,
          clientId,
        },
        orderBy: { updatedAt: "desc" },
      });

      return rows.map((property: {
        id: string;
        address: string;
        stage: string;
        updatedAt: Date;
      }) => ({
        propertyId: property.id,
        address: property.address,
        stage: property.stage,
        updatedAt: property.updatedAt.toISOString(),
      }));
    },
    () =>
      db.properties
        .filter(
          (property) =>
            property.clientId === clientId && property.organizationId === session.organizationId,
        )
        .map((property) => ({
          propertyId: property.id,
          address: property.address,
          stage: property.stage,
          updatedAt: property.createdAt,
        })),
  );
}

export async function createPortalFeedback(
  session: SessionInput,
  input: PortalFeedback,
): Promise<PortalFeedback & { createdAt: string }> {
  return runWithFallback(
    session,
    async (prisma) => {
      const property = await prisma.property.findFirst({
        where: {
          id: input.propertyId,
          organizationId: session.organizationId,
        },
      });
      if (!property) {
        throw new Error("NOT_FOUND");
      }

      const row = await prisma.portalFeedback.create({
        data: {
          clientId: input.clientId,
          propertyId: input.propertyId,
          status: input.status,
          comment: input.comment,
        },
      });

      return {
        clientId: row.clientId,
        propertyId: row.propertyId,
        status: row.status as "INTERESTED" | "NOT_INTERESTED" | "REQUEST_INFO",
        comment: row.comment ?? undefined,
        createdAt: row.createdAt.toISOString(),
      };
    },
    () => {
      const feedback = {
        ...input,
        createdAt: new Date().toISOString(),
      };
      db.portalFeedback.unshift(feedback);
      return feedback;
    },
  );
}

export async function registerDocumentUpload(
  session: SessionInput,
  input: DocumentUploadInitiate,
  storageKey: string,
): Promise<void> {
  await runWithFallback(
    session,
    async (prisma) => {
      const property = await prisma.property.findFirst({
        where: {
          id: input.propertyId,
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
      });

      if (!property) {
        return;
      }

      await prisma.document.create({
        data: {
          propertyId: input.propertyId,
          fileName: input.fileName,
          storageKey,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        },
      });
    },
    () => undefined,
  );
}

export async function listComplianceChecklists(
  session: SessionInput,
): Promise<PersistedComplianceChecklist[]> {
  const states: ComplianceState[] = ["NSW", "VIC"];
  const checklists = await Promise.all(
    states.map((state) => getComplianceChecklist(session, { state })),
  );
  return checklists;
}

export async function getComplianceChecklist(
  session: SessionInput,
  input: ComplianceChecklistStateInput,
): Promise<PersistedComplianceChecklist> {
  return runWithFallback(
    session,
    async (prisma) => {
      const template = getChecklistForState(input.state);
      let row = await prisma.complianceChecklist.findFirst({
        where: {
          organizationId: session.organizationId,
          state: input.state,
        },
      });

      if (!row) {
        row = await prisma.complianceChecklist.create({
          data: {
            organizationId: session.organizationId,
            state: input.state,
            policyVersion: template.policyVersion,
            itemsJson: buildChecklistItems(input.state),
          },
        });
      }

      return {
        state: input.state,
        policyVersion: row.policyVersion,
        items: normaliseChecklistItems(input.state, row.itemsJson),
        updatedAt: row.updatedAt.toISOString(),
      };
    },
    () => {
      const template = getChecklistForState(input.state);
      const existing = db.complianceChecklists.find(
        (row) =>
          row.organizationId === session.organizationId &&
          row.state === input.state,
      );

      if (existing) {
        return {
          state: existing.state,
          policyVersion: existing.policyVersion,
          items: existing.items,
          updatedAt: existing.updatedAt,
        };
      }

      const created = {
        organizationId: session.organizationId,
        state: input.state,
        policyVersion: template.policyVersion,
        items: buildChecklistItems(input.state),
        updatedAt: new Date().toISOString(),
      };
      db.complianceChecklists.push(created);
      return {
        state: created.state,
        policyVersion: created.policyVersion,
        items: created.items,
        updatedAt: created.updatedAt,
      };
    },
  );
}

export async function updateComplianceChecklistItem(
  session: SessionInput,
  input: ComplianceChecklistUpdateItemInput,
): Promise<PersistedComplianceChecklist | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const template = getChecklistForState(input.state);
      let row = await prisma.complianceChecklist.findFirst({
        where: {
          organizationId: session.organizationId,
          state: input.state,
        },
      });

      if (!row) {
        row = await prisma.complianceChecklist.create({
          data: {
            organizationId: session.organizationId,
            state: input.state,
            policyVersion: template.policyVersion,
            itemsJson: buildChecklistItems(input.state),
          },
        });
      }

      const existingItems = normaliseChecklistItems(input.state, row.itemsJson);
      const itemExists = existingItems.some((item) => item.code === input.code);
      if (!itemExists) {
        return null;
      }

      const nowIso = new Date().toISOString();
      const updatedItems = existingItems.map((item) => {
        if (item.code !== input.code) {
          return item;
        }

        return {
          ...item,
          completed: input.completed,
          evidenceNote: input.evidenceNote,
          completedAt: input.completed ? nowIso : undefined,
          completedBy: input.completed ? session.user.id : undefined,
        };
      });

      const updatedRow = await prisma.complianceChecklist.update({
        where: { id: row.id },
        data: {
          itemsJson: updatedItems,
        },
      });

      return {
        state: input.state,
        policyVersion: updatedRow.policyVersion,
        items: normaliseChecklistItems(input.state, updatedRow.itemsJson),
        updatedAt: updatedRow.updatedAt.toISOString(),
      };
    },
    () => {
      let checklist = db.complianceChecklists.find(
        (row) =>
          row.organizationId === session.organizationId &&
          row.state === input.state,
      );

      if (!checklist) {
        const template = getChecklistForState(input.state);
        checklist = {
          organizationId: session.organizationId,
          state: input.state,
          policyVersion: template.policyVersion,
          items: buildChecklistItems(input.state),
          updatedAt: new Date().toISOString(),
        };
        db.complianceChecklists.push(checklist);
      }

      let found = false;
      checklist.items = checklist.items.map((item) => {
        if (item.code !== input.code) {
          return item;
        }
        found = true;
        return {
          ...item,
          completed: input.completed,
          evidenceNote: input.evidenceNote,
          completedAt: input.completed ? new Date().toISOString() : undefined,
          completedBy: input.completed ? session.user.id : undefined,
        };
      });

      if (!found) {
        return null;
      }

      checklist.updatedAt = new Date().toISOString();
      return {
        state: checklist.state,
        policyVersion: checklist.policyVersion,
        items: checklist.items,
        updatedAt: checklist.updatedAt,
      };
    },
  );
}
