import { protectedProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { writeAuditLog } from "@/server/audit";
import { canAccessDocumentStorageKey, registerDocumentUpload } from "@/server/data/data-access";
import { getSignedReadUrl, initiateDocumentUpload } from "@/server/services/documents";
import { documentSignedUrlInput, documentUploadInitiateInput } from "@/server/validators";

export const documentRouter = router({
  upload: router({
    initiate: protectedProcedure.input(documentUploadInitiateInput).mutation(async ({ ctx, input }) => {
      const initiated = initiateDocumentUpload(input);
      await registerDocumentUpload(ctx.session, input, initiated.storageKey);

      writeAuditLog({
        organizationId: ctx.session.organizationId,
        actorId: ctx.session.user.id,
        action: "document.upload.initiate",
        entityType: "property",
        entityId: input.propertyId,
      });

      return initiated;
    }),
  }),

  getSignedUrl: protectedProcedure.input(documentSignedUrlInput).query(async ({ ctx, input }) => {
    const allowed = await canAccessDocumentStorageKey(ctx.session, input.storageKey);
    if (!allowed) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    writeAuditLog({
      organizationId: ctx.session.organizationId,
      actorId: ctx.session.user.id,
      action: "document.read.signed_url",
      entityType: "document",
      entityId: input.storageKey,
    });

    return getSignedReadUrl(input);
  }),
});
