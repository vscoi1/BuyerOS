import { protectedProcedure, router } from "@/lib/trpc/server";
import {
  createPortalFeedback,
  createPortalSession,
  listPortalMilestones,
  listPortalShortlist,
} from "@/server/data/data-access";
import { emitEvent } from "@/server/events";
import { portalFeedbackInput, portalSessionCreateInput } from "@/server/validators";

export const portalRouter = router({
  session: router({
    create: protectedProcedure
      .input(portalSessionCreateInput)
      .mutation(async ({ ctx, input }) => createPortalSession(ctx.session, input.clientId)),
  }),

  shortlist: router({
    list: protectedProcedure
      .input(portalSessionCreateInput)
      .query(async ({ ctx, input }) => listPortalShortlist(ctx.session, input.clientId)),
  }),

  milestones: router({
    list: protectedProcedure
      .input(portalSessionCreateInput)
      .query(async ({ ctx, input }) => listPortalMilestones(ctx.session, input.clientId)),
  }),

  feedback: router({
    submit: protectedProcedure.input(portalFeedbackInput).mutation(async ({ ctx, input }) => {
      const feedback = await createPortalFeedback(ctx.session, input);

      emitEvent("client_update.pending_approval", {
        organizationId: ctx.session.organizationId,
        clientId: input.clientId,
        propertyId: input.propertyId,
        status: input.status,
      });

      return feedback;
    }),
  }),
});
