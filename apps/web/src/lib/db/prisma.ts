import { PrismaClient } from "@prisma/client";

declare global {
  var __buyersosPrisma: PrismaClient | undefined;
}

function hasDatabaseUrl(): boolean {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL;
  return Boolean(databaseUrl && databaseUrl.trim().length > 0);
}

function resolveDatabaseUrl(): string | undefined {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    return undefined;
  }
  return databaseUrl;
}

export function getPrismaClient(): PrismaClient | null {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  if (!global.__buyersosPrisma) {
    try {
      global.__buyersosPrisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
    } catch (error) {
      console.error("Prisma client unavailable, falling back to in-memory store", error);
      return null;
    }
  }

  return global.__buyersosPrisma;
}

export function isPersistentStorageEnabled(): boolean {
  return hasDatabaseUrl();
}
