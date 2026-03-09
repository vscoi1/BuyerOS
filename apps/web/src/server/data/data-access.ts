import type { PrismaClient, DealStage } from "@prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { db, type PropertyRecord, type DealKillerReportRecord, type DocumentRedFlagRecord } from "@/server/store";
import { getChecklistForState, type ComplianceState } from "@/server/services/compliance";
import type {
  clientCreateInput,
  complianceChecklistAttachEvidenceInput,
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
import { writeAuditLog } from "@/server/audit";

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
type ComplianceChecklistAttachEvidenceInput = z.infer<typeof complianceChecklistAttachEvidenceInput>;

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
  source: "MANUAL" | "WHISPER_NETWORK";
  matchScore: number;
  createdAt: string;
};

export type PersistedAgent = {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: "ADMIN" | "AGENT" | "ASSISTANT";
  stateFocus: string[];
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
  assignedAt?: string;
  createdAt: string;
};

export type PersistedDueDiligenceReport = DueDiligenceRun & {
  riskScore: number;
  flags: string[];
  summary: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  lastFetchedAt?: string;
  createdAt: string;
};

export type PersistedDocument = {
  id: string;
  propertyId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  uploadedAt: string;
};

export type PersistedDocumentRedFlag = {
  id: string;
  documentId: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  content: string;
  status: "UNREVIEWED" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export type PersistedComplianceChecklistItem = {
  code: string;
  label: string;
  completed: boolean;
  evidenceNote?: string;
  attachments: { fileName: string; url: string; createdAt: string }[];
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
  memory: () => T | Promise<T>,
): Promise<T> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return await memory();
  }

  try {
    await ensureActor(prisma, session);
    return await persistent(prisma);
  } catch (error) {
    console.error("Persistence fallback to in-memory store", error);
    return await memory();
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
  source: string;
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
    source: property.source as "MANUAL" | "WHISPER_NETWORK",
    matchScore: property.matchScore ?? 0,
    createdAt: property.createdAt.toISOString(),
  };
}

