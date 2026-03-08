interface AuditLog {
  id: string;
  organizationId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

const logs: AuditLog[] = [];

export function writeAuditLog(log: Omit<AuditLog, "id" | "createdAt">): AuditLog {
  const entry: AuditLog = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...log,
  };

  logs.unshift(entry);
  return entry;
}

export function listAuditLogs(limit = 100): AuditLog[] {
  return logs.slice(0, limit);
}
