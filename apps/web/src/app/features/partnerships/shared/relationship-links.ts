/**
 * Router link builders for the partnership lifecycle chain
 * (Institution → Proposal → SOW → Delivery → Report → Renewal).
 *
 * These only build routerLink arrays from known IDs — they never fetch data or
 * invent relationships. Pass a falsy id to get `null` back so callers can skip
 * rendering a crumb for an unknown link.
 */

export type RelationshipLink = unknown[] | null;

const link = (segment: string, id: string | null | undefined): RelationshipLink =>
  id ? ['/partnerships', segment, id] : null;

export function institutionLink(id: string | null | undefined): RelationshipLink {
  return link('institutions', id);
}

export function proposalLink(id: string | null | undefined): RelationshipLink {
  return link('proposals', id);
}

export function sowLink(id: string | null | undefined): RelationshipLink {
  return link('sows', id);
}

export function deliveryLink(id: string | null | undefined): RelationshipLink {
  return link('delivery', id);
}

export function reportLink(id: string | null | undefined): RelationshipLink {
  return link('reports', id);
}

export function opportunityLink(id: string | null | undefined): RelationshipLink {
  return link('renewals', id);
}

export function programLink(id: string | null | undefined): RelationshipLink {
  return link('programs', id);
}

export function offeringLink(id: string | null | undefined): RelationshipLink {
  return link('offerings', id);
}
