export type AustralianState = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";

export interface StampDutyEstimateInput {
  state: AustralianState;
  purchasePrice: number;
  isForeignBuyer?: boolean;
}

export interface StampDutyEstimate {
  state: AustralianState;
  baseDuty: number;
  foreignSurcharge: number;
  totalDuty: number;
  effectiveRatePct: number;
}

interface Bracket {
  threshold: number;
  rate: number;
  base: number;
}

const NSWB: Bracket[] = [
  { threshold: 16_000, rate: 0.0125, base: 0 },
  { threshold: 35_000, rate: 0.015, base: 200 },
  { threshold: 93_000, rate: 0.0175, base: 485 },
  { threshold: 351_000, rate: 0.035, base: 1_500 },
  { threshold: 1_168_000, rate: 0.045, base: 10_528 },
  { threshold: Infinity, rate: 0.055, base: 47_203 },
];

const VICB: Bracket[] = [
  { threshold: 25_000, rate: 0.014, base: 0 },
  { threshold: 130_000, rate: 0.024, base: 350 },
  { threshold: 960_000, rate: 0.055, base: 2_870 },
  { threshold: 2_000_000, rate: 0.055, base: 48_520 },
  { threshold: Infinity, rate: 0.065, base: 105_800 },
];

const QLDB: Bracket[] = [
  { threshold: 5_000, rate: 0, base: 0 },
  { threshold: 75_000, rate: 0.015, base: 0 },
  { threshold: 540_000, rate: 0.035, base: 1_050 },
  { threshold: 1_000_000, rate: 0.045, base: 17_325 },
  { threshold: Infinity, rate: 0.0575, base: 38_025 },
];

const WAB: Bracket[] = [
  { threshold: 120_000, rate: 0.019, base: 0 },
  { threshold: 150_000, rate: 0.0285, base: 2_280 },
  { threshold: 360_000, rate: 0.038, base: 3_135 },
  { threshold: 725_000, rate: 0.0475, base: 11_115 },
  { threshold: Infinity, rate: 0.0515, base: 28_453 },
];

const SAB: Bracket[] = [
  { threshold: 12_000, rate: 0.01, base: 0 },
  { threshold: 30_000, rate: 0.02, base: 120 },
  { threshold: 50_000, rate: 0.03, base: 480 },
  { threshold: 100_000, rate: 0.035, base: 1_080 },
  { threshold: 200_000, rate: 0.04, base: 2_830 },
  { threshold: 250_000, rate: 0.0425, base: 6_830 },
  { threshold: 300_000, rate: 0.0475, base: 8_955 },
  { threshold: 500_000, rate: 0.05, base: 11_330 },
  { threshold: Infinity, rate: 0.055, base: 21_330 },
];

const FOREIGN_SURCHARGE: Record<AustralianState, number> = {
  NSW: 0.08,
  VIC: 0.08,
  QLD: 0.08,
  WA: 0.07,
  SA: 0.07,
  TAS: 0.08,
  ACT: 0,
  NT: 0,
};

function calculateBracketDuty(price: number, brackets: Bracket[]): number {
  let previousThreshold = 0;

  for (const bracket of brackets) {
    if (price <= bracket.threshold) {
      return bracket.base + (price - previousThreshold) * bracket.rate;
    }
    previousThreshold = bracket.threshold;
  }

  return 0;
}

function getBracketsForState(state: AustralianState): Bracket[] | null {
  switch (state) {
    case "NSW":
      return NSWB;
    case "VIC":
      return VICB;
    case "QLD":
      return QLDB;
    case "WA":
      return WAB;
    case "SA":
      return SAB;
    default:
      return null;
  }
}

export function estimateStampDuty(input: StampDutyEstimateInput): StampDutyEstimate {
  const brackets = getBracketsForState(input.state);
  const fallbackRate = 0.045;
  const baseDuty = brackets
    ? calculateBracketDuty(input.purchasePrice, brackets)
    : input.purchasePrice * fallbackRate;

  const surchargeRate = input.isForeignBuyer ? FOREIGN_SURCHARGE[input.state] : 0;
  const foreignSurcharge = input.purchasePrice * surchargeRate;
  const totalDuty = Math.round(baseDuty + foreignSurcharge);
  const effectiveRatePct = Number(((totalDuty / input.purchasePrice) * 100).toFixed(2));

  return {
    state: input.state,
    baseDuty: Math.round(baseDuty),
    foreignSurcharge: Math.round(foreignSurcharge),
    totalDuty,
    effectiveRatePct,
  };
}

