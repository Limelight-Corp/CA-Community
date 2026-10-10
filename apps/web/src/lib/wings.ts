/** Wing hub data (server-only): ORG_WINGS + the CMS wing record + linked team, events and resources. */
import {
  ORG_WINGS,
  wingSlug,
  type CommunityEvent,
  type CommunityResource,
  type CommunityTeamMember,
  type CommunityWing,
  type OrgWing,
} from '@ascend/shared';
import { getItems } from './community-store';
import { isUpcoming, sortByDate } from './events';

export interface WingHub {
  number: number;
  slug: string;
  name: string;
  color: string;
  focus: string[];
  activities: string[];
  tags?: string;
}

const sameWing = (value: string | undefined, name: string) => !!value && value.trim().toLowerCase() === name.toLowerCase();

function toHub(org: OrgWing, store: CommunityWing[]): WingHub {
  const s = store.find((w) => w.number === org.number);
  return {
    number: org.number,
    slug: wingSlug(org.name),
    name: org.name,
    color: s?.color || 'var(--brand-500)',
    focus: org.focus,
    activities: s?.activities?.length ? s.activities : org.activities,
    tags: s?.tags,
  };
}

export function allWingHubs(): WingHub[] {
  const store = getItems<CommunityWing>('wings', true);
  return ORG_WINGS.map((w) => toHub(w, store));
}

export function findWingHub(slug: string): WingHub | undefined {
  return allWingHubs().find((w) => w.slug === slug);
}

export function wingPeople(hub: WingHub): { conveners: CommunityTeamMember[]; committee: CommunityTeamMember[] } {
  const team = getItems<CommunityTeamMember>('team', true)
    .filter((m) => sameWing(m.wing, hub.name))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return {
    conveners: team.filter((m) => m.group === 'Wing Conveners'),
    committee: team.filter((m) => m.group !== 'Wing Conveners'),
  };
}

export function wingEvents(hub: WingHub): { upcoming: CommunityEvent[]; past: CommunityEvent[] } {
  const events = getItems<CommunityEvent>('events', true).filter((e) => e.wingNumber === hub.number);
  return {
    upcoming: sortByDate(events.filter((e) => isUpcoming(e))),
    past: sortByDate(events.filter((e) => !isUpcoming(e))).reverse(),
  };
}

export function wingResources(hub: WingHub): CommunityResource[] {
  return getItems<CommunityResource>('resources', true).filter((r) => sameWing(r.wing, hub.name));
}
