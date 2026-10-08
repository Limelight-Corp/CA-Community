export interface WingSeed {
  number: number;
  name: string;
  color: string;
  tags: string;
  activities: string[];
}

export const PROTOTYPE_WINGS: WingSeed[] = [
  {
    number: 1,
    name: 'Tax & Regulatory',
    color: '#2F6FE4',
    tags: 'Direct Tax · International Tax · GST · Customs',
    activities: ['Tax Update Live', 'Case Law Café', 'Tax Masterclass', 'GST Clinic', 'Tax Litigation Room', 'Annual Tax Summit'],
  },
  {
    number: 2,
    name: 'Audit, Assurance & Finance',
    color: '#12907F',
    tags: 'Audit · Accounting · Financial Reporting · Risk',
    activities: ['Audit Update Hour', 'Standards Simplified', 'CFO Conversations', 'Risk & Controls Forum', 'Audit Technology Lab', 'Annual Audit & Finance Summit'],
  },
  {
    number: 3,
    name: 'Practice & Entrepreneurship',
    color: '#EA7A1E',
    tags: 'Practice Growth · Business Building · Client Acquisition',
    activities: ['Build Your Practice', 'The Modern CA Firm', 'Pricing Your Expertise', 'Client Acquisition Lab', 'From Solo to Scale', 'CA Business Leaders Summit'],
  },
  {
    number: 4,
    name: 'Industry & Leadership',
    color: '#6E44E0',
    tags: 'CFO Ecosystem · Corporate Leadership · Board Readiness',
    activities: ['Inside the CFO Office', 'CA to CXO', 'Boardroom Conversations', 'Career Switch Stories', 'Leadership Masterclass', 'Future CFO Summit'],
  },
  {
    number: 5,
    name: 'AI, Technology & Automation',
    color: '#14A89A',
    tags: 'AI for CAs · Automation · Digital Transformation',
    activities: ['AI for the Modern CA', 'Automation Friday', 'AI Tax Lab', 'AI Audit Lab', 'Build Your First AI Workflow', 'Future of the CA Profession Summit'],
  },
  {
    number: 6,
    name: 'Young Professionals & Career',
    color: '#E3365E',
    tags: 'Students · Young CAs · Mentorship',
    activities: ['CA Career Compass', 'First 100 Days as a CA', 'CV & LinkedIn Clinic', 'Young CA Speed Networking', 'Mentor Match', 'Young CA Leadership Summit'],
  },
  {
    number: 7,
    name: 'Women Professionals',
    color: '#A035D8',
    tags: 'Leadership · Entrepreneurship · Mentoring',
    activities: ['Women Who Lead', 'Return & Rise', 'Women Entrepreneur Circle', 'MentorHer', 'Women CFO Conversations', 'Women Leadership Summit'],
  },
  {
    number: 8,
    name: 'Sports, Fitness & Wellness',
    color: '#2459D8',
    tags: 'Sports · Fitness · Mental Health · Family',
    activities: ['CA Cricket League', 'CA Badminton Cup', 'Run for the Profession', '30-Day Fitness Challenge', 'Mind & Work', 'Annual CA Sports Festival'],
  },
  {
    number: 9,
    name: 'Social Impact & Community',
    color: '#D9A20E',
    tags: 'Financial Literacy · CSR · Volunteering',
    activities: ['CA Gives Back', 'Financial Literacy Drive', 'Teach & Mentor', 'Pro Bono Professional Day', 'Green Professional Initiative', 'Community Impact Summit'],
  },
  {
    number: 10,
    name: 'Global Network & International',
    color: '#0B66BC',
    tags: 'Global CA Connect · Study Tours · International Tax',
    activities: ['Global CA Connect', 'CA Across Borders', 'International Tax Conversations', 'Meet the Global CFO', 'International Learning Tour', 'Global CA Summit'],
  },
];

export interface SpeakerSeed {
  slug: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
}

