import { getPrismaClient } from "@/lib/db/prisma";

export interface AuditLog {
  id: string;
  organizationId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// In-memory fallback — used when Prisma is unavailable
const logs: AuditLog[] = [];

/**
 * Writes an audit entry to the persistent AuditEvent table when a DB is available,
 * and always appends to the in-memory fallback list.
 */
export function writeAuditLog(
  log: Omit<AuditLog, "id" | "createdAt">,
): AuditLog {
  const entry: AuditLog = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...log,
  };

  // Persist to DB asynchronously — non-blocking, fire-and-forget
  const prisma = getPrismaClient();
  if (prisma) {
    prisma.auditEvent
      .create({
        data: {
          organizationId: entry.organizationId,
          actorId: entry.actorId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadataJson: (entry.metadata ?? {}) as object,
        },
      })
      .catch((err: unknown) => {
        console.error("[audit] Failed to persist audit event to DB:", err);
      });
  }

  logs.unshift(entry);
  return entry;
}

export interface AuditLogPage {
  items: AuditLog[];
  nextCursor: string | null;
}

/**
 * Lists audit entries for an org with cursor-based pagination.
 * Reads from Prisma when available, falls back to in-memory.
 */
export async function listAuditLogs(
  organizationId: string,
  limit = 50,
  cursor?: string,
): Promise<AuditLogPage> {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const rows = await prisma.auditEvent.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const lastItem = items[items.length - 1];

      return {
        items: items.map((row) => ({
          id: row.id,
          organizationId: row.organizationId,
          actorId: row.actorId,
          action: row.action,
          entityType: row.entityType,
          entityId: row.entityId,
          metadata: row.metadataJson as Record<string, unknown>,
          createdAt: row.createdAt.toISOString(),
        })),
        nextCursor: hasMore && lastItem ? lastItem.id : null,
      };
    } catch (err) {
      console.error("[audit] DB read failed, falling back to in-memory:", err);
    }
  }

  // In-memory fallback
  const all = logs.filter((l) => l.organizationId === organizationId);
  const startIdx = cursor ? all.findIndex((l) => l.id === cursor) + 1 : 0;
  const slice = all.slice(startIdx, startIdx + limit + 1);
  const hasMore = slice.length > limit;

  return {
    items: hasMore ? slice.slice(0, limit) : slice,
    nextCursor: hasMore && slice[limit - 1] ? slice[limit - 1].id : null,
  };
}
