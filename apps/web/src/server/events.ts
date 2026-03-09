export type DomainEventType =
  | "brief.parsed"
  | "property.scored"
  | "due_diligence.completed"
  | "risk_flag.generated"
  | "off_market.received"
  | "client_update.pending_approval"
  | "compliance.checklist.updated"
  | "compliance.checklist.evidence_attached"
  | "compliance.checklist.migrated";

export interface DomainEvent {
  id: string;
  organizationId: string;
  type: DomainEventType;
  createdAt: string;
  payload: Record<string, unknown>;
}

const events: DomainEvent[] = [];

export function emitEvent(
  organizationId: string,
  type: DomainEventType,
  payload: Record<string, unknown>,
): DomainEvent {
  const event: DomainEvent = {
    id: crypto.randomUUID(),
    organizationId,
    type,
    createdAt: new Date().toISOString(),
    payload,
  };

  events.unshift(event);
  return event;
}

export function listEvents(organizationId: string, limit = 50): DomainEvent[] {
  return events.filter((e) => e.organizationId === organizationId).slice(0, limit);
}