function buildChecklistItems(state: ComplianceState): PersistedComplianceChecklistItem[] {
  return getChecklistForState(state).items.map((item) => ({
    code: item.code,
    label: item.label,
    completed: false,
    attachments: [],
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

      const attachments: { fileName: string; url: string; createdAt: string }[] = [];
      if (Array.isArray(asRecord.attachments)) {
        for (const attr of asRecord.attachments) {
          if (attr && typeof attr === "object") {
            const a = attr as Record<string, unknown>;
            if (typeof a.fileName === "string" && typeof a.url === "string") {
              attachments.push({
                fileName: a.fileName,
                url: a.url,
                createdAt: typeof a.createdAt === "string" ? a.createdAt : new Date().toISOString(),
              });
            }
          }
        }
      }

      existingByCode.set(asRecord.code, {
        code: asRecord.code,
        label: typeof asRecord.label === "string" ? asRecord.label : "",
        completed: asRecord.completed === true,
        attachments,
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
      attachments: existing?.attachments ?? [],
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
        source: "MANUAL" as const,
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
          floodRisk: record.floodRisk ?? "LOW",
          bushfireRisk: record.bushfireRisk ?? "LOW",
          zoningChangeFlag: record.zoningChangeFlag ?? false,
          recentComparableDeltaPct: record.recentComparableDeltaPct ?? 0,
          riskScore: record.riskScore,
          flagsJson: record.flags,
          summary: record.summary,
          status: record.status || "COMPLETED",
          lastFetchedAt: record.lastFetchedAt ? new Date(record.lastFetchedAt) : null,
        },
        update: {
          floodRisk: record.floodRisk ?? "LOW",
          bushfireRisk: record.bushfireRisk ?? "LOW",
          zoningChangeFlag: record.zoningChangeFlag ?? false,
          recentComparableDeltaPct: record.recentComparableDeltaPct ?? 0,
          riskScore: record.riskScore,
          flagsJson: record.flags,
          summary: record.summary,
          status: record.status || "COMPLETED",
          lastFetchedAt: record.lastFetchedAt ? new Date(record.lastFetchedAt) : null,
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
        status: row.status as "PENDING" | "COMPLETED" | "FAILED",
        lastFetchedAt: row.lastFetchedAt?.toISOString(),
        createdAt: row.createdAt.toISOString(),
      };
    },
    () => {
      // Memory fallback: verify property belongs to requesting org+agent before writing
      const propertyOwned = db.properties.some(
        (p) => p.id === propertyId && p.organizationId === session.organizationId && p.agentId === session.user.id,
      );
      if (!propertyOwned) {
        return null;
      }
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

      const row = (await prisma.dueDiligenceReport.findUnique({ where: { propertyId } })) as Record<string, unknown>;
      if (!row) {
        return null;
      }

      const report: PersistedDueDiligenceReport = {
        propertyId: row.propertyId as string,
        floodRisk: row.floodRisk as "LOW" | "MEDIUM" | "HIGH",
        bushfireRisk: row.bushfireRisk as "LOW" | "MEDIUM" | "HIGH",
        zoningChangeFlag: row.zoningChangeFlag as boolean,
        recentComparableDeltaPct: row.recentComparableDeltaPct as number,
        riskScore: row.riskScore as number,
        flags: Array.isArray(row.flagsJson) ? (row.flagsJson as string[]) : [],
        summary: row.summary as string,
        status: (row.status as "PENDING" | "COMPLETED" | "FAILED") || "COMPLETED",
        lastFetchedAt: (row.lastFetchedAt as Date | null)?.toISOString(),
        createdAt: (row.createdAt as Date).toISOString(),
      };
      return report;
    },
    (): PersistedDueDiligenceReport | null => {
      // Memory fallback: verify property belongs to requesting org+agent before returning report
      const propertyOwned = db.properties.some(
        (p) => p.id === propertyId && p.organizationId === session.organizationId && p.agentId === session.user.id,
      );
      if (!propertyOwned) {
        return null;
      }
      return db.dueDiligenceReports.get(propertyId) ?? null;
    },
  );
}

export async function initiateExternalFetch(
  session: SessionInput,
  propertyId: string,
): Promise<PersistedDueDiligenceReport | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const row = (await prisma.dueDiligenceReport.upsert({
        where: { propertyId },
        create: {
          propertyId,
          status: "PENDING",
          floodRisk: "LOW",
          bushfireRisk: "LOW",
          zoningChangeFlag: false,
          recentComparableDeltaPct: 0,
          riskScore: 0,
          flagsJson: [],
          summary: "Initializing external fetch...",
        },
        update: {
          status: "PENDING",
        },
      })) as unknown as Record<string, unknown>;
      const report: PersistedDueDiligenceReport = {
        propertyId: row.propertyId as string,
        floodRisk: row.floodRisk as "LOW" | "MEDIUM" | "HIGH",
        bushfireRisk: row.bushfireRisk as "LOW" | "MEDIUM" | "HIGH",
        zoningChangeFlag: row.zoningChangeFlag as boolean,
        recentComparableDeltaPct: row.recentComparableDeltaPct as number,
        riskScore: row.riskScore as number,
        flags: Array.isArray(row.flagsJson) ? (row.flagsJson as string[]) : [],
        summary: row.summary as string,
        status: (row.status as "PENDING" | "COMPLETED" | "FAILED") || "PENDING",
        lastFetchedAt: (row.lastFetchedAt as Date | null)?.toISOString(),
        createdAt: (row.createdAt as Date).toISOString(),
      };
      return report;
    },
    (): PersistedDueDiligenceReport | null => {
      const initial: PersistedDueDiligenceReport = {
        propertyId,
        floodRisk: "LOW",
        bushfireRisk: "LOW",
        zoningChangeFlag: false,
        recentComparableDeltaPct: 0,
        riskScore: 0,
        flags: [],
        summary: "Initializing external fetch (memory)...",
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      db.dueDiligenceReports.set(propertyId, initial);
      return initial;
    },
  );
}

