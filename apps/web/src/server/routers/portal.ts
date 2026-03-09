import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import {
  createPortalFeedback,
  createPortalSession,
  listPortalMilestones,
  listPortalShortlist,
  revokePortalSession,
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

    revoke: protectedProcedure
      .input(portalSessionCreateInput)
      .mutation(async ({ ctx, input }) => {
        if (ctx.session.user.role === "ASSISTANT") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only ADMIN or AGENT can revoke portal sessions.",
          });
        }

        await revokePortalSession(ctx.session, input.clientId);

        writeAuditLog({
          organizationId: ctx.session.organizationId,
          actorId: ctx.session.user.id,
          action: "portal.session.revoke",
          entityType: "client",
          entityId: input.clientId,
        });

        return { revoked: true };
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

      emitEvent(ctx.session.organizationId, "client_update.pending_approval", {
        clientId: input.clientId,
        propertyId: input.propertyId,
        status: input.status,
      });

      return feedback;
    }),
  }),
});
