import { z } from "zod";

export const clientCreateInput = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  budgetMin: z.number().int().positive(),
  budgetMax: z.number().int().positive(),
  targetSuburbs: z.array(z.string().min(1)).min(1),
  briefSummary: z.string().min(10).max(5000),
});

export const clientUpdateInput = clientCreateInput.partial().extend({
  id: z.string().min(3),
});

export const propertyCreateInput = z.object({
  clientId: z.string().optional(),
  address: z.string().min(5).max(200),
  suburb: z.string().min(2).max(100),
  state: z.enum(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]),
  postcode: z.string().regex(/^\d{4}$/),
  price: z.number().int().positive().optional(),
  stage: z.enum([
    "BRIEF",
    "SEARCHING",
    "SHORTLISTED",
    "DUE_DILIGENCE",
    "OFFER",
    "CONTRACTED",
    "SETTLED",
    "LOST",
  ]),
  isOffMarket: z.boolean(),
});

export const propertyListInput = z.object({
  clientId: z.string().optional(),
  stage: z
    .enum([
      "BRIEF",
      "SEARCHING",
      "SHORTLISTED",
      "DUE_DILIGENCE",
      "OFFER",
      "CONTRACTED",
      "SETTLED",
      "LOST",
    ])
    .optional(),
});

export const propertyScoreRecomputeInput = z.object({
  propertyId: z.string().min(3),
  budgetMin: z.number().int().positive(),
  budgetMax: z.number().int().positive(),
  targetSuburbs: z.array(z.string().min(1)).min(1),
  isOffMarketPreferred: z.boolean().default(false),
});

export const marketSniperInput = z.object({
  suburb: z.string().min(2),
  state: z.string().min(2).max(3).toUpperCase(),
});

export const dealKillerReportGenerateInput = z.object({
  propertyId: z.string().min(3),
});

export const briefParseInput = z.object({
  sourceText: z.string().min(20).max(10000),
});

export const dueDiligenceRunInput = z.object({
  propertyId: z.string().min(3),
  floodRisk: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  bushfireRisk: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  zoningChangeFlag: z.boolean().optional(),
  recentComparableDeltaPct: z.number().min(-40).max(40).optional(),
});

export const dueDiligenceGetInput = z.object({
  propertyId: z.string().min(3),
});

export const offMarketSubmitInput = z.object({
  sellingAgent: z.string().min(2).max(100),
  agency: z.string().min(2).max(120),
  address: z.string().min(5).max(200),
  suburb: z.string().min(2).max(100),
  state: z.enum(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]),
  postcode: z.string().regex(/^\d{4}$/),
  askPrice: z.number().int().positive().optional(),
});

export const offMarketAssignInput = z.object({
  submissionId: z.string().min(3),
  agentId: z.string().min(3),
});

export const portalSessionClientInput = z.object({
  clientId: z.string().min(3),
});

export const portalSessionCreateInput = portalSessionClientInput.extend({
  ttlHours: z.number().int().min(1).max(24 * 14).default(24 * 7).optional(),
  oneTime: z.boolean().default(false).optional(),
  rotateExisting: z.boolean().default(false).optional(),
});

export const portalSessionRotateInput = portalSessionClientInput.extend({
  ttlHours: z.number().int().min(1).max(24 * 14).default(24 * 7).optional(),
});

export const portalFeedbackInput = z.object({
  clientId: z.string().min(3),
  propertyId: z.string().min(3),
  status: z.enum(["INTERESTED", "NOT_INTERESTED", "REQUEST_INFO"]),
  comment: z.string().max(1000).optional(),
});

export const documentUploadInitiateInput = z.object({
  propertyId: z.string().min(3),
  fileName: z.string().min(2).max(200),
  mimeType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive().max(20_000_000),
});

export const documentSignedUrlInput = z.object({
  storageKey: z.string().min(3),
});

export const analysisStampDutyInput = z.object({
  state: z.enum(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]),
  purchasePrice: z.number().int().positive(),
  isForeignBuyer: z.boolean().default(false),
});

export const complianceStateInput = z.object({
  state: z.enum(["NSW", "VIC"]),
});

export const complianceChecklistUpdateItemInput = complianceStateInput.extend({
  code: z.string().min(3).max(32),
  completed: z.boolean(),
  evidenceNote: z.string().max(2000).optional(),
});
export const complianceChecklistAttachEvidenceInput = complianceStateInput.extend({
  code: z.string().min(3).max(32),
  fileName: z.string().min(1).max(200),
  url: z.string().url(),
});

export const documentListInput = z.object({
  propertyId: z.string().min(3),
});

export const documentGetInput = z.object({
  documentId: z.string().min(3),
});

export const documentRedFlagExtractInput = z.object({
  documentId: z.string().min(3),
});

export const documentRedFlagUpdateStatusInput = z.object({
  flagId: z.string().min(3),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const whisperIngestInput = z.object({
  rawContent: z.string().min(10).max(10000), // Raw email/text dump from the selling agent
});
