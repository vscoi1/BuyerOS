import { protectedProcedure, router } from "@/lib/trpc/server";
import { emitEvent } from "@/server/events";
import { parseBrief } from "@/server/services/brief-parser";
import { briefParseInput } from "@/server/validators";

export const briefRouter = router({
  parse: protectedProcedure.input(briefParseInput).mutation(({ ctx, input }) => {
    const parsed = parseBrief(input);

    emitEvent("brief.parsed", {
      organizationId: ctx.session.organizationId,
      agentId: ctx.session.user.id,
      confidence: parsed.confidence,
    });

    return parsed;
  }),
});
