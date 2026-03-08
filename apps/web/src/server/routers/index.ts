import { router } from "@/lib/trpc/server";
import { analysisRouter } from "@/server/routers/analysis";
import { briefRouter } from "@/server/routers/brief";
import { clientRouter } from "@/server/routers/client";
import { complianceRouter } from "@/server/routers/compliance";
import { documentRouter } from "@/server/routers/document";
import { dueDiligenceRouter } from "@/server/routers/due-diligence";
import { offMarketRouter } from "@/server/routers/off-market";
import { portalRouter } from "@/server/routers/portal";
import { propertyRouter } from "@/server/routers/property";

export const appRouter = router({
  clients: clientRouter,
  brief: briefRouter,
  property: propertyRouter,
  dueDiligence: dueDiligenceRouter,
  offMarket: offMarketRouter,
  document: documentRouter,
  portal: portalRouter,
  analysis: analysisRouter,
  compliance: complianceRouter,
});

export type AppRouter = typeof appRouter;
