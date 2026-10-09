/**
 * Verified organisational content.
 *
 * Source: "Blueprint" deck (slides 1–7) and "Organisational Structure & Wing Activities" PDF.
 * Wording is kept as close to the source as possible. Do not add people, prices or claims
 * here that are not in those documents — editable content lives in the CMS store instead.
 */

export const ORG_POSITIONING = {
  title: 'A Professional Community',
  titleAccent: 'for Chartered Accountants & Beyond',
  summary: 'A Pan-India network built to help professionals',
  pillarsLine: 'Learn. Connect. Grow. Transform. Thrive. Contribute.',
  idea:
    'A modern professional community bringing together Chartered Accountants, young professionals, students and allied professionals through year-round opportunities.',
  launchDate: '2027-01-01',
  launchLabel: '1 January 2027 · Pan-India',
} as const;

export const ORG_VISION =
  "To build one of India's most active professional communities for Chartered Accountants and allied professionals, enabling meaningful connections, continuous learning, leadership development and professional and personal growth.";

export const ORG_MISSION =
  'To create a platform where professionals can Learn, Connect, Grow, Transform, Thrive and Contribute through knowledge, networking, technology, leadership, wellness and community initiatives.';

export const ORG_VISION_STATEMENT =
  'To build a connected, future-ready and thriving professional community that creates meaningful opportunities for professionals at every stage of their journey.';

export const ORG_TAGLINE = 'A stronger profession. A brighter tomorrow.';

export const ORG_CORE_PURPOSES = [
  { key: 'learn', title: 'Learn', text: 'From experts, peers and real-world experiences.' },
  { key: 'connect', title: 'Connect', text: 'Across cities, firms, industries and professions.' },
  { key: 'grow', title: 'Grow', text: 'Your career, practice, business and leadership journey.' },
  { key: 'transform', title: 'Transform', text: 'Through technology, AI and automation for a future-ready profession.' },
  { key: 'thrive', title: 'Thrive', text: 'With fitness, wellness, balance and personal development.' },
  { key: 'contribute', title: 'Contribute', text: 'To the profession, community and society.' },
] as const;

export const ORG_FOCUS_AREAS = [
  { title: 'Professional Knowledge', text: 'Technical learning, expert conversations & industry insights' },
  { title: 'Networking & Community', text: 'Meaningful connections across cities, firms, industries & professions' },
  { title: 'Professional & Personal Growth', text: 'Careers, practice, entrepreneurship, leadership, fitness & wellbeing' },
  { title: 'Technology & Future Readiness', text: 'AI, automation, digital transformation & emerging opportunities' },
  { title: 'National & International Experiences', text: 'City communities, professional events, conferences, tours & global networking' },
] as const;

export const ORG_GUIDING_PRINCIPLES = [
  'Member First',
  'Value Driven',
  'Inclusive Community',
  'Innovative & Future-Ready',
  'Ethical & Professional',
  'National & Global Perspective',
] as const;

/** Core leadership & executive structure, top to bottom. `holder` only where the documents name one. */
export const ORG_STRUCTURE = [
  { role: 'President', holder: 'CA Sandeep Garg' },
  { role: 'Vice President', holder: 'CA Abhinav Aggarwal' },
  { role: 'Secretary' },
  { role: 'Treasurer' },
  { role: 'Executive Council', note: 'President, Vice President, Secretary, Treasurer & Wing Conveners' },
  { role: 'Wing Conveners', note: '1 per wing' },
  { role: 'Wing Committee', note: '3 members' },
  { role: 'Young Professional Coordinators', note: '2 members' },
  { role: 'Members', note: 'Forum members across all categories' },
] as const;

export interface OrgWing {
  number: number;
  name: string;
  focus: string[];
  activities: string[];
}

