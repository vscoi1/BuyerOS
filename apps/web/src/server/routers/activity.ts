import { z } from "zod";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { listAuditLogs } from "@/server/audit";
import { listEvents } from "@/server/events";

const auditListInput = z.object({
    limit: z.number().min(1).max(100).default(50),
    cursor: z.string().optional(),
});

const eventsListInput = z.object({
    limit: z.number().min(1).max(100).default(50),
});

export const activityRouter = router({
    /**
     * Paginated audit trail for the calling agent's organization.
     * Falls back to in-memory when DB is unavailable.
     */
    listAudit: protectedProcedure.input(auditListInput).query(async ({ ctx, input }) => {
        return listAuditLogs(ctx.session.organizationId, input.limit, input.cursor);
    }),

    /**
     * Recent domain events scoped to the calling agent's organization.
     */
    listEvents: protectedProcedure.input(eventsListInput).query(({ ctx, input }) => {
        return listEvents(ctx.session.organizationId, input.limit);
    }),
});
