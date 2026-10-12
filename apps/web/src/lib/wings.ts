/** Wing hub data (server-only): the CMS wings (admin → Wings) + linked team, events and resources. */
import {
  wingSlug,
  wingsFromStore,
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
    activities: org.activities,
    tags: s?.tags,
  };
}

export async function allWingHubs(): Promise<WingHub[]> {
  const store = await getItems<CommunityWing>('wings');
  return wingsFromStore(store, true).map((w) => toHub(w, store));
}

export async function findWingHub(slug: string): Promise<WingHub | undefined> {
  return (await allWingHubs()).find((w) => w.slug === slug);
}

export async function wingPeople(hub: WingHub): Promise<{ conveners: CommunityTeamMember[]; committee: CommunityTeamMember[] }> {
  const team = (await getItems<CommunityTeamMember>('team', true))
    .filter((m) => sameWing(m.wing, hub.name))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return {
    conveners: team.filter((m) => m.group === 'Wing Conveners'),
    committee: team.filter((m) => m.group !== 'Wing Conveners'),
  };
}

export async function wingEvents(hub: WingHub): Promise<{ upcoming: CommunityEvent[]; past: CommunityEvent[] }> {
  const events = (await getItems<CommunityEvent>('events', true)).filter((e) => e.wingNumber === hub.number);
  return {
    upcoming: sortByDate(events.filter((e) => isUpcoming(e))),
    past: sortByDate(events.filter((e) => !isUpcoming(e))).reverse(),
  };
}

export async function wingResources(hub: WingHub): Promise<CommunityResource[]> {
  return (await getItems<CommunityResource>('resources', true)).filter((r) => sameWing(r.wing, hub.name));
}