export async function updateDueDiligenceResult(
  session: SessionInput,
  propertyId: string,
  data: Partial<DueDiligenceRun>,
): Promise<PersistedDueDiligenceReport | null> {
  return runWithFallback(
    session,
    async (prisma): Promise<PersistedDueDiligenceReport | null> => {
      const row = (await prisma.dueDiligenceReport.update({
        where: { propertyId },
        data: {
          ...data,
          status: "COMPLETED",
          lastFetchedAt: new Date(),
        },
      })) as Record<string, unknown>;
      const report: PersistedDueDiligenceReport = {
        propertyId: row.propertyId as string,
        floodRisk: row.floodRisk as "LOW" | "MEDIUM" | "HIGH",
        bushfireRisk: row.bushfireRisk as "LOW" | "MEDIUM" | "HIGH",
        zoningChangeFlag: row.zoningChangeFlag as boolean,
        recentComparableDeltaPct: row.recentComparableDeltaPct as number,
        riskScore: row.riskScore as number,
        flags: Array.isArray(row.flagsJson) ? (row.flagsJson as string[]) : [],
        summary: row.summary as string,
        status: "COMPLETED",
        lastFetchedAt: (row.lastFetchedAt as Date | null)?.toISOString(),
        createdAt: (row.createdAt as Date).toISOString(),
      };
      return report;
    },
    (): PersistedDueDiligenceReport | null => {
      const existing = db.dueDiligenceReports.get(propertyId);
      if (!existing) return null;
      const updated: PersistedDueDiligenceReport = {
        ...existing,
        ...data,
        status: "COMPLETED",
        lastFetchedAt: new Date().toISOString(),
      };
      db.dueDiligenceReports.set(propertyId, updated);
      return updated;
    },
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

export async function listAgents(session: SessionInput): Promise<PersistedAgent[]> {
  return runWithFallback(
    session,
    async (prisma) => {
      const agents = await prisma.agent.findMany({
        where: { organizationId: session.organizationId },
        orderBy: { name: "asc" },
      });
      return agents.map((a) => ({
        id: a.id,
        organizationId: a.organizationId,
        email: a.email,
        name: a.name,
        role: a.role as "ADMIN" | "AGENT" | "ASSISTANT",
        stateFocus: a.stateFocus,
      }));
    },
    () => {
      return db.agents
        .filter((a) => a.organizationId === session.organizationId)
        .map((a) => ({
          id: a.id,
          organizationId: a.organizationId,
          email: a.email,
          name: a.name,
          role: a.role,
          stateFocus: a.stateFocus,
        }));
    },
  );
}

export async function recommendAgentsForSubmission(
  session: SessionInput,
  submissionId: string,
): Promise<import("@/server/services/matching-engine").AgentRankResult[]> {
  const submission = await getOffMarketSubmission(session, submissionId);
  if (!submission) {
    return [];
  }

  // Get all agents with their clients
  const agents = await listAgents(session);
  const agentsWithBriefs = await Promise.all(
    agents.map(async (agent) => {
      const clients = await listClients({
        organizationId: session.organizationId,
        user: { ...agent, role: agent.role as "ADMIN" | "AGENT" | "ASSISTANT" },
      });
      return {
        id: agent.id,
        name: agent.name,
        clients: clients.map((c) => ({
          budgetMin: c.budgetMin,
          budgetMax: c.budgetMax,
          targetSuburbs: c.targetSuburbs,
        })),
      };
    }),
  );

  const { rankAgentsForSubmission } = await import("@/server/services/matching-engine");
  return rankAgentsForSubmission(
    {
      suburb: submission.suburb,
      state: submission.state,
      askPrice: submission.askPrice,
    },
    agentsWithBriefs,
  );
}

async function getOffMarketSubmission(
  session: SessionInput,
  id: string,
): Promise<PersistedOffMarketSubmission | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const row = await prisma.offMarketSubmission.findFirst({
        where: { id, organizationId: session.organizationId },
      });
      if (!row) return null;
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
        status: row.status as "NEW" | "ASSIGNED",
        assignedAgentId: row.assignedAgentId ?? undefined,
        assignedAt: row.createdAt.toISOString(), // Fallback if column not in DB
        createdAt: row.createdAt.toISOString(),
      };
    },
    () => {
      const found = db.offMarketSubmissions.find(
        (s) => s.id === id && s.organizationId === session.organizationId,
      );
      return found ?? null;
    },
  );
}

export async function assignOffMarketSubmission(
  session: SessionInput,
  submissionId: string,
  agentId: string,
): Promise<PersistedOffMarketSubmission | null> {
  const now = new Date();
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
        assignedAt: now.toISOString(),
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
      submission.assignedAt = now.toISOString();
      return { ...submission };
    },
  );
}

/**
 * SHA-256 hash a plain token string → hex string.
 * Used so the DB stores only a hash of the portal session token,
 * never the raw value.
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * In-memory store for portal sessions (fallback when no DB).
 * Maps tokenHash → session record.
 */
const portalSessionMemory = new Map<
  string,
  { clientId: string; tokenHash: string; expiresAt: string; revokedAt?: string }
>();

export async function createPortalSession(
  session: SessionInput,
  clientId: string,
): Promise<{ clientId: string; token: string; expiresAt: string }> {
  const plainToken = crypto.randomUUID();
  const tokenHash = await hashToken(plainToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

      await prisma.portalSession.create({
        data: {
          clientId,
          tokenHash,          // store HASH only — plain token returned once to caller
          expiresAt,
        },
      });
      return { clientId, token: plainToken, expiresAt: expiresAt.toISOString() };
    },
    () => {
      // Memory fallback: verify client belongs to requesting org+agent before issuing token
      const clientExists = db.clients.some(
        (c) => c.id === clientId && c.organizationId === session.organizationId && c.agentId === session.user.id,
      );
      if (!clientExists) {
        throw new Error("NOT_FOUND");
      }
      portalSessionMemory.set(tokenHash, {
        clientId,
        tokenHash,
        expiresAt: expiresAt.toISOString(),
      });
      return { clientId, token: plainToken, expiresAt: expiresAt.toISOString() };
    },
  );
}

