import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { resolvePortalSession } from "@/server/data/data-access";

export async function createTRPCContext() {
  const session = await auth();
  const cookieStore = await cookies();
  const portalToken = cookieStore.get(env.portalSessionCookieName)?.value;
  const portalClient = portalToken ? await resolvePortalSession(portalToken) : null;
  return { session, portalClient };
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUser = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUser);

const enforcePortalClient = t.middleware(({ ctx, next }) => {
  if (!ctx.portalClient) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: ctx.session,
      portalClient: ctx.portalClient,
    },
  });
});

export const portalClientProcedure = t.procedure.use(enforcePortalClient);
