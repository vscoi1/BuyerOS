export interface PropertyMatchInput {
  suburb: string;
  state: string;
  targetSuburbs: string[];
  targetStates?: string[];
  budgetMin: number;
  budgetMax: number;
  price?: number;
  isOffMarket: boolean;
  isOffMarketPreferred: boolean;
  urgency?: "HOT" | "WARM" | "CASUAL";
}

export interface PropertyMatchResult {
  score: number;
  category: "PERFECT" | "STRONG" | "GOOD" | "POTENTIAL";
  reasons: string[];
}

interface MatchWeights {
  suburb: number;
  state: number;
  budgetInside: number;
  budgetNear: number;
  offMarketBonus: number;
  urgencyBonus: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  suburb: 40,
  state: 12,
  budgetInside: 30,
  budgetNear: 15,
  offMarketBonus: 8,
  urgencyBonus: 10,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function matchCategory(score: number): PropertyMatchResult["category"] {
  if (score >= 90) {
    return "PERFECT";
  }
  if (score >= 75) {
    return "STRONG";
  }
  if (score >= 60) {
    return "GOOD";
  }
  return "POTENTIAL";
}

export function calculatePropertyMatch(input: PropertyMatchInput): PropertyMatchResult {
  let score = 10;
  const reasons: string[] = [];

  const suburbMatched = input.targetSuburbs.some(
    (suburb) => suburb.trim().toLowerCase() === input.suburb.trim().toLowerCase(),
  );
  if (suburbMatched) {
    score += DEFAULT_WEIGHTS.suburb;
    reasons.push(`Suburb aligned with brief (${input.suburb})`);
  } else if (
    input.targetStates?.length &&
    input.targetStates.some((state) => state.toUpperCase() === input.state.toUpperCase())
  ) {
    score += DEFAULT_WEIGHTS.state;
    reasons.push(`State aligned with brief (${input.state})`);
  }

  if (input.price) {
    if (input.price >= input.budgetMin && input.price <= input.budgetMax) {
      score += DEFAULT_WEIGHTS.budgetInside;
      reasons.push("Price is within target budget range");
    } else {
      const distance = Math.min(
        Math.abs(input.price - input.budgetMin),
        Math.abs(input.price - input.budgetMax),
      );
      if (distance <= Math.round(input.budgetMax * 0.1)) {
        score += DEFAULT_WEIGHTS.budgetNear;
        reasons.push("Price is close to budget tolerance");
      } else {
        const penalty = Math.min(25, Math.round(distance / 100_000) * 5);
        score -= penalty;
      }
    }
  }

  if (input.isOffMarket && input.isOffMarketPreferred) {
    score += DEFAULT_WEIGHTS.offMarketBonus;
    reasons.push("Off-market preference matched");
  }

  if (input.urgency === "HOT" && score >= 60) {
    score += DEFAULT_WEIGHTS.urgencyBonus;
    reasons.push("Hot brief priority bonus applied");
  }

  const finalScore = clamp(score, 0, 100);
  return {
    score: finalScore,
    category: matchCategory(finalScore),
    reasons,
  };
}

