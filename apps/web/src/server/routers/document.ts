import { protectedProcedure, router } from "@/lib/trpc/server";
import { registerDocumentUpload } from "@/server/data/data-access";
import { getSignedReadUrl, initiateDocumentUpload } from "@/server/services/documents";
import { documentSignedUrlInput, documentUploadInitiateInput } from "@/server/validators";

export const documentRouter = router({
  upload: router({
    initiate: protectedProcedure.input(documentUploadInitiateInput).mutation(async ({ ctx, input }) => {
      const initiated = initiateDocumentUpload(input);
      await registerDocumentUpload(ctx.session, input, initiated.storageKey);
      return initiated;
    }),
  }),

  getSignedUrl: protectedProcedure.input(documentSignedUrlInput).query(({ input }) => {
    return getSignedReadUrl(input);
  }),
});
