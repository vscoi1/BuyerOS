import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import {
  getComplianceChecklist,
  listComplianceChecklists,
  updateComplianceChecklistItem,
} from "@/server/data/data-access";
import { emitEvent } from "@/server/events";
import {
  complianceChecklistUpdateItemInput,
  complianceStateInput,
} from "@/server/validators";

export const complianceRouter = router({
  checklist: router({
    list: protectedProcedure.query(async ({ ctx }) => listComplianceChecklists(ctx.session)),

    get: protectedProcedure
      .input(complianceStateInput)
      .query(async ({ ctx, input }) => getComplianceChecklist(ctx.session, input)),

    updateItem: protectedProcedure
      .input(complianceChecklistUpdateItemInput)
      .mutation(async ({ ctx, input }) => {
        const checklist = await updateComplianceChecklistItem(ctx.session, input);
        if (!checklist) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        writeAuditLog({
          organizationId: ctx.session.organizationId,
          actorId: ctx.session.user.id,
          action: "compliance.checklist.update_item",
          entityType: "compliance_checklist",
          entityId: `${input.state}:${input.code}`,
        });

        emitEvent("compliance.checklist.updated", {
          organizationId: ctx.session.organizationId,
          state: input.state,
          code: input.code,
          completed: input.completed,
        });

        return checklist;
      }),
  }),
});
