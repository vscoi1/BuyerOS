import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
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
      .mutation(async ({ ctx, input }) => {
        const session = await createPortalSession(ctx.session, input.clientId);

        writeAuditLog({
          organizationId: ctx.session.organizationId,
          actorId: ctx.session.user.id,
          action: "portal.session.create",
          entityType: "client",
          entityId: input.clientId,
        });

        return session;
      }),
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

      writeAuditLog({
        organizationId: ctx.session.organizationId,
        actorId: ctx.session.user.id,
        action: "portal.feedback.submit",
        entityType: "property",
        entityId: input.propertyId,
      });

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
