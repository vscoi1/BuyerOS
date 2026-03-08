export async function GET() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL;
  let dbHost: string | null = null;

  if (databaseUrl) {
    try {
      dbHost = new URL(databaseUrl).hostname;
    } catch {
      dbHost = "invalid_url";
    }
  }

  return Response.json({
    status: "ok",
    service: "buyersos-web",
    timestamp: new Date().toISOString(),
    runtime: {
      nodeEnv: process.env.NODE_ENV ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
    database: {
      configured: Boolean(databaseUrl),
      host: dbHost,
    },
  });
}
