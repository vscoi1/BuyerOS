import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { writeAuditLog } from "@/server/audit";
import { createClient, getClient, listClients, updateClient } from "@/server/data/data-access";
import { clientCreateInput, clientUpdateInput } from "@/server/validators";

export const clientRouter = router({
  create: protectedProcedure.input(clientCreateInput).mutation(async ({ ctx, input }) => {
    const client = await createClient(ctx.session, input);

    writeAuditLog({
      organizationId: ctx.session.organizationId,
      actorId: ctx.session.user.id,
      action: "client.create",
      entityType: "client",
      entityId: client.id,
    });

    return client;
  }),

  update: protectedProcedure.input(clientUpdateInput).mutation(async ({ ctx, input }) => {
    const updated = await updateClient(ctx.session, input);
    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    writeAuditLog({
      organizationId: ctx.session.organizationId,
      actorId: ctx.session.user.id,
      action: "client.update",
      entityType: "client",
      entityId: updated.id,
    });

    return updated;
  }),

  get: protectedProcedure.input(clientUpdateInput.pick({ id: true })).query(async ({ ctx, input }) => {
    const client = await getClient(ctx.session, input.id);
    if (!client) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return client;
  }),

  list: protectedProcedure.query(async ({ ctx }) => listClients(ctx.session)),
});