/**
 * Resolves a portal token to its clientId.
 * Returns null if the token is unknown, expired, or revoked.
 * Never returns data for a compromised session.
 */
export async function resolvePortalSession(
  plainToken: string,
): Promise<{ clientId: string } | null> {
  const tokenHash = await hashToken(plainToken);
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const row = await prisma.portalSession.findUnique({ where: { tokenHash } }) as {
        clientId: string;
        tokenHash: string;
        expiresAt: Date;
        revokedAt: Date | null;
      } | null;
      if (!row) return null;
      if (row.revokedAt) return null;          // revoked
      if (row.expiresAt < new Date()) return null; // expired
      return { clientId: row.clientId };
    } catch (err) {
      console.error("[portal] resolvePortalSession DB error:", err);
    }
  }

  // Memory fallback
  const record = portalSessionMemory.get(tokenHash);
  if (!record) return null;
  if (record.revokedAt) return null;
  if (new Date(record.expiresAt) < new Date()) return null;
  return { clientId: record.clientId };
}

/**
 * Revokes all portal sessions for a given client owned by the session's org+agent.
 * After revocation resolvePortalSession will return null for those tokens.
 */
export async function revokePortalSession(
  session: SessionInput,
  clientId: string,
): Promise<void> {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      // Cast needed: revokedAt is in the schema but Prisma types won't update until migration is applied.
      // In demo mode (no DB) this branch is never reached; the in-memory fallback below handles all revocations.
      type PSessionUpdateData = { revokedAt: Date };
      await (prisma.portalSession.updateMany as unknown as (
        args: { where: object; data: PSessionUpdateData }
      ) => Promise<{ count: number }>)({
        where: { clientId, client: { organizationId: session.organizationId, agentId: session.user.id } },
        data: { revokedAt: new Date() },
      });
      return;
    } catch (err) {
      console.error("[portal] revokePortalSession DB error:", err);
    }
  }

  // Memory fallback
  const now = new Date().toISOString();
  for (const [hash, record] of portalSessionMemory.entries()) {
    if (record.clientId === clientId && !record.revokedAt) {
      portalSessionMemory.set(hash, { ...record, revokedAt: now });
    }
  }
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
      // Memory fallback: verify property belongs to requesting org before storing feedback
      const propertyExists = db.properties.some(
        (p) => p.id === input.propertyId && p.organizationId === session.organizationId,
      );
      if (!propertyExists) {
        throw new Error("NOT_FOUND");
      }
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
          status: "PENDING",
        },
      });
    },
    () => {
      db.documents.push({
        id: crypto.randomUUID(),
        propertyId: input.propertyId,
        fileName: input.fileName,
        storageKey,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        status: "PENDING",
        uploadedAt: new Date().toISOString(),
      });
    },
  );
}

export async function canAccessDocumentStorageKey(
  session: SessionInput,
  storageKey: string,
): Promise<boolean> {
  return runWithFallback(
    session,
    async (prisma) => {
      const row = await prisma.document.findFirst({
        where: {
          storageKey,
          property: {
            organizationId: session.organizationId,
            agentId: session.user.id,
          },
        },
        select: { id: true },
      });
      return Boolean(row);
    },
    () => {
      const doc = db.documents.find((d) => d.storageKey === storageKey);
      if (!doc) return false;
      return db.properties.some(
        (p) =>
          p.id === doc.propertyId &&
          p.organizationId === session.organizationId &&
          p.agentId === session.user.id,
      );
    },
  );
}

export async function listDocuments(
  session: SessionInput,
  propertyId: string,
): Promise<PersistedDocument[]> {
  return runWithFallback(
    session,
    async (prisma) => {
      const rows = await prisma.document.findMany({
        where: {
          propertyId,
          property: {
            organizationId: session.organizationId,
            agentId: session.user.id,
          },
        },
        orderBy: { uploadedAt: "desc" },
      });
      return rows.map((r) => ({
        ...r,
        status: r.status as PersistedDocument["status"],
        uploadedAt: r.uploadedAt.toISOString(),
      }));
    },
    () => {
      const property = db.properties.find(
        (p) =>
          p.id === propertyId &&
          p.organizationId === session.organizationId &&
          p.agentId === session.user.id,
      );
      if (!property) {
        return [];
      }
      return db.documents.filter((d) => d.propertyId === propertyId);
    },
  );
}