/** The 10 professional wings with their focus areas and proposed activities (verbatim). */
export const ORG_WINGS: OrgWing[] = [
  {
    number: 1,
    name: 'Tax & Regulatory',
    focus: ['Direct Tax', 'International Tax', 'GST', 'Customs', 'Regulatory'],
    activities: ['Tax Update Live (monthly)', 'Case Law Café', 'Tax Masterclass', 'Cross-Border Conversations', 'GST Clinic', 'Tax Litigation Room', 'Ask the Expert', 'Tax Leader Roundtable', 'Tax Debate', 'Annual Tax Summit'],
  },
  {
    number: 2,
    name: 'Audit, Assurance & Finance',
    focus: ['Audit', 'Assurance', 'Accounting', 'Financial Reporting', 'Risk'],
    activities: ['Audit Update Hour', 'Standards Simplified', 'CFO Conversations', 'Audit Case Room', 'Risk & Controls Forum', 'Financial Reporting Masterclass', 'Audit Technology Lab', 'Emerging CFO Series', 'Peer Review Exchange', 'Annual Audit & Finance Summit'],
  },
  {
    number: 3,
    name: 'Practice & Entrepreneurship',
    focus: ['Practice Growth', 'Business Building', 'Client Acquisition', 'Leadership'],
    activities: ['Build Your Practice', 'The Modern CA Firm', 'Practice Growth Clinic', 'Pricing Your Expertise', 'Client Acquisition Lab', "Partner's Playbook", 'From Solo to Scale', 'CA Entrepreneur Stories', 'Practice Succession Roundtable', 'CA Business Leaders Summit'],
  },
  {
    number: 4,
    name: 'Industry & Leadership',
    focus: ['CFO Ecosystem', 'Corporate Leadership', 'Career Progression', 'Board Readiness'],
    activities: ['Inside the CFO Office', 'CA to CXO', 'Leadership Without a Title', 'Boardroom Conversations', 'Industry CA Connect', 'Career Switch Stories', 'Women in Corporate Leadership', 'CEO/CFO Fireside', 'Leadership Masterclass', 'Future CFO Summit'],
  },
  {
    number: 5,
    name: 'AI, Technology & Automation',
    focus: ['AI for CAs', 'Automation', 'Tools', 'Digital Transformation'],
    activities: ['AI for the Modern CA', 'Automation Friday', 'AI Tax Lab', 'AI Audit Lab', 'Prompt Engineering for Professionals', 'Build Your First AI Workflow', 'Tools of the Month', 'No-Code Automation Challenge', 'AI Leaders Roundtable', 'Future of the CA Profession Summit'],
  },
  {
    number: 6,
    name: 'Young Professionals & Career',
    focus: ['Students', 'Young CAs', 'Career', 'Mentorship', 'Leadership'],
    activities: ['CA Career Compass', 'First 100 Days as a CA', "Partner's Career Stories", 'Interview Room', 'CV & LinkedIn Clinic', 'Young CA Speed Networking', 'Mentor Match', 'Industry Exposure Series', 'Young Leaders Roundtable', 'Young CA Leadership Summit'],
  },
  {
    number: 7,
    name: 'Women Professionals',
    focus: ['Leadership', 'Entrepreneurship', 'Mentoring', 'Career Growth'],
    activities: ['Women Who Lead', 'Beyond the Balance', 'Return & Rise', 'Women Entrepreneur Circle', 'MentorHer', 'Women CFO Conversations', 'Career Reboot', 'Women Networking Brunch', 'Financial Independence Forum', 'Women Leadership Summit'],
  },
  {
    number: 8,
    name: 'Sports, Fitness & Wellness',
    focus: ['Sports', 'Fitness', 'Wellness', 'Mental Health', 'Family Engagement'],
    activities: ['CA Cricket League', 'CA Badminton Cup', 'CA Football Meet', 'Run for the Profession', '30-Day Fitness Challenge', 'Weekend Fitness Club', 'Mind & Work', 'Nutrition for Professionals', 'Family Sports Day', 'Annual CA Sports Festival'],
  },
  {
    number: 9,
    name: 'Social Impact & Community',
    focus: ['Financial Literacy', 'Education', 'CSR', 'Volunteering', 'Mentoring'],
    activities: ['CA Gives Back', 'Financial Literacy Drive', 'Teach & Mentor', 'Student Scholarship Initiative', 'Pro Bono Professional Day', 'Community Service Weekend', 'Financial Awareness for Entrepreneurs', 'Green Professional Initiative', 'Annual Social Impact Project', 'Community Impact Summit'],
  },
  {
    number: 10,
    name: 'Global Network & International Relations',
    focus: ['Global CA Connect', 'International Tax', 'Study Tours', 'Global Networking'],
    activities: ['Global CA Connect', 'CA Across Borders', 'International Tax Conversations', 'Global Career Series', 'Meet the Global CFO', 'International Practice Exchange', 'Global CA Networking Night', 'Professional Delegation', 'International Learning Tour', 'Global CA Summit'],
  },
];

export const ORG_COMMUNITIES = [
  {
    name: 'City Leads',
    subtitle: 'For regional / city communities',
    points: ['City-level networking & events', 'Member acquisition & engagement', 'Local partnerships', 'Reporting to central leadership'],
  },
  {
    name: 'Experienced CA Community',
    subtitle: 'FCA / ACA',
    points: ['Senior professional network', 'Leadership & mentoring', 'Knowledge sharing', 'Industry & practice guidance'],
  },
  {
    name: 'Young CA Leads',
    subtitle: 'For young CA & student engagement',
    points: ['Young CA & student community', 'Career programmes & mentorship', 'Networking & leadership initiatives', 'City-wise young CA representatives'],
  },
  {
    name: 'Women CA Leads',
    subtitle: 'Women CA community',
    points: ['Women CA community', 'Leadership & mentoring', 'Career & entrepreneurship initiatives', 'Wellness & networking', 'City-wise women CA representatives'],
  },
  {
    name: 'Allied Professionals',
    subtitle: 'Advocates, CS, CMA, CPA, Finance & Technology Professionals, Consultants, Others',
    points: ['Cross-professional networking', 'Joint events & collaborations', 'Knowledge exchange', 'Industry connect', 'Expanded professional ecosystem'],
  },
  {
    name: 'Partners / Sponsors',
    subtitle: 'Partner ecosystem',
    points: ['Knowledge partners', 'Technology partners', 'Event partners', 'Wing partners', 'Annual strategic partners'],
  },
] as const;