export const PROTOTYPE_SPEAKERS: Record<string, SpeakerSeed> = {
  rm: {
    slug: 'rm',
    name: 'CA Rohan Mehta',
    title: 'Partner, International Tax · Mumbai',
    bio: 'Advises Indian groups on outbound structuring and treaty matters.',
    expertise: ['International Tax', 'Transfer Pricing'],
  },
  ps: {
    slug: 'ps',
    name: 'CA Priya Sharma',
    title: 'Director, Audit & Assurance · Bengaluru',
    bio: 'Leads statutory audits for listed mid-caps and writes on audit quality.',
    expertise: ['Audit', 'Ind AS', 'Risk'],
  },
  nk: {
    slug: 'nk',
    name: 'CA Neha Kapoor',
    title: 'Group CFO · Delhi',
    bio: 'Moved from Big Four audit to a CFO role at 34. Speaks on the CA-to-CXO path.',
    expertise: ['Corporate Finance', 'Leadership'],
  },
  av: {
    slug: 'av',
    name: 'CA Arjun Verma',
    title: 'Founder, fintech startup · Gurugram',
    bio: 'Builds automation tools for SME practices and runs hands-on AI workshops.',
    expertise: ['Startups', 'AI & Automation'],
  },
  ik: {
    slug: 'ik',
    name: 'CA Ishita Kulkarni',
    title: 'Partner, Indirect Tax · Pune',
    bio: 'Represents clients before GST appellate authorities.',
    expertise: ['GST', 'Customs', 'Litigation'],
  },
  sb: {
    slug: 'sb',
    name: 'CA Siddharth Bansal',
    title: 'Managing Partner · Jaipur',
    bio: 'Grew a two-person practice into a 60-member firm across three cities.',
    expertise: ['Practice Growth', 'Pricing'],
  },
};

export interface EventSeed {
  slug: string;
  title: string;
  wingNumber: number;
  category: string;
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
}

export const PROTOTYPE_EVENTS: EventSeed[] = [
  {
    slug: 'launch',
    title: 'ASCEND Launch Summit 2027',
    wingNumber: 4,
    category: 'Conference',
    date: '2027-01-01',
    time: '10:00 AM',
    venue: 'Bharat Mandapam, New Delhi',
    city: 'New Delhi',
    mode: 'Offline',
    fee: 1499,
    memberFee: 999,
    seatsTotal: 800,
    seatsTaken: 612,
    speakerSlugs: ['nk', 'sb', 'av'],
    description: 'The founding day of the community. Ten wings present their 2027 calendars, followed by keynotes and an evening of networking.',
  },
  {
    slug: 'ai-ca',
    title: 'AI for the Modern CA',
    wingNumber: 5,
    category: 'Workshop',
    date: '2027-01-09',
    time: '4:00 PM',
    venue: 'Online',
    city: 'Online',
    mode: 'Online',
    fee: 0,
    memberFee: 0,
    seatsTotal: 1000,
    seatsTaken: 742,
    speakerSlugs: ['av'],
    description: 'A hands-on session on AI tools for working papers, tax research and client communication. You leave with one working automation.',
  },
  {
    slug: 'gst',
    title: 'GST Clinic: Notices & Appeals',
    wingNumber: 1,
    category: 'Seminar',
    date: '2027-01-16',
    time: '10:30 AM',
    venue: 'The Orchid, Mumbai',
    city: 'Mumbai',
    mode: 'Offline',
    fee: 499,
    memberFee: 299,
    seatsTotal: 150,
    seatsTaken: 131,
    speakerSlugs: ['ik', 'rm'],
    description: 'A case-led clinic on handling show-cause notices and first appeals, with open Q&A on members’ live matters.',
  },
  {
    slug: 'speed',
    title: 'Young CA Speed Networking',
    wingNumber: 6,
    category: 'Networking',
    date: '2027-01-23',
    time: '6:00 PM',
    venue: 'Koramangala, Bengaluru',
    city: 'Bengaluru',
    mode: 'Offline',
    fee: 299,
    memberFee: 199,
    seatsTotal: 120,
    seatsTaken: 120,
    speakerSlugs: ['ps'],
    description: 'Fifteen five-minute conversations with peers, recruiters and mentors, then an open floor.',
  },
  {
    slug: 'tax-mc',
    title: 'Budget 2027 Decoded',
    wingNumber: 1,
    category: 'Training',
    date: '2027-02-03',
    time: '7:00 PM',
    venue: 'Online',
    city: 'Online',
    mode: 'Online',
    fee: 399,
    memberFee: 0,
    seatsTotal: 2000,
    seatsTaken: 530,
    speakerSlugs: ['rm', 'ik'],
    description: 'A clause-by-clause walk-through of the direct and indirect tax proposals.',
  },
  {
    slug: 'cfo',
    title: 'Inside the CFO Office',
    wingNumber: 4,
    category: 'Career',
    date: '2027-02-06',
    time: '5:00 PM',
    venue: 'Hyatt Regency, Gurugram',
    city: 'Gurugram',
    mode: 'Offline',
    fee: 799,
    memberFee: 499,
    seatsTotal: 200,
    seatsTaken: 88,
    speakerSlugs: ['nk'],
    description: 'Three CFOs walk through a month-end, a board review and a fundraise, and explain what they look for when hiring CAs.',
  },
];

