import {
  PROTOTYPE_EVENTS,
  PROTOTYPE_WINGS,
  PROTOTYPE_SPEAKERS,
  PROTOTYPE_NEWS,
  PROTOTYPE_RESOURCES,
} from '../constants/prototype-data';

export interface CommunityEvent {
  id: string;
  slug: string;
  title: string;
  wingNumber: number;
  category: 'Conference' | 'Workshop' | 'Seminar' | 'Networking' | 'Training' | 'Career';
  date: string;
  time: string;
  venue: string;
  city: string;
  mode: 'Online' | 'Offline';
  fee: number;
  memberFee: number;
  seatsTotal: number;
  seatsTaken: number;
  speakerSlugs: string[];
  description: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityGalleryItem {
  id: string;
  title: string;
  category: 'Conferences' | 'Masterclasses' | 'Sports' | 'Social';
  date: string;
  location: string;
  accentGradient: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunitySpeaker {
  id: string;
  slug: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  avatarUrl?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityWing {
  id: string;
  number: number;
  name: string;
  color: string;
  tags: string;
  activities: string[];
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityNews {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityResource {
  id: string;
  title: string;
  category: string;
  format: string;
  isMembersOnly: boolean;
  downloads: number;
  fileUrl?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityStoreData {
  events: CommunityEvent[];
  gallery: CommunityGalleryItem[];
  speakers: CommunitySpeaker[];
  wings: CommunityWing[];
  news: CommunityNews[];
  resources: CommunityResource[];
}

export const INITIAL_COMMUNITY_DATA: CommunityStoreData = {
  events: PROTOTYPE_EVENTS.map((e, idx) => ({
    id: `evt-${idx + 1}`,
    ...e,
    category: e.category as CommunityEvent['category'],
    isPublished: true,
    createdAt: new Date().toISOString(),
  })),

  gallery: [
    {
      id: 'gal-1',
      title: 'National Tax Summit Opening Plenary',
      category: 'Conferences',
      date: 'January 2027',
      location: 'Bharat Mandapam, New Delhi',
      accentGradient: 'from-[#0C1A58] via-[#10298A] to-[#04081E]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-2',
      title: 'Young CA Speed Networking Lounge',
      category: 'Social',
      date: 'December 2026',
      location: 'Koramangala, Bengaluru',
      accentGradient: 'from-[#2B0E4D] via-[#481E7F] to-[#0D0517]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-3',
      title: 'AI Audit Lab Hands-on Coding Session',
      category: 'Masterclasses',
      date: 'November 2026',
      location: 'Gurugram Tech Center',
      accentGradient: 'from-[#0A3D36] via-[#12665C] to-[#031512]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-4',
      title: 'CA Premier Cricket League Finals',
      category: 'Sports',
      date: 'February 2027',
      location: 'Gymkhana Grounds, Mumbai',
      accentGradient: 'from-[#14307A] via-[#1D49BB] to-[#081333]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-5',
      title: 'Women Who Lead Executive Circle',
      category: 'Social',
      date: 'November 2026',
      location: 'Taj Lands End, Mumbai',
      accentGradient: 'from-[#4D0D40] via-[#7B1968] to-[#140210]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-6',
      title: 'GST Appellate Clinic & Case Discussion',
      category: 'Masterclasses',
      date: 'October 2026',
      location: 'The Orchid, Pune',
      accentGradient: 'from-[#502208] via-[#853C12] to-[#170902]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
  ],

  speakers: Object.values(PROTOTYPE_SPEAKERS).map((s, idx) => ({
    id: `spk-${idx + 1}`,
    ...s,
    isPublished: true,
    createdAt: new Date().toISOString(),
  })),

  wings: PROTOTYPE_WINGS.map((w) => ({
    id: `wing-${w.number}`,
    ...w,
    isPublished: true,
    createdAt: new Date().toISOString(),
  })),

  news: PROTOTYPE_NEWS.map((n, idx) => ({
    id: `news-${idx + 1}`,
    slug: n.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    ...n,
    isPublished: true,
    createdAt: new Date().toISOString(),
  })),

  resources: PROTOTYPE_RESOURCES.map((r, idx) => ({
    id: `res-${idx + 1}`,
    ...r,
    downloads: 140 + idx * 87,
    isMembersOnly: idx > 1,
    isPublished: true,
    createdAt: new Date().toISOString(),
  })),
};