export interface MembershipPlan {
  key: 'core' | 'associate' | 'student';
  name: string;
  audience: string;
  price: number;
  priceNote?: string;
  period: string;
  idealFor: string[];
  benefits: string[];
  featured?: boolean;
}

/** Proposed plans from the Blueprint. Prices are proposals and must stay configurable. */
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    key: 'core',
    name: 'Core Member',
    audience: 'CA Professionals',
    price: 1000,
    period: 'year',
    featured: true,
    idealFor: ['Practice CA', 'Industry CA', 'Entrepreneur CA', 'FCA', 'ACA', 'Young CA', 'Women CA'],
    benefits: ['Community membership', 'Digital member profile & directory', 'Networking groups', 'Selected free webinars', 'Member-only discussions', 'Professional resources', 'Discounts on paid events', 'Annual networking event', 'Wing membership', 'Community newsletter', 'Member opportunities'],
  },
  {
    key: 'associate',
    name: 'Associate Member',
    audience: 'Allied Professionals',
    price: 1000,
    period: 'year',
    idealFor: ['Advocates', 'CS', 'CMA', 'CPA', 'Finance Professionals', 'Technology Professionals', 'Consultants', 'Others'],
    benefits: ['Community membership', 'Digital member profile & directory', 'Networking groups', 'Selected free webinars', 'Member-only discussions', 'Professional resources', 'Discounts on paid events', 'Annual networking event', 'Wing membership', 'Community newsletter', 'Member opportunities'],
  },
  {
    key: 'student',
    name: 'Student Member',
    audience: 'CA Students',
    price: 499,
    priceNote: 'or Free (Introductory)',
    period: 'year',
    idealFor: ['CA Students and emerging professionals'],
    benefits: ['Community membership', 'Student network', 'Selected free webinars', 'Mentorship opportunities', 'Career guidance sessions', 'Access to selected resources', 'Discounts on paid events', 'Networking opportunities', 'Participation certificates', 'Newsletter & updates', 'Future opportunities'],
  },
];

export const MEMBER_IDENTITIES = {
  ca: ['Practice CA', 'Industry CA', 'Entrepreneur CA', 'FCA', 'ACA', 'Young CA', 'Student CA', 'Women CA'],
  allied: ['Advocates', 'Company Secretaries', 'CMA', 'CPA', 'Finance Professionals', 'Technology Professionals', 'Consultants', 'Others'],
} as const;

export const MEMBER_JOURNEY = [
  { title: 'Discover', text: 'Learn about the community' },
  { title: 'Register', text: 'Sign up and create your account' },
  { title: 'Become a Member', text: 'Choose your membership plan' },
  { title: 'Create Profile', text: 'Build your professional profile' },
  { title: 'Select Interests', text: 'Choose your wings and communities' },
  { title: 'Attend Events', text: 'Join webinars, networking and activities' },
  { title: 'Network', text: 'Connect with peers across cities & industries' },
  { title: 'Contribute', text: 'Volunteer, share knowledge and support' },
  { title: 'Grow into a Leader', text: 'Take on leadership roles in wings, city and community initiatives' },
] as const;

/** Checklist §2A "Why Join Us". */
export const WHY_JOIN = [
  { key: 'networking', title: 'Networking', text: 'Meaningful connections across cities, firms, industries and professions.' },
  { key: 'knowledge', title: 'Knowledge Sharing', text: 'Technical learning, expert conversations and industry insights.' },
  { key: 'events', title: 'Events', text: 'Year-round summits, masterclasses, clinics and meetups across 10 wings.' },
  { key: 'career', title: 'Career Opportunities', text: 'Careers, practice, entrepreneurship and leadership journeys.' },
  { key: 'mentorship', title: 'Mentorship', text: 'Mentor Match, MentorHer and career guidance from experienced CAs.' },
  { key: 'growth', title: 'Professional Growth', text: 'Technology, AI and future readiness for a stronger profession.' },
] as const;

export const ORG_HEADLINE_STATS = [
  { value: '10', label: 'Professional Wings' },
  { value: 'Pan-India', label: 'City Network' },
  { value: 'Diverse', label: 'Professional Communities' },
  { value: 'Strong', label: 'Partner Ecosystem' },
] as const;

export const EVENT_CATEGORIES = [
  'Networking',
  'Seminar',
  'Workshop',
  'Conference',
  'Training',
  'Career',
  'Social',
  'Online',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const RESOURCE_CATEGORIES = [
  'Articles',
  'Guides',
  'Career Resources',
  'Tax Updates',
  'Finance Resources',
  'Practice Resources',
  'Webinars',
  'Videos',
  'Downloadable PDFs',
] as const;

export const NEWS_CATEGORIES = [
  'Community Announcements',
  'Event Announcements',
  'Professional Updates',
  'Member Achievements',
  'Partnerships',
  'Important Notices',
] as const;

export const GALLERY_CATEGORIES = [
  'Previous Events',
  'Conferences',
  'Networking Sessions',
  'Workshops',
  'Community Activities',
] as const;
