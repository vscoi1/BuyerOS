import { TRPCError } from "@trpc/server";
import { portalClientProcedure, protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import {
  createPortalFeedback,
  createPortalFeedbackForClient,
  createPortalSession,
  getPortalClientProfile,
  listPortalMilestones,
  listPortalMilestonesForClient,
  listPortalPortfolioProjection,
  listPortalShortlist,
  listPortalShortlistForClient,
  listPortalDocumentsForClient,
  registerPortalDocumentUpload,
  revokePortalSession,
} from "@/server/data/data-access";
import { emitEvent } from "@/server/events";
import { initiateDocumentUpload } from "@/server/services/documents";
import {
  documentUploadInitiateInput,
  portalFeedbackByClientInput,
  portalFeedbackInput,
  portalSessionClientInput,
  portalSessionCreateInput,
  portalSessionRotateInput,
} from "@/server/validators";

export const portalRouter = router({
  session: router({
    create: protectedProcedure
      .input(portalSessionCreateInput)
      .mutation(async ({ ctx, input }) => {
        if (ctx.session.user.role === "ASSISTANT") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only ADMIN or AGENT can create portal sessions.",
          });
        }

        const session = await createPortalSession(ctx.session, input);
        const mode = input.oneTime ? "one_time" : "standard";

        writeAuditLog({
          organizationId: ctx.session.organizationId,
          actorId: ctx.session.user.id,
          action: "portal.session.create",
          entityType: "client",
          entityId: input.clientId,
          metadata: {
            mode,
            rotateExisting: input.rotateExisting ?? false,
            ttlHours: input.ttlHours ?? 24 * 7,
          },
        });

        return session;
      }),

    createOneTime: protectedProcedure
      .input(portalSessionClientInput)
      .mutation(async ({ ctx, input }) => {
        if (ctx.session.user.role === "ASSISTANT") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only ADMIN or AGENT can create one-time portal sessions.",
          });
        }

        const session = await createPortalSession(ctx.session, {
          clientId: input.clientId,
          oneTime: true,
          rotateExisting: true,
          ttlHours: 24,
        });

        writeAuditLog({
          organizationId: ctx.session.organizationId,
          actorId: ctx.session.user.id,
          action: "portal.session.create_one_time",
          entityType: "client",
          entityId: input.clientId,
        });

        return session;
      }),

    rotate: protectedProcedure
      .input(portalSessionRotateInput)
      .mutation(async ({ ctx, input }) => {
        if (ctx.session.user.role === "ASSISTANT") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only ADMIN or AGENT can rotate portal sessions.",
          });
        }

        const session = await createPortalSession(ctx.session, {
          clientId: input.clientId,
          ttlHours: input.ttlHours ?? 24 * 7,
          oneTime: false,
          rotateExisting: true,
        });

        writeAuditLog({
          organizationId: ctx.session.organizationId,
          actorId: ctx.session.user.id,
          action: "portal.session.rotate",
          entityType: "client",
          entityId: input.clientId,
          metadata: {
            ttlHours: input.ttlHours ?? 24 * 7,
          },
        });

        return session;
      }),

    revoke: protectedProcedure
      .input(portalSessionClientInput)
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

  client: router({
    me: portalClientProcedure.query(async ({ ctx }) => {
      return getPortalClientProfile(ctx.portalClient);
    }),

    shortlist: portalClientProcedure.query(async ({ ctx }) => {
      return listPortalShortlistForClient(ctx.portalClient);
    }),

    milestones: portalClientProcedure.query(async ({ ctx }) => {
      return listPortalMilestonesForClient(ctx.portalClient);
    }),

    documents: router({
      list: portalClientProcedure.query(async ({ ctx }) => {
        return listPortalDocumentsForClient(ctx.portalClient);
      }),
      upload: portalClientProcedure
        .input(documentUploadInitiateInput)
        .mutation(async ({ ctx, input }) => {
          const initiated = initiateDocumentUpload(input);
          try {
            await registerPortalDocumentUpload(ctx.portalClient, input, initiated.storageKey);
          } catch (error) {
            if (error instanceof Error && error.message === "NOT_FOUND") {
              throw new TRPCError({ code: "FORBIDDEN" });
            }
            throw error;
          }

          writeAuditLog({
            organizationId: ctx.portalClient.organizationId,
            actorId: `portal:${ctx.portalClient.clientId}`,
            action: "portal.client.document.upload.initiate",
            entityType: "property",
            entityId: input.propertyId,
          });

          return initiated;
        }),
    }),

    portfolio: router({
      projection10Y: portalClientProcedure.query(async ({ ctx }) => {
        return listPortalPortfolioProjection(ctx.portalClient);
      }),
    }),

    feedback: portalClientProcedure
      .input(portalFeedbackByClientInput)
      .mutation(async ({ ctx, input }) => {
        const feedback = await createPortalFeedbackForClient(ctx.portalClient, input);

        writeAuditLog({
          organizationId: ctx.portalClient.organizationId,
          actorId: `portal:${ctx.portalClient.clientId}`,
          action: "portal.client.feedback.submit",
          entityType: "property",
          entityId: input.propertyId,
        });

        emitEvent(ctx.portalClient.organizationId, "client_update.pending_approval", {
          clientId: ctx.portalClient.clientId,
          propertyId: input.propertyId,
          status: input.status,
        });

        return feedback;
      }),
  }),

  shortlist: router({
    list: protectedProcedure
      .input(portalSessionClientInput)
      .query(async ({ ctx, input }) => listPortalShortlist(ctx.session, input.clientId)),
  }),

  milestones: router({
    list: protectedProcedure
      .input(portalSessionClientInput)
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
