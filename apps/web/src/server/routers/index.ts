import { router } from "@/lib/trpc/server";
import { activityRouter } from "@/server/routers/activity";
import { analysisRouter } from "@/server/routers/analysis";
import { briefRouter } from "@/server/routers/brief";
import { clientRouter } from "@/server/routers/client";
import { complianceRouter } from "@/server/routers/compliance";
import { documentRouter } from "@/server/routers/document";
import { dueDiligenceRouter } from "@/server/routers/due-diligence";
import { offMarketRouter } from "@/server/routers/off-market";
import { portalRouter } from "@/server/routers/portal";
import { propertyRouter } from "@/server/routers/property";
import { aiAssistantRouter } from "@/server/routers/ai-assistant";
import { whisperRouter } from "@/server/routers/whisper";

export const appRouter = router({
  activity: activityRouter,
  clients: clientRouter,
  brief: briefRouter,
  property: propertyRouter,
  dueDiligence: dueDiligenceRouter,
  offMarket: offMarketRouter,
  document: documentRouter,
  portal: portalRouter,
  analysis: analysisRouter,
  compliance: complianceRouter,
  aiAssistant: aiAssistantRouter,
  whisper: whisperRouter,
});

export type AppRouter = typeof appRouter;
