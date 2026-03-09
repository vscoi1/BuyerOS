import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import {
  assignOffMarketSubmission,
  createOffMarketSubmission,
  listAgents,
  listOffMarketSubmissions,
  recommendAgentsForSubmission,
} from "@/server/data/data-access";
import { emitEvent } from "@/server/events";
import { offMarketAssignInput, offMarketSubmitInput } from "@/server/validators";

export const offMarketRouter = router({
  submit: protectedProcedure.input(offMarketSubmitInput).mutation(async ({ ctx, input }) => {
    const submission = await createOffMarketSubmission(ctx.session, input);

    writeAuditLog({
      organizationId: ctx.session.organizationId,
      actorId: ctx.session.user.id,
      action: "off_market.submit",
      entityType: "off_market_submission",
      entityId: submission.id,
    });

    emitEvent(ctx.session.organizationId, "off_market.received", {
      submissionId: submission.id,
      suburb: submission.suburb,
    });

    return submission;
  }),

  list: protectedProcedure.query(async ({ ctx }) => listOffMarketSubmissions(ctx.session)),

  listAgents: protectedProcedure.query(async ({ ctx }) => listAgents(ctx.session)),

  recommendAgents: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ ctx, input }) => recommendAgentsForSubmission(ctx.session, input.submissionId)),

  assign: protectedProcedure.input(offMarketAssignInput).mutation(async ({ ctx, input }) => {
    const submission = await assignOffMarketSubmission(ctx.session, input.submissionId, input.agentId);
    if (!submission) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    writeAuditLog({
      organizationId: ctx.session.organizationId,
      actorId: ctx.session.user.id,
      action: "off_market.assign",
      entityType: "off_market_submission",
      entityId: submission.id,
    });

    return submission;
  }),
});