export async function getDocumentWithFlags(
  session: SessionInput,
  documentId: string,
): Promise<(PersistedDocument & { redFlags: PersistedDocumentRedFlag[] }) | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const row = await prisma.document.findFirst({
        where: {
          id: documentId,
          property: {
            organizationId: session.organizationId,
            agentId: session.user.id,
          },
        },
        include: { redFlags: true },
      });
      if (!row) return null;
      return {
        ...row,
        status: row.status as PersistedDocument["status"],
        uploadedAt: row.uploadedAt.toISOString(),
        redFlags: row.redFlags.map((f) => ({
          ...f,
          severity: f.severity as PersistedDocumentRedFlag["severity"],
          status: f.status as PersistedDocumentRedFlag["status"],
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        })),
      };
    },
    () => {
      const doc = db.documents.find((d) => d.id === documentId);
      if (!doc) return null;
      const property = db.properties.find(
        (p) =>
          p.id === doc.propertyId &&
          p.organizationId === session.organizationId &&
          p.agentId === session.user.id,
      );
      if (!property) {
        return null;
      }
      const flags = db.documentRedFlags.filter((f) => f.documentId === documentId);
      return { ...doc, redFlags: flags };
    },
  );
}

export async function extractDocumentRedFlags(
  session: SessionInput,
  documentId: string,
): Promise<PersistedDocumentRedFlag[]> {
  return runWithFallback(
    session,
    async (prisma) => {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          property: {
            organizationId: session.organizationId,
            agentId: session.user.id,
          },
        },
      });
      if (!document) {
        return [];
      }

      // Set to processing
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "PROCESSING" },
      });

      // Simulate extraction lag
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockFlags = [
        {
          severity: "HIGH",
          category: "ZONING",
          content: "Heritage conservation overlay detected. Significant development restrictions apply.",
        },
        {
          severity: "MEDIUM",
          category: "LEGAL",
          content: "Unregistered easement for drainage found on western boundary.",
        },
      ];

      const created = await Promise.all(
        mockFlags.map((f) =>
          prisma.documentRedFlag.create({
            data: {
              documentId,
              severity: f.severity,
              category: f.category,
              content: f.content,
              status: "UNREVIEWED",
            },
          }),
        ),
      );

      await prisma.document.update({
        where: { id: documentId },
        data: { status: "COMPLETED" },
      });

      return created.map((f) => ({
        ...f,
        severity: f.severity as PersistedDocumentRedFlag["severity"],
        status: f.status as PersistedDocumentRedFlag["status"],
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      }));
    },
    async () => {
      const doc = db.documents.find((d) => d.id === documentId);
      if (!doc) {
        return [];
      }
      const property = db.properties.find(
        (p) =>
          p.id === doc.propertyId &&
          p.organizationId === session.organizationId &&
          p.agentId === session.user.id,
      );
      if (!property) {
        return [];
      }
      doc.status = "PROCESSING";

      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockFlags: PersistedDocumentRedFlag[] = [
        {
          id: crypto.randomUUID(),
          documentId,
          severity: "HIGH",
          category: "ZONING",
          content: "Heritage conservation overlay detected. Significant development restrictions apply.",
          status: "UNREVIEWED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      db.documentRedFlags.push(...mockFlags);
      doc.status = "COMPLETED";
      return mockFlags;
    },
  );
}

export async function updateRedFlagStatus(
  session: SessionInput,
  flagId: string,
  status: "APPROVED" | "REJECTED",
): Promise<PersistedDocumentRedFlag | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const existing = await prisma.documentRedFlag.findFirst({
        where: {
          id: flagId,
          document: {
            property: {
              organizationId: session.organizationId,
              agentId: session.user.id,
            },
          },
        },
      });
      if (!existing) {
        return null;
      }
      const row = await prisma.documentRedFlag.update({
        where: { id: existing.id },
        data: { status },
      });
      return {
        ...row,
        severity: row.severity as PersistedDocumentRedFlag["severity"],
        status: row.status as PersistedDocumentRedFlag["status"],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },
    () => {
      const flag = db.documentRedFlags.find((f) => f.id === flagId);
      if (!flag) return null;
      const doc = db.documents.find((d) => d.id === flag.documentId);
      if (!doc) return null;
      const property = db.properties.find(
        (p) =>
          p.id === doc.propertyId &&
          p.organizationId === session.organizationId &&
          p.agentId === session.user.id,
      );
      if (!property) {
        return null;
      }
      flag.status = status;
      flag.updatedAt = new Date().toISOString();
      return flag;
    },
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

