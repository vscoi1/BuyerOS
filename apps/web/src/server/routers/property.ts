import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import { emitEvent } from "@/server/events";
import {
  createProperty,
  getProperty,
  listProperties,
  updateProperty,
  updatePropertyMatchScore,
  listDocuments,
  getDocumentWithFlags,
  extractDocumentRedFlags,
  updateRedFlagStatus,
  generateDealKillerReport,
} from "@/server/data/data-access";
import { calculatePropertyMatch } from "@/server/services/matching-engine";
import {
  propertyCreateInput,
  propertyListInput,
  propertyScoreRecomputeInput,
  documentListInput,
  documentGetInput,
  documentRedFlagExtractInput,
  documentRedFlagUpdateStatusInput,
  dealKillerReportGenerateInput,
} from "@/server/validators";

export const propertyRouter = router({
  create: protectedProcedure.input(propertyCreateInput).mutation(async ({ ctx, input }) => {
    const property = await createProperty(ctx.session, input);

    writeAuditLog({
      organizationId: ctx.session.organizationId,
      actorId: ctx.session.user.id,
      action: "property.create",
      entityType: "property",
      entityId: property.id,
    });

    return property;
  }),

  update: protectedProcedure
    .input(
      propertyCreateInput.partial().extend({
        id: propertyScoreRecomputeInput.shape.propertyId,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateProperty(ctx.session, input);
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      writeAuditLog({
        organizationId: ctx.session.organizationId,
        actorId: ctx.session.user.id,
        action: "property.update",
        entityType: "property",
        entityId: updated.id,
      });

      return updated;
    }),

  list: protectedProcedure.input(propertyListInput).query(async ({ ctx, input }) => listProperties(ctx.session, input)),

  score: router({
    recompute: protectedProcedure.input(propertyScoreRecomputeInput).mutation(async ({ ctx, input }) => {
      const property = await getProperty(ctx.session, input.propertyId);
      if (!property) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const match = calculatePropertyMatch({
        suburb: property.suburb,
        state: property.state,
        targetSuburbs: input.targetSuburbs,
        targetStates: [property.state],
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        price: property.price,
        isOffMarket: property.isOffMarket,
        isOffMarketPreferred: input.isOffMarketPreferred,
        urgency: "WARM",
      });

      const updatedProperty = await updatePropertyMatchScore(ctx.session, input.propertyId, match.score);
      if (!updatedProperty) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      writeAuditLog({
        organizationId: ctx.session.organizationId,
        actorId: ctx.session.user.id,
        action: "property.score.recompute",
        entityType: "property",
        entityId: updatedProperty.id,
      });

      emitEvent(ctx.session.organizationId, "property.scored", {
        propertyId: updatedProperty.id,
        score: updatedProperty.matchScore,
        category: match.category,
      });

      return {
        property: updatedProperty,
        match,
      };
    }),
  }),

  generateDealKiller: protectedProcedure
    .input(dealKillerReportGenerateInput)
    .mutation(async ({ ctx, input }) => {
      const result = await generateDealKillerReport(ctx.session, input.propertyId);

      writeAuditLog({
        organizationId: ctx.session.organizationId,
        actorId: ctx.session.user.id,
        action: "property.generateDealKiller",
        entityType: "property",
        entityId: input.propertyId,
        metadata: { flagsCount: result.flagsCount },
      });

      return result.report;
    }),

  document: router({
    list: protectedProcedure
      .input(documentListInput)
      .query(({ ctx, input }) => listDocuments(ctx.session, input.propertyId)),

    get: protectedProcedure
      .input(documentGetInput)
      .query(({ ctx, input }) => getDocumentWithFlags(ctx.session, input.documentId)),

    extractFlags: protectedProcedure
      .input(documentRedFlagExtractInput)
      .mutation(async ({ ctx, input }) => {
        const flags = await extractDocumentRedFlags(ctx.session, input.documentId);

        writeAuditLog({
          organizationId: ctx.session.organizationId,
          actorId: ctx.session.user.id,
          action: "document.extractFlags",
          entityType: "document",
          entityId: input.documentId,
        });

        return flags;
      }),

    approveFlag: protectedProcedure
      .input(documentRedFlagUpdateStatusInput)
      .mutation(async ({ ctx, input }) => {
        const flag = await updateRedFlagStatus(ctx.session, input.flagId, "APPROVED");
        if (!flag) throw new TRPCError({ code: "NOT_FOUND" });
        return flag;
      }),

    rejectFlag: protectedProcedure
      .input(documentRedFlagUpdateStatusInput)
      .mutation(async ({ ctx, input }) => {
        const flag = await updateRedFlagStatus(ctx.session, input.flagId, "REJECTED");
        if (!flag) throw new TRPCError({ code: "NOT_FOUND" });
        return flag;
      }),
  }),
});
