import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import {
  attachComplianceEvidence,
  getComplianceChecklist,
  listComplianceChecklists,
  migrateComplianceChecklist,
  updateComplianceChecklistItem,
} from "@/server/data/data-access";
import { emitEvent } from "@/server/events";
import {
  complianceChecklistAttachEvidenceInput,
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

        emitEvent(ctx.session.organizationId, "compliance.checklist.updated", {
          state: input.state,
          code: input.code,
          completed: input.completed,
        });

        return checklist;
      }),

    attachEvidence: protectedProcedure
      .input(complianceChecklistAttachEvidenceInput)
      .mutation(async ({ ctx, input }) => {
        const checklist = await attachComplianceEvidence(ctx.session, input);
        if (!checklist) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        writeAuditLog({
          organizationId: ctx.session.organizationId,
          actorId: ctx.session.user.id,
          action: "compliance.checklist.attach_evidence",
          entityType: "compliance_checklist",
          entityId: `${input.state}:${input.code}`,
        });

        emitEvent(ctx.session.organizationId, "compliance.checklist.evidence_attached", {
          state: input.state,
          code: input.code,
          fileName: input.fileName,
        });

        return checklist;
      }),

    migrate: protectedProcedure
      .input(complianceStateInput)
      .mutation(async ({ ctx, input }) => {
        const checklist = await migrateComplianceChecklist(ctx.session, input.state);

        writeAuditLog({
          organizationId: ctx.session.organizationId,
          actorId: ctx.session.user.id,
          action: "compliance.checklist.migrate",
          entityType: "compliance_checklist",
          entityId: input.state,
        });

        return checklist;
      }),
  }),
});
