interface ScoringInput {
  suburb: string;
  targetSuburbs: string[];
  budgetMin: number;
  budgetMax: number;
  price?: number;
  isOffMarket: boolean;
  isOffMarketPreferred: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computePropertyMatchScore(input: ScoringInput): number {
  let score = 40;

  if (input.targetSuburbs.some((suburb) => suburb.toLowerCase() === input.suburb.toLowerCase())) {
    score += 35;
  }

  if (input.price) {
    if (input.price >= input.budgetMin && input.price <= input.budgetMax) {
      score += 20;
    } else {
      const distance = Math.min(
        Math.abs(input.price - input.budgetMin),
        Math.abs(input.price - input.budgetMax),
      );
      const penalty = Math.min(25, Math.round(distance / 100_000) * 5);
      score -= penalty;
    }
  }

  if (input.isOffMarket && input.isOffMarketPreferred) {
    score += 10;
  }

  return clamp(score, 0, 100);
}
