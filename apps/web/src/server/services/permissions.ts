export interface AccessScope {
  organizationId: string;
  actorAgentId: string;
}

export interface RecordScope {
  organizationId: string;
  ownerAgentId?: string;
}

export function canAccessRecord(actor: AccessScope, record: RecordScope): boolean {
  if (actor.organizationId !== record.organizationId) {
    return false;
  }

  if (!record.ownerAgentId) {
    return true;
  }

  return actor.actorAgentId === record.ownerAgentId;
}
