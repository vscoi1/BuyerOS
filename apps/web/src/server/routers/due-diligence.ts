import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import { emitEvent } from "@/server/events";
import { getDueDiligence, getProperty, saveDueDiligence, PersistedDueDiligenceReport } from "@/server/data/data-access";
import { runDueDiligence } from "@/server/services/due-diligence";
import { dueDiligenceGetInput, dueDiligenceRunInput } from "@/server/validators";
import {
  fetchBushfireRisk,
  fetchFloodRisk,
  fetchGrowthTrends,
  fetchZoningStatus
} from "@/server/services/due-diligence/adapters";
import {
  initiateExternalFetch,
  updateDueDiligenceResult
} from "@/server/data/data-access";
import { z } from "zod";

export const dueDiligenceRouter = router({
  run: protectedProcedure.input(dueDiligenceRunInput).mutation(async ({ ctx, input }) => {
    const property = await getProperty(ctx.session, input.propertyId);
    if (!property) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const result = runDueDiligence(input);
    const record: PersistedDueDiligenceReport = {
      propertyId: input.propertyId,
      floodRisk: input.floodRisk ?? "LOW",
      bushfireRisk: input.bushfireRisk ?? "LOW",
      zoningChangeFlag: input.zoningChangeFlag ?? false,
      recentComparableDeltaPct: input.recentComparableDeltaPct ?? 0,
      ...result,
      status: "COMPLETED",
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

    emitEvent(ctx.session.organizationId, "due_diligence.completed", {
      propertyId: input.propertyId,
      riskScore: result.riskScore,
    });

    if (result.flags.length > 0) {
      emitEvent(ctx.session.organizationId, "risk_flag.generated", {
        propertyId: input.propertyId,
        flags: result.flags,
      });
    }

    return persisted;
  }),

  triggerExternalFetch: protectedProcedure
    .input(z.object({ propertyId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Initiate fetch (mark as PENDING)
      const initialReport = await initiateExternalFetch(ctx.session, input.propertyId);
      if (!initialReport) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to initialize due diligence fetch" });

      // 2. Schedule actual fetch in background
      // In this demo, we run it asynchronously without blocking the request
      (async () => {
        try {
          const property = await getProperty(ctx.session, input.propertyId);
          if (!property) return;

          // Fetch from mock adapters
          const [flood, bushfire, growth, zoning] = await Promise.all([
            fetchFloodRisk(property.suburb),
            fetchBushfireRisk(property.suburb),
            fetchGrowthTrends(property.suburb),
            fetchZoningStatus(property.suburb),
          ]);

          // Update result
          await updateDueDiligenceResult(ctx.session, input.propertyId, {
            floodRisk: flood,
            bushfireRisk: bushfire,
            zoningChangeFlag: zoning,
            recentComparableDeltaPct: growth,
          });

          // Emit event to notify UI
          emitEvent(ctx.session.organizationId, "due_diligence.completed", {
            propertyId: input.propertyId,
          });
        } catch (error) {
          console.error("External fetch failed:", error);
        }
      })();

      return { status: "PENDING" };
    }),

  get: protectedProcedure.input(dueDiligenceGetInput).query(async ({ ctx, input }) => {
    const property = await getProperty(ctx.session, input.propertyId);
    if (!property) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return getDueDiligence(ctx.session, input.propertyId);
  }),
});
