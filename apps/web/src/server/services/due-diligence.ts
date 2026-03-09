import { z } from "zod";
import { dueDiligenceRunInput } from "@/server/validators";

interface DueDiligenceResult {
  riskScore: number;
  flags: string[];
  summary: string;
  status?: "PENDING" | "COMPLETED" | "FAILED";
  lastFetchedAt?: string;
}

const riskWeight = {
  LOW: 5,
  MEDIUM: 18,
  HIGH: 32,
};

export function runDueDiligence(input: z.infer<typeof dueDiligenceRunInput>): DueDiligenceResult {
  const payload = dueDiligenceRunInput.parse(input);

  let score = 12;
  const flood = payload.floodRisk ?? "LOW";
  const bushfire = payload.bushfireRisk ?? "LOW";
  const recentDelta = payload.recentComparableDeltaPct ?? 0;

  score += riskWeight[flood];
  score += riskWeight[bushfire];

  if (payload.zoningChangeFlag) {
    score += 14;
  }

  if (recentDelta < -10) {
    score += 8;
  }

  const flags: string[] = [];

  if (flood !== "LOW") {
    flags.push(`Flood overlay risk: ${flood}`);
  }

  if (bushfire !== "LOW") {
    flags.push(`Bushfire overlay risk: ${bushfire}`);
  }

  if (payload.zoningChangeFlag) {
    flags.push("Active zoning or planning change flag");
  }

  if (recentDelta < -10) {
    flags.push("Comparable sales trending down");
  }

  const riskScore = Math.min(100, score);

  return {
    riskScore,
    flags,
    summary:
      riskScore > 60
        ? "High caution: conveyancer and specialist checks required before offer."
        : "Moderate risk profile: proceed with standard legal and building checks.",
  };
}
