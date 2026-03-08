import { PageHeader } from "@/components/layout/PageHeader";
import { BriefWorkbench } from "@/components/dashboard/BriefWorkbench";
import { SuburbInsightCard } from "@/components/ai/SuburbInsightCard";

export default function IntelligencePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Intelligence" subtitle="AI brief parsing and suburb intelligence" />
      <BriefWorkbench />
      <section className="grid gap-4 lg:grid-cols-2">
        <SuburbInsightCard
          suburb="Brunswick"
          state="VIC"
          growthScore={82}
          yieldRange="3.9%-4.4%"
          rationale="Low vacancy, strong transport upgrades, and stable owner-occupier demand support medium-term growth."
        />
        <SuburbInsightCard
          suburb="Ryde"
          state="NSW"
          growthScore={79}
          yieldRange="3.4%-3.8%"
          rationale="Balanced supply pipeline with steady family demand and improving school-catchment pull factors."
        />
      </section>
    </div>
  );
}
