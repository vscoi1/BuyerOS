import { z } from "zod";
import { dueDiligenceRunInput } from "@/server/validators";

interface DueDiligenceResult {
  riskScore: number;
  flags: string[];
  summary: string;
}

const riskWeight = {
  LOW: 5,
  MEDIUM: 18,
  HIGH: 32,
};

export function runDueDiligence(input: z.infer<typeof dueDiligenceRunInput>): DueDiligenceResult {
  const payload = dueDiligenceRunInput.parse(input);

  let score = 12;
  score += riskWeight[payload.floodRisk];
  score += riskWeight[payload.bushfireRisk];

  if (payload.zoningChangeFlag) {
    score += 14;
  }

  if (payload.recentComparableDeltaPct < -10) {
    score += 8;
  }

  const flags: string[] = [];

  if (payload.floodRisk !== "LOW") {
    flags.push(`Flood overlay risk: ${payload.floodRisk}`);
  }

  if (payload.bushfireRisk !== "LOW") {
    flags.push(`Bushfire overlay risk: ${payload.bushfireRisk}`);
  }

  if (payload.zoningChangeFlag) {
    flags.push("Active zoning or planning change flag");
  }

  if (payload.recentComparableDeltaPct < -10) {
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
