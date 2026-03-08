export type DomainEventType =
  | "brief.parsed"
  | "property.scored"
  | "due_diligence.completed"
  | "risk_flag.generated"
  | "off_market.received"
  | "client_update.pending_approval"
  | "compliance.checklist.updated";

export interface DomainEvent {
  id: string;
  type: DomainEventType;
  createdAt: string;
  payload: Record<string, unknown>;
}

const events: DomainEvent[] = [];

export function emitEvent(type: DomainEventType, payload: Record<string, unknown>): DomainEvent {
  const event: DomainEvent = {
    id: crypto.randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    payload,
  };

  events.unshift(event);
  return event;
}

export function listEvents(limit = 50): DomainEvent[] {
  return events.slice(0, limit);
}
