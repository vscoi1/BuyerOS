export type DealStage =
  | "BRIEF"
  | "SEARCHING"
  | "SHORTLISTED"
  | "DUE_DILIGENCE"
  | "OFFER"
  | "CONTRACTED"
  | "SETTLED"
  | "LOST";

export type AustralianState = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";

export interface BriefCriteria {
  budgetMin: number;
  budgetMax: number;
  targetSuburbs: string[];
  bedroomsMin?: number;
  bathroomsMin?: number;
  propertyTypes?: string[];
  mustHave?: string[];
  avoid?: string[];
}

export interface RiskFlag {
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
}
