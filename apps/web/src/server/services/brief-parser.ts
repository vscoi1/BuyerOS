import { z } from "zod";
import { briefParseInput } from "@/server/validators";

export interface ParsedBrief {
  budgetMin?: number;
  budgetMax?: number;
  targetSuburbs: string[];
  bedroomsMin?: number;
  summary: string;
  confidence: number;
}

function extractBudget(text: string): { min?: number; max?: number } {
  const numbers = Array.from(text.matchAll(/\$?([0-9]+(?:\.[0-9]+)?)\s*(m|k)?/gi));
  if (numbers.length === 0) {
    return {};
  }

  const normalized = numbers
    .map((match) => {
      const value = Number(match[1]);
      const suffix = match[2]?.toLowerCase();
      if (suffix === "m") {
        return Math.round(value * 1_000_000);
      }
      if (suffix === "k") {
        return Math.round(value * 1_000);
      }
      return Math.round(value);
    })
    .filter((value) => Number.isFinite(value));

  if (normalized.length === 1) {
    return { max: normalized[0] };
  }

  return {
    min: Math.min(...normalized),
    max: Math.max(...normalized),
  };
}

function extractBedrooms(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(bed|bedroom)/i);
  if (!match) {
    return undefined;
  }
  return Number(match[1]);
}

function extractSuburbs(text: string): string[] {
  return text
    .split(/[,.]/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/.test(chunk))
    .slice(0, 6);
}

export function parseBrief(input: z.infer<typeof briefParseInput>): ParsedBrief {
  const payload = briefParseInput.parse(input);
  const budget = extractBudget(payload.sourceText);
  const bedroomsMin = extractBedrooms(payload.sourceText);
  const targetSuburbs = extractSuburbs(payload.sourceText);

  return {
    budgetMin: budget.min,
    budgetMax: budget.max,
    bedroomsMin,
    targetSuburbs,
    summary: payload.sourceText.slice(0, 180),
    confidence: 0.74,
  };
}