export const PROTOTYPE_NEWS = [
  {
    date: '03 Nov 2026',
    title: 'Founding member registrations open',
    category: 'Announcement',
    summary: 'The first 500 members get founding status and a reserved Launch Summit seat.',
    content:
      'Registrations are handled online. You fill in your details, choose a plan and pay by UPI, card or net banking. Your member ID and receipt arrive by email and WhatsApp straight away. Founding members will be listed on the launch wall at the summit on 1 January 2027 and get first choice of wing committee roles.',
  },
  {
    date: '28 Oct 2026',
    title: 'Ten wings and their conveners announced',
    category: 'Community',
    summary: 'Each wing will run a monthly format and one annual summit.',
    content:
      'The Executive Council has ratified conveners across all ten specializations. Each wing operates with autonomy while contributing to the unified national calendar.',
  },
  {
    date: '20 Oct 2026',
    title: 'City Leads confirmed for four cities',
    category: 'Chapters',
    summary: 'Delhi, Mumbai, Bengaluru and Pune go first.',
    content:
      'City chapters will coordinate localized mixers, speed networking evenings, and direct engagements with regional ICAI branches.',
  },
];

export const PROTOTYPE_RESOURCES = [
  { category: 'Tax updates', title: 'Budget 2027: first-look summary', format: 'PDF · 18 pages' },
  { category: 'Guides', title: 'Prompt library for tax research', format: 'PDF · 42 prompts' },
  { category: 'Practice', title: 'Practice pricing calculator', format: 'XLSX' },
  { category: 'Career', title: 'First 100 days as a CA', format: 'PDF · 6 pages' },
  { category: 'Webinars', title: 'Ind AS 116 in practice', format: 'Video · 74 min' },
];

export const PROTOTYPE_MEMBERSHIP_TIERS = [
  {
    name: 'Core',
    subtitle: 'CA professionals',
    price: 1000,
    featured: true,
    features: ['Directory profile', 'Wing membership', 'Event discounts', 'Annual networking event'],
  },
  {
    name: 'Associate',
    subtitle: 'Allied professionals',
    price: 1000,
    featured: false,
    features: ['Directory profile', 'Wing membership', 'Event discounts', 'Joint events'],
  },
  {
    name: 'Student',
    subtitle: 'CA students',
    price: 499,
    featured: false,
    features: ['Student network', 'Mentorship', 'Career sessions', 'Certificates'],
  },
];

export const PROTOTYPE_LEGAL_DOCS = [
  'Privacy Policy',
  'Terms & Conditions',
  'Event Registration Terms',
  'Cancellation & Refund',
  'Payment Terms',
  'Cookie Policy',
];
