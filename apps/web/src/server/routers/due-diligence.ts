import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import { emitEvent } from "@/server/events";
import { getDueDiligence, getProperty, saveDueDiligence } from "@/server/data/data-access";
import { runDueDiligence } from "@/server/services/due-diligence";
import { dueDiligenceGetInput, dueDiligenceRunInput } from "@/server/validators";

export const dueDiligenceRouter = router({
  run: protectedProcedure.input(dueDiligenceRunInput).mutation(async ({ ctx, input }) => {
    const property = await getProperty(ctx.session, input.propertyId);
    if (!property) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const result = runDueDiligence(input);
    const record = {
      ...input,
      ...result,
      createdAt: new Date().toISOString(),
    };

    const persisted = await saveDueDiligence(ctx.session, input.propertyId, record);
    if (!persisted) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    writeAuditLog({
      organizationId: ctx.session.organizationId,
      actorId: ctx.session.user.id,
      action: "due_diligence.run",
      entityType: "property",
      entityId: input.propertyId,
    });

    emitEvent("due_diligence.completed", {
      organizationId: ctx.session.organizationId,
      propertyId: input.propertyId,
      riskScore: result.riskScore,
    });

    if (result.flags.length > 0) {
      emitEvent("risk_flag.generated", {
        organizationId: ctx.session.organizationId,
        propertyId: input.propertyId,
        flags: result.flags,
      });
    }

    return persisted;
  }),

  get: protectedProcedure.input(dueDiligenceGetInput).query(async ({ ctx, input }) => {
    const property = await getProperty(ctx.session, input.propertyId);
    if (!property) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return getDueDiligence(ctx.session, input.propertyId);
  }),
});
