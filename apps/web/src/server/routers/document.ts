import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import { registerDocumentUpload } from "@/server/data/data-access";
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

  // TODO(P1.3): enforce document ownership once Document table has tenant scope.
  // Currently any authenticated user can request a signed URL for any storageKey.
  getSignedUrl: protectedProcedure.input(documentSignedUrlInput).query(({ input }) => {
    return getSignedReadUrl(input);
  }),
});
