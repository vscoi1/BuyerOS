export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ExternalDueDiligence {
    floodRisk: RiskLevel;
    bushfireRisk: RiskLevel;
    zoningChangeFlag: boolean;
    recentComparableDeltaPct: number;
}

export async function fetchFloodRisk(suburb: string): Promise<RiskLevel> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Deterministic simulation based on suburb name length
    if (suburb.length > 10) return "HIGH";
    if (suburb.length > 7) return "MEDIUM";
    return "LOW";
}

export async function fetchBushfireRisk(suburb: string): Promise<RiskLevel> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (suburb.toLowerCase().includes("hills") || suburb.toLowerCase().includes("valley")) {
        return "HIGH";
    }
    return "LOW";
}

export async function fetchGrowthTrends(suburb: string): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Return a random-ish growth between -5 and +15
    const hash = suburb.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 20) - 5;
}

export async function fetchZoningStatus(suburb: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 900));

    return suburb.length % 4 === 0;
}

export async function fetchExternalDueDiligence(suburb: string): Promise<ExternalDueDiligence> {
    const [floodRisk, bushfireRisk, recentComparableDeltaPct, zoningChangeFlag] = await Promise.all([
        fetchFloodRisk(suburb),
        fetchBushfireRisk(suburb),
        fetchGrowthTrends(suburb),
        fetchZoningStatus(suburb),
    ]);

    return {
        floodRisk,
        bushfireRisk,
        recentComparableDeltaPct,
        zoningChangeFlag,
    };
}
