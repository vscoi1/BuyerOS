import { router, protectedProcedure } from "@/lib/trpc/server";
import { whisperIngestInput } from "@/server/validators";
import { ingestWhisperListing } from "@/server/data/data-access";
import { writeAuditLog } from "@/server/audit";

export const whisperRouter = router({
    ingest: protectedProcedure
        .input(whisperIngestInput)
        .mutation(async ({ ctx, input }) => {
            // 1. Ingest listing and mock AI parsing
            const { property, matchedClientIds } = await ingestWhisperListing(ctx.session, input.rawContent);

            // 2. Write Audit Log
            await writeAuditLog({
                organizationId: ctx.session.organizationId,
                actorId: ctx.session.user.id,
                entityType: "PROPERTY",
                entityId: property.id,
                action: "WHISPER_INGEST",
                metadata: { matchedCount: matchedClientIds.length },
            });

            return {
                success: true,
                property,
                matchedClientIds,
            };
        }),
});