export async function attachComplianceEvidence(
  session: SessionInput,
  input: ComplianceChecklistAttachEvidenceInput,
): Promise<PersistedComplianceChecklist | null> {
  return runWithFallback(
    session,
    async (prisma) => {
      const row = await prisma.complianceChecklist.findFirst({
        where: {
          organizationId: session.organizationId,
          state: input.state,
        },
      });

      if (!row) {
        return null;
      }

      const existingItems = normaliseChecklistItems(input.state as ComplianceState, row.itemsJson);
      const updatedItems = existingItems.map((item) => {
        if (item.code !== input.code) {
          return item;
        }

        return {
          ...item,
          attachments: [
            ...item.attachments,
            {
              fileName: input.fileName,
              url: input.url,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      });

      const updatedRow = await prisma.complianceChecklist.update({
        where: { id: row.id },
        data: {
          itemsJson: updatedItems,
        },
      });

      return {
        state: input.state as ComplianceState,
        policyVersion: updatedRow.policyVersion,
        items: normaliseChecklistItems(input.state as ComplianceState, updatedRow.itemsJson),
        updatedAt: updatedRow.updatedAt.toISOString(),
      };
    },
    () => {
      const checklist = db.complianceChecklists.find(
        (row) =>
          row.organizationId === session.organizationId &&
          row.state === input.state,
      );

      if (!checklist) {
        return null;
      }

      let found = false;
      checklist.items = checklist.items.map((item) => {
        if (item.code !== input.code) {
          return item;
        }
        found = true;
        return {
          ...item,
          attachments: [
            ...(item.attachments ?? []),
            {
              fileName: input.fileName,
              url: input.url,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      });

      if (!found) {
        return null;
      }

      checklist.updatedAt = new Date().toISOString();
      return {
        state: checklist.state,
        policyVersion: checklist.policyVersion,
        items: checklist.items as PersistedComplianceChecklistItem[],
        updatedAt: checklist.updatedAt,
      };
    },
  );
}

export async function migrateComplianceChecklist(
  session: SessionInput,
  state: ComplianceState,
): Promise<PersistedComplianceChecklist> {
  return runWithFallback(
    session,
    async (prisma) => {
      const template = getChecklistForState(state);
      const row = await prisma.complianceChecklist.findFirst({
        where: {
          organizationId: session.organizationId,
          state,
        },
      });

      if (!row) {
        // Just create it if it doesn't exist
        return getComplianceChecklist(session, { state });
      }

      // Merge: Keep progress/evidence, add new items, update labels
      const existingItems = normaliseChecklistItems(state, row.itemsJson);
      const migratedItems = normaliseChecklistItems(state, existingItems); // Normalisation handles the merge

      const updatedRow = await prisma.complianceChecklist.update({
        where: { id: row.id },
        data: {
          policyVersion: template.policyVersion,
          itemsJson: migratedItems,
        },
      });

      return {
        state,
        policyVersion: updatedRow.policyVersion,
        items: normaliseChecklistItems(state, updatedRow.itemsJson),
        updatedAt: updatedRow.updatedAt.toISOString(),
      };
    },
    () => {
      const checklist = db.complianceChecklists.find(
        (row) =>
          row.organizationId === session.organizationId &&
          row.state === state,
      );

      if (!checklist) {
        return getComplianceChecklist(session, { state });
      }

      const template = getChecklistForState(state);
      checklist.policyVersion = template.policyVersion;
      // Normalisation logic we wrote in normaliseChecklistItems handles merging correctly
      checklist.items = normaliseChecklistItems(state, checklist.items);
      checklist.updatedAt = new Date().toISOString();

      return {
        state: checklist.state,
        policyVersion: checklist.policyVersion,
        items: checklist.items as PersistedComplianceChecklistItem[],
        updatedAt: checklist.updatedAt,
      };
    },
  );
}

export async function generateDealKillerReport(
  session: SessionInput,
  propertyId: string,
): Promise<{ report: DealKillerReportRecord; flagsCount: number; pendingReviewCount: number }> {
  const property = await getProperty(session, propertyId);
  if (!property) {
    throw new Error("NOT_FOUND");
  }

  // 1. Fetch all documents and their red flags for this property
  const flags = await runWithFallback(
    session,
    async (prisma) => {
      const docs = await prisma.document.findMany({
        where: {
          propertyId,
          property: {
            organizationId: session.organizationId,
            agentId: session.user.id,
          },
        },
        include: {
          redFlags: true,
        },
      });
      return docs.flatMap((d) => d.redFlags) as unknown as DocumentRedFlagRecord[];
    },
    () => {
      const docs = db.documents.filter((d) => d.propertyId === propertyId);
      const docIds = docs.map((d) => d.id);
      return db.documentRedFlags.filter(
        (f) => docIds.includes(f.documentId) && ["UNREVIEWED", "APPROVED"].includes(f.status)
      );
    }
  );

  const approvedFlags = flags.filter((f) => f.status === "APPROVED");
  const unreviewedFlags = flags.filter((f) => f.status === "UNREVIEWED");

  let overallRisk: "LOW" | "MODERATE" | "HIGH" | "CATASTROPHIC" = "LOW";
  let summary = "No approved risk findings are available yet.";
  const dealKillers: string[] = [];

  if (approvedFlags.length === 0) {
    overallRisk = "LOW";
    if (unreviewedFlags.length > 0) {
      summary = `Review required: ${unreviewedFlags.length} extracted finding(s) are pending human approval.`;
    } else {
      summary = "No approved risk findings are available yet.";
    }
  } else {
    const hasHigh = approvedFlags.some((f) => f.severity === "HIGH");
    const hasMed = approvedFlags.some((f) => f.severity === "MEDIUM");

    if (hasHigh) {
      overallRisk = "CATASTROPHIC";
      summary = "Critical risks identified from approved findings. Legal and technical review is required.";
    } else if (hasMed) {
      overallRisk = "MODERATE";
      summary = "Moderate risks identified from approved findings. Continue with legal and building checks.";
    } else {
      summary = "Low risk profile based on approved findings only.";
    }

    approvedFlags
      .filter((f) => f.severity === "HIGH")
      .forEach((f) => {
        dealKillers.push(`[${f.category}] ${f.content}`);
      });
  }

  if (dealKillers.length === 0 && unreviewedFlags.length > 0) {
    summary =
      `${summary} Client-facing legal conclusions remain blocked until findings are reviewed.`;
  }

  // Create the report
  const reportInput = {
    propertyId,
    overallRisk,
    summary,
    dealKillers,
  };

  const savedReport = await runWithFallback(
    session,
    async (prisma) => {
      // Upsert to ensure only one deal killer report per property
      const row = await prisma.dealKillerReport.upsert({
        where: { propertyId },
        update: { ...reportInput },
        create: {
          ...reportInput,
        },
      });
      return {
        ...row,
        overallRisk: row.overallRisk as "LOW" | "MODERATE" | "HIGH" | "CATASTROPHIC",
        dealKillers: (row.dealKillers as string[]) ?? [],
        generatedAt: row.generatedAt.toISOString(),
      };
    },
    () => {
      const existingIdx = db.dealKillerReports.findIndex((r) => r.propertyId === propertyId);
      const newReport: DealKillerReportRecord = {
        id: crypto.randomUUID(),
        ...reportInput,
        generatedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        db.dealKillerReports[existingIdx] = newReport;
      } else {
        db.dealKillerReports.push(newReport);
      }
      return newReport;
    }
  );

  return {
    report: savedReport,
    flagsCount: approvedFlags.length,
    pendingReviewCount: unreviewedFlags.length,
  };
}

export async function ingestWhisperListing(
  session: SessionInput,
  rawContent: string,
): Promise<{ property: PersistedProperty; matchedClientIds: string[] }> {
  // 1. MOCK AI PARSING OF RAW EMAIL/TEXT
  // In a real scenario, this would call OpenAI/Anthropic to extract details.
  // We use a simple regex/heuristic mock for the demo.
  let address = "Unknown Address";
  let suburb = "Unknown Suburb";
  let postcode = "0000";
  let price = 1000000;

  const addressMatch = rawContent.match(/(?:Address|Property):\s*([^\.]+)/i);
  if (addressMatch) address = addressMatch[1].trim();

  const suburbMatch = rawContent.match(/(?:Suburb):\s*([^\.]+)/i);
  if (suburbMatch) suburb = suburbMatch[1].trim();

  const postcodeMatch = rawContent.match(/(?:Postcode):\s*(\d{4})/i);
  if (postcodeMatch) postcode = postcodeMatch[1].trim();

  const priceMatch = rawContent.match(/\$([\d,\.]+[km]?)/i);
  if (priceMatch) {
    const cleanPrice = priceMatch[1].replace(/,/g, "").toLowerCase();
    if (cleanPrice.endsWith("k")) price = parseFloat(cleanPrice) * 1000;
    else if (cleanPrice.endsWith("m")) price = parseFloat(cleanPrice) * 1000000;
    else price = parseFloat(cleanPrice);
  }

  // 2. CREATE PROPERTY
  const newPropertyInput = {
    organizationId: session.organizationId,
    agentId: session.user.id,
    address,
    suburb,
    state: "NSW", // Default for demo
    postcode,
    price,
    stage: "SEARCHING" as DealStage,
    isOffMarket: true,
    source: "WHISPER_NETWORK" as const,
    matchScore: 85, // Mock high match score for excitement
  };

  const property = await runWithFallback(
    session,
    async (prisma) => {
      const row = await prisma.property.create({
        data: newPropertyInput,
      });
      return mapPropertyRecord(row);
    },
    () => {
      const p: PropertyRecord = {
        id: crypto.randomUUID(),
        clientId: undefined,
        createdAt: new Date().toISOString(),
        ...newPropertyInput,
      };
      db.properties.unshift(p);
      return p;
    },
  );

  // 3. MATCH TO CLIENTS
  // Fetch active clients from the same org and agent to simulate finding matches.
  const matchedClientIds: string[] = [];
  await runWithFallback(
    session,
    async (prisma) => {
      const clients = await prisma.client.findMany({
        where: {
          organizationId: session.organizationId,
          agentId: session.user.id,
        },
        take: 3, // Mock top 3 matches
      });
      clients.forEach((c) => matchedClientIds.push(c.id));
    },
    () => {
      const clients = db.clients
        .filter((c) => c.organizationId === session.organizationId && c.agentId === session.user.id)
        .slice(0, 3);
      clients.forEach((c) => matchedClientIds.push(c.id));
    },
  );

  return { property, matchedClientIds };
}

export type MarketSniperSignal = {
  id: string;
  type: "COMMERCIAL" | "PLANNING" | "INFRASTRUCTURE" | "DEMOGRAPHIC";
  title: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  dateReported: string;
};

export type MarketSniperReport = {
  suburb: string;
  state: string;
  gentrificationScore: number; // 0-100
  summary: string;
  signals: MarketSniperSignal[];
};

export async function getSniperData(
  session: SessionInput,
  suburb: string,
  state: string
): Promise<MarketSniperReport> {
  // Enforce auth
  if (!session?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // MOCK LOGIC for Micro-Market Sniper:
  // We use deterministic hashing based on the suburb name to generate a realistic looking
  // gentrification profile. In production, this would hit CDR, BCI Central, CoreLogic, etc.

  const normalized = suburb.trim().toLowerCase();

  // Seed random deterministically from string
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const randomizer = Math.abs(hash) % 100;

  // Base score 40-98 based on hash
  const score = 40 + (randomizer % 58);

  const signals: MarketSniperSignal[] = [];

  if (score > 80) {
    signals.push({
      id: `sig_${hash}_1`,
      type: "COMMERCIAL",
      title: "Extremely high commercial velocity: 4 new artisan cafes/wine bars registered in the last 90 days.",
      impact: "HIGH",
      dateReported: new Date(Date.now() - 14 * 86400000).toISOString(),
    });
    signals.push({
      id: `sig_${hash}_2`,
      type: "PLANNING",
      title: "Council Development Application (DA) volume up 42% YoY for medium-density renovations.",
      impact: "HIGH",
      dateReported: new Date(Date.now() - 5 * 86400000).toISOString(),
    });
  } else if (score > 60) {
    signals.push({
      id: `sig_${hash}_3`,
      type: "INFRASTRUCTURE",
      title: "State government announced $45M upgrade to local transit corridor.",
      impact: "HIGH",
      dateReported: new Date(Date.now() - 30 * 86400000).toISOString(),
    });
    signals.push({
      id: `sig_${hash}_4`,
      type: "COMMERCIAL",
      title: "First major organic grocer DA approved on main arterial road.",
      impact: "MEDIUM",
      dateReported: new Date(Date.now() - 10 * 86400000).toISOString(),
    });
  } else {
    signals.push({
      id: `sig_${hash}_5`,
      type: "DEMOGRAPHIC",
      title: "Slight uptick in average household income (+3% over precinct baseline).",
      impact: "LOW",
      dateReported: new Date(Date.now() - 60 * 86400000).toISOString(),
    });
  }

  // Inject a standard infrastructure signal just to look rich
  if (randomizer % 2 === 0) {
    signals.push({
      id: `sig_${hash}_6`,
      type: "PLANNING",
      title: "School zone boundary realignment proposed for upcoming calendar year.",
      impact: "MEDIUM",
      dateReported: new Date(Date.now() - 3 * 86400000).toISOString(),
    });
  }

  let summary = "";
  if (score >= 85) {
    summary = `Hyper-gentrification detected. ${suburb} is showing extreme leading indicators of cultural and commercial shift before broad market pricing reflects it.`;
  } else if (score >= 65) {
    summary = `Emerging growth corridor. ${suburb} displays solid foundational infrastructure and commercial velocity indicating steady, above-average impending capital growth.`;
  } else {
    summary = `Stable or lagging market. ${suburb} is not currently exhibiting the leading indicators required for hyper-gentrification prediction.`;
  }

  // Write a synthetic audit trail so we track BA usage of this premium tool
  await writeAuditLog({
    organizationId: session.organizationId,
    actorId: session.user.id,
    action: "READ",
    entityType: "MARKET_INTELLIGENCE",
    entityId: `${normalized}-${state}`,
    metadata: { message: "Generated Micro-Market Sniper prediction", score },
  });

  return {
    suburb,
    state,
    gentrificationScore: score,
    summary,
    signals,
  };
}
