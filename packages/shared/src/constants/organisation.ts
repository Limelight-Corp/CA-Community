/**
 * Verified organisational content.
 *
 * Source: "Blueprint" deck (slides 1–7) and "Organisational Structure & Wing Activities" PDF.
 * Wording is kept as close to the source as possible. Do not add people, prices or claims
 * here that are not in those documents — editable content lives in the CMS store instead.
 */

export const ORG_POSITIONING = {
  title: 'EAGLE 2.0',
  titleAccent: 'नई सोच, नई उड़ान',
  taglineHindi: 'नई सोच, नई उड़ान',
  taglineEnglish: 'Nayi Soch, Nayi Udaan',
  summary: 'A Pan-India professional community bringing together Chartered Accountants, CA students and allied professionals to',
  pillarsLine: 'Learn. Connect. Grow. Transform. Thrive. Contribute.',
  idea:
    'EAGLE 2.0 is envisioned as a Pan-India professional community for Chartered Accountants, young professionals, CA students and allied professionals, built on a simple belief: the profession grows stronger when its people grow together.',
  launchDate: '2027-01-01',
  launchLabel: '1 January 2027 · Pan-India',
} as const;

export const ORG_VISION =
  "To build one of India's most active professional communities for Chartered Accountants and allied professionals, enabling meaningful connections, continuous learning, leadership development and professional and personal growth.";

export const ORG_MISSION =
  'To create a platform where professionals can Learn, Connect, Grow, Transform, Thrive and Contribute through knowledge, networking, technology, leadership, wellness and community initiatives.';

export const ORG_VISION_STATEMENT =
  'To build a connected, future-ready and thriving professional community that creates meaningful opportunities for professionals at every stage of their journey.';

export const ORG_TAGLINE = 'नई सोच, नई उड़ान | Nayi Soch, Nayi Udaan';

export const ORG_CORE_PURPOSES = [
  { key: 'learn', title: 'Learn', text: 'Access technical knowledge, expert perspectives, peer learning and practical insights that support continuous professional development.' },
  { key: 'connect', title: 'Connect', text: 'Build meaningful relationships across cities, firms, industries and professional communities.' },
  { key: 'grow', title: 'Grow', text: 'Explore opportunities to develop your career, practice, business, leadership and professional capabilities.' },
  { key: 'transform', title: 'Transform', text: 'Embrace technology, AI, automation and new ways of working to prepare for the evolving professional landscape.' },
  { key: 'thrive', title: 'Thrive', text: 'Encourage well-being, balance, inclusion and personal development alongside professional ambition.' },
  { key: 'contribute', title: 'Contribute', text: 'Share knowledge, mentor emerging professionals and participate in initiatives that create value for the profession and society.' },
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

/** Blueprint Section 3: Our Objectives */
export const ORG_OBJECTIVES = [
  'Encourage knowledge sharing and continuous professional learning.',
  'Create opportunities for networking across cities, industries and practice areas.',
  'Support career development, entrepreneurship and professional leadership.',
  'Promote awareness of technology, AI and emerging professional trends.',
  'Encourage mentorship, peer learning and cross-generational collaboration.',
  'Foster wellness, inclusion and personal development.',
  'Enable members to contribute to the profession and society.',
  'Build an active, participative and future-ready professional community.',
] as const;

/** Blueprint Section 3: Our Philosophy */
export const ORG_PHILOSOPHY = {
  taglineHindi: 'नई सोच, नई उड़ान',
  taglineEnglish: 'Nayi Soch, Nayi Udaan',
  description:
    'We believe new ideas create new possibilities. By bringing people together, encouraging participation and supporting collective action, EAGLE 2.0 aims to help professionals take their next steps with confidence and purpose.',
} as const;

/** Blueprint Section 3: Leadership Framework */
export const ORG_LEADERSHIP_FRAMEWORK = {
  title: 'Leadership That Enables Participation',
  description:
    "EAGLE 2.0 is designed around a structured leadership framework that encourages accountability, collaboration and participation across all levels. The proposed structure brings together core leadership, executive coordination, professional wing leadership, community coordinators and members. Each level has a role in supporting the community's objectives and translating ideas into actionable initiatives.",
  levels: [
    { level: 'Core leadership', designation: 'President and Vice President' },
    { level: 'Executive coordination', designation: 'Secretary and Treasurer' },
    { level: 'Executive Council', designation: 'President, Vice President, Secretary, Treasurer and other approved office-bearers' },
    { level: 'Professional wings', designation: 'Wing Conveners and Wing Committees' },
    { level: 'Community coordination', designation: 'City Leads, Young CA Leads and Women CA Leads' },
    { level: 'Membership', designation: 'Members and participating professionals' },
  ],
  profilesNote:
    'Team profiles should include an approved photograph, full name, official designation, professional background, short biography and professional profile link where available. Do not publish names until appointments and consent have been confirmed.',
} as const;

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
/** URL slug for a wing page, e.g. "Tax & Regulatory" → "tax-regulatory". */
export function wingSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

export interface BlueprintWing {
  number: number;
  name: string;
  tagline: string;
  description: string;
  proposedActivities: string;
}

/** Blueprint Section 4: Our Wings Page */
export const WINGS_PAGE_CONTENT = {
  seoTitle: 'Professional Wings for Chartered Accountants | EAGLE 2.0',
  title: 'Ten Wings.',
  accent: 'One Community.',
  lead: 'EAGLE 2.0 brings together diverse professional interests through ten proposed wings, each designed to encourage focused learning, meaningful connections and collaborative initiatives.',
  secondaryLead:
    'Our wing-based structure creates opportunities for members to engage with relevant topics, exchange expertise and participate in activities that support both individual development and collective progress.',
  closingCtaTitle: 'Find Your Wing. Share Your Expertise.',
  closingCtaAccent: 'Create Impact.',
  closingCtaLead:
    'Whether your interests lie in taxation, audit, entrepreneurship, technology, career development, wellness or social impact, our wing-based approach is designed to help you connect with the right people and participate in relevant initiatives.',
  operationalNote:
    "Publish each wing's convener, committee, calendar and confirmed activities only when those details have been approved.",
} as const;

export const BLUEPRINT_WINGS: BlueprintWing[] = [
  {
    number: 1,
    name: 'Tax & Regulatory',
    tagline: 'Technical excellence and regulatory awareness',
    description: 'Focuses on taxation, GST, international taxation, transfer pricing, regulatory developments and practical professional knowledge.',
    proposedActivities: 'Tax updates, case-law discussions, GST clinics, regulatory briefings and expert conversations.',
  },
  {
    number: 2,
    name: 'Audit, Assurance & Finance',
    tagline: 'Trust, transparency and financial expertise',
    description: 'Encourages knowledge sharing in audit, assurance, financial reporting, risk management and finance.',
    proposedActivities: 'Audit update sessions, financial reporting discussions, risk and controls forums, and practical case studies.',
  },
  {
    number: 3,
    name: 'Practice & Entrepreneurship',
    tagline: 'Building sustainable practices and businesses',
    description: 'Supports conversations around practice development, entrepreneurship, business advisory, client relationships and professional services.',
    proposedActivities: 'Practice-building workshops, pricing and positioning discussions, client acquisition sessions and entrepreneurship roundtables.',
  },
  {
    number: 4,
    name: 'Industry & Leadership',
    tagline: 'Career progression and leadership capabilities',
    description: 'Explores corporate careers, strategic thinking, leadership development and the evolving role of finance professionals.',
    proposedActivities: 'CFO conversations, leadership masterclasses, career panels, industry roundtables and boardroom discussions.',
  },
  {
    number: 5,
    name: 'AI, Technology & Automation',
    tagline: 'Preparing professionals for the future',
    description: 'Encourages the practical adoption of AI, automation, data analytics and digital tools in professional work.',
    proposedActivities: 'AI workshops, automation demonstrations, digital productivity sessions and technology-led case studies.',
  },
  {
    number: 6,
    name: 'Young Professionals & Career',
    tagline: 'From qualification to career confidence',
    description: 'Supports career exploration, communication, professional visibility, interview preparation and early-career development.',
    proposedActivities: 'Career conversations, CV and LinkedIn workshops, interview preparation, peer networking and young CA leadership sessions.',
  },
  {
    number: 7,
    name: 'Women Professionals',
    tagline: 'Leadership, inclusion and professional growth',
    description: 'Creates opportunities for women professionals to connect, share experiences, develop leadership capabilities and support one another.',
    proposedActivities: 'Leadership conversations, mentoring circles, return-to-work discussions, networking and professional development sessions.',
  },
  {
    number: 8,
    name: 'Sports, Fitness & Wellness',
    tagline: 'A healthier approach to professional life',
    description: 'Encourages well-being, physical activity, balanced lifestyles and stronger relationships beyond the workplace.',
    proposedActivities: 'Sports leagues, fitness challenges, wellness sessions, community walks and social meetups.',
  },
  {
    number: 9,
    name: 'Social Impact & Community',
    tagline: 'Professional knowledge with a wider purpose',
    description: 'Encourages community engagement through education, financial literacy, volunteering and initiatives that create social value.',
    proposedActivities: 'Financial literacy programmes, educational initiatives, volunteering and community impact projects.',
  },
  {
    number: 10,
    name: 'Global Network & International Relations',
    tagline: 'Connecting perspectives across borders',
    description: 'Encourages global professional connections and exposure to international developments, cross-border practice and emerging opportunities.',
    proposedActivities: 'International taxation discussions, global industry dialogues, cross-border networking and international learning sessions.',
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
  { title: 'Discover', text: 'Explore EAGLE 2.0, its purpose, wings and activities.' },
  { title: 'Join', text: 'Complete the community registration process.' },
  { title: 'Connect', text: 'Build your professional profile and discover relevant communities.' },
  { title: 'Participate', text: 'Attend events, workshops, discussions and initiatives.' },
  { title: 'Contribute', text: 'Share knowledge, volunteer, mentor and collaborate.' },
  { title: 'Lead', text: 'Take on opportunities to help shape programmes and community initiatives.' },
] as const;

/** Checklist §2A "Why Join Us" — Section 2.6 of Blueprint. */
export const WHY_JOIN = [
  { key: 'networking', title: 'Meaningful Networking', text: 'Connect with CAs, students and professionals across cities, industries and areas of practice.' },
  { key: 'knowledge', title: 'Knowledge Sharing', text: 'Learn through seminars, expert interactions, workshops and peer-led discussions.' },
  { key: 'events', title: 'Professional Development', text: 'Explore opportunities to strengthen technical expertise, leadership skills, communication and business capabilities.' },
  { key: 'career', title: 'Career and Practice Growth', text: 'Discover perspectives, connections and initiatives that support career progression, entrepreneurship and professional practice.' },
  { key: 'mentorship', title: 'Mentorship and Guidance', text: 'Create opportunities for experienced professionals to share insights and support the next generation of CAs.' },
  { key: 'growth', title: 'Technology and Future Readiness', text: 'Engage with developments in AI, automation, digital transformation and emerging professional opportunities.' },
  { key: 'wellness', title: 'Wellness and Community Impact', text: 'Be part of a professional culture that values personal well-being, inclusion and contribution to society.' },
] as const;

export const ORG_HEADLINE_STATS = [
  { value: '10', label: 'Professional Wings' },
  { value: 'Pan-India', label: 'City Network' },
  { value: 'Diverse', label: 'Professional Communities' },
  { value: 'Strong', label: 'Partner Ecosystem' },
] as const;

export const EVENT_CATEGORIES = [
  'Seminars and technical updates',
  'Workshops and masterclasses',
  'Conferences and summits',
  'Industry and leadership conversations',
  'AI, technology and automation',
  'Career development and mentorship',
  'Networking and community meetups',
  'Sports, wellness and social impact',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const RESOURCE_CATEGORIES = [
  'Tax and Regulatory Updates',
  'Audit, Assurance and Finance',
  'Practice and Entrepreneurship',
  'Career and Leadership',
  'Technology, AI and Automation',
  'Webinars, Videos and Downloads',
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const NEWS_CATEGORIES = [
  'Community announcements',
  'Upcoming events and registration notices',
  'Professional and industry updates',
  'Wing activities and initiatives',
  'Member achievements and milestones',
  'Partnerships and collaborations',
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const GALLERY_CATEGORIES = [
  'Previous Events',
  'Conferences',
  'Networking Sessions',
  'Workshops',
  'Community Activities',
] as const;

/**
 * Blueprint Section 5: Events Page Content & Categories
 */
export const BLUEPRINT_EVENT_CATEGORIES = [
  'Seminars and technical updates',
  'Workshops and masterclasses',
  'Conferences and summits',
  'Industry and leadership conversations',
  'AI, technology and automation',
  'Career development and mentorship',
  'Networking and community meetups',
  'Sports, wellness and social impact',
] as const;

export const EVENTS_PAGE_CONTENT = {
  seoTitle: 'CA Events, Seminars & Workshops | EAGLE 2.0',
  hero: {
    kicker: 'Events calendar',
    title: 'Events That Connect Knowledge with Opportunity',
    paragraphs: [
      'Explore professional events designed to encourage learning, collaboration and meaningful networking across the CA community.',
      'EAGLE 2.0 aims to bring together subject-matter experts, industry professionals, practitioners, emerging leaders and students through technical sessions, workshops, conferences and community activities.',
      'Whether you want to deepen your technical knowledge, understand emerging industry trends, develop new skills or connect with peers, discover events that align with your interests.',
    ],
  },
  categoriesSection: {
    title: 'Explore Events by Category',
    categories: [
      {
        id: 'cat-1',
        name: 'Seminars and technical updates',
        description: 'Deep-dive regulatory updates, tax changes, corporate law insights and technical accounting sessions.',
      },
      {
        id: 'cat-2',
        name: 'Workshops and masterclasses',
        description: 'Interactive, skill-building masterclasses focusing on practical application, compliance and practice advisory.',
      },
      {
        id: 'cat-3',
        name: 'Conferences and summits',
        description: 'Large-scale national and regional conventions gathering leading practitioners, dignitaries and industry thought leaders.',
      },
      {
        id: 'cat-4',
        name: 'Industry and leadership conversations',
        description: 'Executive dialogues with CFOs, boardroom leaders, corporate advisors and entrepreneurial pioneers.',
      },
      {
        id: 'cat-5',
        name: 'AI, technology and automation',
        description: 'Hands-on exploration of artificial intelligence, workflow automation tools and future-ready digital technologies.',
      },
      {
        id: 'cat-6',
        name: 'Career development and mentorship',
        description: 'Guidance clinics, career roadmaps, CV sharpening, mentorship circles and student-to-professional transitions.',
      },
      {
        id: 'cat-7',
        name: 'Networking and community meetups',
        description: 'City chapter gatherings, young CA meetups, informal mixers and peer-to-peer exchange forums.',
      },
      {
        id: 'cat-8',
        name: 'Sports, wellness and social impact',
        description: 'Professional sports leagues, health & fitness drives, mindfulness sessions and community outreach projects.',
      },
    ],
  },
  interactionSection: {
    heading: 'Make Every Interaction Count',
    subtitle: 'Discover. Register. Participate. Grow.',
    copy: 'Browse event details, explore speaker profiles and review registration information before booking your place. Event pages will provide confirmed information on schedules, venues, fees and participation requirements.',
  },
  detailTemplate: {
    title: 'Event Detail Page Template',
    fields: [
      { field: 'Event title', content: 'Official event name' },
      { field: 'Overview', content: 'What the event covers and who should attend' },
      { field: 'Key takeaways', content: 'Specific learning or networking outcomes' },
      { field: 'Date and time', content: 'Confirmed date, time and time zone if relevant' },
      { field: 'Format and venue', content: 'Online, in-person or hybrid; venue and map link' },
      { field: 'Speakers', content: 'Approved speaker profiles and designations' },
      { field: 'Agenda', content: 'Session topics and timings' },
      { field: 'Registration', content: 'Fee, eligibility, capacity and booking deadline' },
      { field: 'Policies', content: 'Applicable participation, cancellation and refund terms' },
      { field: 'CTA', content: 'Register for This Event' },
    ],
  },
  confirmationMessage: {
    title: 'Thank you for registering for an EAGLE 2.0 event.',
    paragraph:
      'Your registration details and event information will be shared through the contact details provided during registration. Please retain your registration confirmation for reference.',
    welcome: 'We look forward to welcoming you.',
    signature: 'EAGLE 2.0\nNayi Soch, Nayi Udaan',
    systemNote:
      'trigger this confirmation only after the registration system records the relevant status. Send payment confirmation only after the payment gateway confirms successful payment.',
  },
} as const;

/**
 * Blueprint Section 6: Speakers Page Content
 */
export const SPEAKERS_PAGE_CONTENT = {
  seoTitle: 'CA Speakers & Industry Experts | EAGLE 2.0',
  hero: {
    eyebrow: 'Voices shaping the profession',
    title: 'Meet the Voices Shaping',
    accent: 'Professional Conversations.',
    paragraphs: [
      'Knowledge becomes more meaningful when experience is shared. EAGLE 2.0 aims to bring together Chartered Accountants, industry leaders, subject-matter experts, entrepreneurs and professionals who can offer practical insights, fresh perspectives and valuable learning experiences.',
      'Explore our featured speakers and discover the people contributing to our seminars, workshops, conferences and professional conversations.',
    ],
  },
  banner: {
    heading: 'Share Knowledge.',
    accent: 'Inspire Progress.',
    paragraphs: [
      'Our proposed speaker programme will cover technical expertise, taxation, audit, finance, entrepreneurship, leadership, technology, career development and other emerging areas of professional interest.',
      'We welcome opportunities to engage with experienced professionals who are interested in sharing their knowledge and contributing to the wider CA community.',
    ],
    ctaLabel: 'Interested in Speaking or Collaborating? Contact Our Team.',
    ctaUrl: '/contact',
  },
  speakerProfileFields: [
    'Name',
    'Designation',
    'Qualification',
    'Organisation',
    'Professional biography',
    'Expertise',
    'Event appearances',
    'Approved professional profile links',
  ],
} as const;

/**
 * Blueprint Section 7: Resources Page Content & Categories
 */
export const BLUEPRINT_RESOURCE_CATEGORIES = [
  {
    id: 'res-cat-1',
    title: 'Tax and Regulatory Updates',
    description: 'Articles and learning resources on taxation, GST, international taxation and relevant regulatory developments.',
  },
  {
    id: 'res-cat-2',
    title: 'Audit, Assurance and Finance',
    description: 'Resources covering audit practices, financial reporting, assurance and finance-related topics.',
  },
  {
    id: 'res-cat-3',
    title: 'Practice and Entrepreneurship',
    description: 'Ideas on building professional practices, business development, client relationships and advisory services.',
  },
  {
    id: 'res-cat-4',
    title: 'Career and Leadership',
    description: 'Resources for career planning, communication, leadership, professional development and workplace effectiveness.',
  },
  {
    id: 'res-cat-5',
    title: 'Technology, AI and Automation',
    description: 'Learning material on digital tools, automation, data analytics and emerging technologies relevant to professionals.',
  },
  {
    id: 'res-cat-6',
    title: 'Webinars, Videos and Downloads',
    description: 'Recordings, presentations, guides and other materials made available by the community.',
  },
] as const;

export const RESOURCES_PAGE_CONTENT = {
  seoTitle: 'CA Resources, Tax Updates & Career Learning | EAGLE 2.0',
  hero: {
    eyebrow: 'Knowledge library',
    title: 'Knowledge That Moves You',
    accent: 'Forward.',
    paragraphs: [
      'Discover articles, professional insights and learning resources that support continuous development across the CA community. The EAGLE 2.0 resource library is intended to make useful professional knowledge easier to discover, explore and share.',
      'From technical updates and practice resources to career development and technology insights, our aim is to encourage informed conversations and lifelong learning.',
    ],
  },
  categoriesSection: {
    title: 'Explore Resources by Category',
    categories: BLUEPRINT_RESOURCE_CATEGORIES,
  },
  closingSection: {
    heading: 'Learn. Apply.',
    accent: 'Share.',
    paragraphs: [
      'Explore available resources, participate in knowledge-sharing initiatives and contribute perspectives that support professional learning.',
      'For every article or downloadable resource, include an accurate title, author, publication date, summary, category and source references where relevant. Technical or regulatory articles should clearly identify their publication date.',
    ],
    ctaPrimary: { label: 'Explore Resources', href: '#resource-library' },
    ctaSecondary: { label: 'Read Latest Articles', href: '/news' },
  },
} as const;

/**
 * Blueprint Section 8: News & Updates Page Content & Categories
 */
export const BLUEPRINT_NEWS_CATEGORIES = [
  'Community announcements',
  'Upcoming events and registration notices',
  'Professional and industry updates',
  'Wing activities and initiatives',
  'Member achievements and milestones',
  'Partnerships and collaborations',
] as const;

export const NEWS_PAGE_CONTENT = {
  seoTitle: 'CA Community News & Professional Updates | EAGLE 2.0',
  hero: {
    eyebrow: 'News & Updates',
    title: "What's New at",
    accent: 'EAGLE 2.0.',
    paragraphs: [
      'Stay connected with the latest announcements, upcoming initiatives and developments from the EAGLE 2.0 community.',
      'This section will bring together community announcements, event updates, professional insights, wing activities, partnerships and member achievements.',
      'Whether you are looking for an upcoming event, a new learning opportunity or an update on the community’s progress, find the information you need in one place.',
    ],
  },
  scopeHighlights: [
    'Community announcements',
    'Upcoming events and registration notices',
    'Professional and industry updates',
    'Wing activities and initiatives',
    'Member achievements and milestones',
    'Partnerships and collaborations',
  ],
  tagline: 'Stay informed. Stay involved. Grow together.',
  publishingGuideline:
    'Each news post should have a descriptive headline, original article copy, publication date, author, relevant image and social-sharing options.',
} as const;

/**
 * Blueprint Section 9: Gallery Page Content
 */
export const GALLERY_PAGE_CONTENT = {
  seoTitle: 'CA Community Events & Gallery | EAGLE 2.0',
  hero: {
    eyebrow: 'Moments & Highlights',
    title: 'Moments That',
    accent: 'Bring Us Together.',
    paragraphs: [
      'A community is built through the experiences we share, the relationships we develop and the ideas we exchange.',
      'The EAGLE 2.0 gallery will showcase photographs and videos from community events, knowledge sessions, networking activities, workshops and other initiatives.',
      'Explore moments of learning, collaboration and participation as the community grows.',
    ],
    tagline: 'Every interaction creates a connection. Every initiative creates an opportunity.',
  },
  guidelineNote:
    'Organise galleries by event, date or initiative. Obtain appropriate consent before publishing identifiable attendee photographs.',
  banner: {
    heading: 'Every Interaction Creates a Connection.',
    accent: 'Every Initiative Creates an Opportunity.',
    lead: 'Explore moments of learning, collaboration and participation as the community grows. Join our upcoming sessions and initiatives.',
    ctaPrimary: { label: 'Explore Upcoming Events', href: '/events' },
    ctaSecondary: { label: 'Join the Community', href: '/join' },
  },
} as const;

/**
 * Blueprint Section 10: Join Us Page Content
 */
export const JOIN_PAGE_CONTENT = {
  seoTitle: 'Join EAGLE 2.0 | CA Professional Community India',
  hero: {
    eyebrow: 'Be Part of EAGLE 2.0',
    title: 'Be Part of',
    accent: 'EAGLE 2.0.',
    paragraphs: [
      'Your professional journey is shaped not only by what you know, but also by the people you learn from, the connections you build and the opportunities you pursue.',
      'EAGLE 2.0 aims to bring together Chartered Accountants, young professionals, CA students and allied professionals through a shared commitment to learning, connection, growth, transformation, well-being and contribution.',
      'Join a community that encourages participation, values diverse perspectives and creates opportunities to grow together.',
    ],
    ctaPrimary: { label: 'Explore Membership Options', href: '#plans' },
    ctaSecondary: { label: 'Start Registration', href: '#register' },
  },
  whoCanJoin: {
    title: 'Who Can Join?',
    lead: 'Open to Chartered Accountants, early-career professionals, CA students and allied professionals committed to collective growth.',
    groups: [
      {
        id: 'join-ca',
        title: 'Chartered Accountants and Practitioners',
        description: 'Connect with peers, share expertise and participate in relevant technical and professional initiatives.',
      },
      {
        id: 'join-young',
        title: 'Young and Early-Career Professionals',
        description: 'Explore networking, professional development, leadership and career learning opportunities.',
      },
      {
        id: 'join-students',
        title: 'CA Students',
        description: 'Discover learning opportunities, interact with professionals and explore pathways for professional development, subject to applicable participation criteria.',
      },
      {
        id: 'join-allied',
        title: 'Allied Professionals',
        description: 'Engage with cross-functional perspectives and initiatives relevant to the wider professional community, subject to the community’s eligibility rules.',
      },
    ],
  },
  journey: {
    title: 'Your Journey Starts Here',
    lead: 'Discover the community, complete the registration process and explore the wings and activities that match your interests. Whether you want to learn, connect, contribute or take on a leadership role, EAGLE 2.0 aims to create opportunities for meaningful participation.',
    tagline: 'Nayi Soch, Nayi Udaan — let’s grow together.',
  },
  membershipOptions: {
    title: 'Membership Options',
    disclaimer:
      'The website blueprint contains proposed membership categories and fee structures. Do not publish these until eligibility criteria, benefits, pricing and approval procedures have been confirmed.',
    potentialCategories: ['Core Member', 'Associate Member', 'Student Member'],
    potentialBenefits:
      'Potential benefits, subject to final approval, include event access, member pricing, networking, selected resources, professional discussions and opportunities to participate in community initiatives.',
  },
  registrationForm: {
    title: 'Start Registration',
    lead: 'Complete the registration form with your professional details. Our team will review your application and follow up with plan and payment details.',
    guideline: 'Collect only the personal information required for registration, explain how it will be used and secure it appropriately.',
    fields: [
      'Full name',
      'Email address and mobile number',
      'City',
      'Professional category',
      'CA membership or student registration number, where applicable',
      'Year of qualification or expected qualification',
      'Firm or organisation',
      'Area of practice or professional interest',
      'LinkedIn profile (optional)',
      'Preferred professional wings',
      'Consent to the privacy policy and applicable membership terms',
    ],
  },
} as const;

/**
 * Blueprint Section 11: Contact Us Page Content
 */
export const CONTACT_PAGE_CONTENT = {
  seoTitle: 'Contact EAGLE 2.0 | Professional Community',
  hero: {
    eyebrow: 'Contact',
    title: "Let's",
    accent: 'Connect.',
    paragraphs: [
      'Have a question about EAGLE 2.0, an upcoming event, membership, a potential collaboration or an opportunity to contribute? We would be glad to hear from you.',
      'Whether you are a Chartered Accountant, student, industry professional, speaker or organisation interested in collaborating, reach out to our team.',
    ],
  },
  contactDetails: {
    generalEnquiries: 'hello@eagle2.in',
    socialMediaNote:
      'Follow EAGLE 2.0 through its official channels for announcements, event updates and community news.',
    previewNote:
      'Do not use contact details displayed on the current preview unless they are confirmed as the official EAGLE 2.0 details.',
  },
  messageSection: {
    title: 'Send Us a Message',
    lead: 'Complete the contact form with your details and enquiry. Our team will review your message and respond through the contact details you provide.',
    fields: ['Name', 'Email', 'Phone (optional unless required)', 'Enquiry type', 'Message'],
    ctaLabel: 'Submit Enquiry',
  },
} as const;

/**
 * Blueprint Section 12: Website Footer Content
 */
export const FOOTER_CONTENT = {
  brand: 'EAGLE 2.0 | नई सोच, नई उड़ान',
  description: 'A professional community for Chartered Accountants, CA students and allied professionals.',
  exploreLinks: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Wings', href: '/wings' },
    { label: 'Events', href: '/events' },
    { label: 'Speakers', href: '/speakers' },
    { label: 'Resources', href: '/resources' },
  ],
  communityLinks: [
    { label: 'Join Us', href: '/join' },
    { label: 'News & Updates', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Contact', href: '/contact' },
    { label: 'Leadership', href: '/about#leadership' },
  ],
  legalLinks: [
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Terms & Conditions', href: '/legal/terms' },
    { label: 'Membership Terms', href: '/legal/membership-terms' },
    { label: 'Event Registration Terms', href: '/legal/event-terms' },
    { label: 'Cancellation & Refund Policy', href: '/legal/refund' },
    { label: 'Payment Terms', href: '/legal/payment' },
  ],
  copyrightTemplate: '© [Launch year] EAGLE 2.0. All rights reserved.',
} as const;

/**
 * ============================================================================
 * Blueprint Section 13: SEO Metadata by Page
 * ============================================================================
 */
export interface BlueprintSeoPageItem {
  page: string;
  seoTitle: string;
  metaDescription: string;
  suggestedUrl: string;
  canonicalPath: string;
}

export const BLUEPRINT_SEO_METADATA: readonly BlueprintSeoPageItem[] = [
  {
    page: 'Home',
    seoTitle: 'EAGLE 2.0 | CA Professional Community India',
    metaDescription:
      'Discover EAGLE 2.0, a professional community for Chartered Accountants, CA students and allied professionals in India. Learn, connect, grow and contribute.',
    suggestedUrl: '/',
    canonicalPath: '/',
  },
  {
    page: 'About Us',
    seoTitle: 'About EAGLE 2.0 | Vision, Mission & Leadership',
    metaDescription:
      'Learn about EAGLE 2.0\'s vision, mission and leadership framework. Explore a community focused on professional learning, networking and collective growth.',
    suggestedUrl: '/about-us',
    canonicalPath: '/about',
  },
  {
    page: 'Our Wings',
    seoTitle: 'Professional Wings for Chartered Accountants | EAGLE 2.0',
    metaDescription:
      'Explore EAGLE 2.0\'s ten professional wings covering tax, audit, entrepreneurship, leadership, AI, careers, wellness, social impact and global connections.',
    suggestedUrl: '/wings',
    canonicalPath: '/wings',
  },
  {
    page: 'Events',
    seoTitle: 'CA Events, Seminars & Workshops | EAGLE 2.0',
    metaDescription:
      'Discover CA seminars, workshops, conferences and networking events with EAGLE 2.0. Explore professional learning opportunities and event registration details.',
    suggestedUrl: '/events',
    canonicalPath: '/events',
  },
  {
    page: 'Speakers',
    seoTitle: 'CA Speakers & Industry Experts | EAGLE 2.0',
    metaDescription:
      'Discover speakers, Chartered Accountants and industry experts sharing knowledge and perspectives through EAGLE 2.0 professional events.',
    suggestedUrl: '/speakers',
    canonicalPath: '/speakers',
  },
  {
    page: 'Resources',
    seoTitle: 'CA Resources, Tax Updates & Career Learning | EAGLE 2.0',
    metaDescription:
      'Explore professional learning resources, tax updates, career guidance, practice insights and technology-related content for the CA community.',
    suggestedUrl: '/resources',
    canonicalPath: '/resources',
  },
  {
    page: 'News',
    seoTitle: 'CA Community News & Professional Updates | EAGLE 2.0',
    metaDescription:
      'Stay informed about EAGLE 2.0 announcements, community initiatives, professional updates, upcoming events and member achievements.',
    suggestedUrl: '/news',
    canonicalPath: '/news',
  },
  {
    page: 'Gallery',
    seoTitle: 'CA Community Events & Gallery | EAGLE 2.0',
    metaDescription:
      'Explore photographs and highlights from EAGLE 2.0 events, professional workshops, networking sessions and community initiatives.',
    suggestedUrl: '/gallery',
    canonicalPath: '/gallery',
  },
  {
    page: 'Join Us',
    seoTitle: 'Join EAGLE 2.0 | CA Professional Community India',
    metaDescription:
      'Join EAGLE 2.0\'s professional community for Chartered Accountants, CA students and allied professionals. Discover membership and participation opportunities.',
    suggestedUrl: '/join-us',
    canonicalPath: '/join',
  },
  {
    page: 'Contact',
    seoTitle: 'Contact EAGLE 2.0 | Professional Community',
    metaDescription:
      'Contact EAGLE 2.0 for membership enquiries, event information, speaker opportunities and professional collaborations.',
    suggestedUrl: '/contact',
    canonicalPath: '/contact',
  },
] as const;

export const BLUEPRINT_SEO_METADATA_NOTE =
  'These descriptions are proposed copy. Search engines may choose different snippets based on the query and page content. Replace the preview domain with the official domain when finalised.';

/**
 * ============================================================================
 * Blueprint Section 14: Keyword Strategy
 * ============================================================================
 */
export const KEYWORD_STRATEGY = {
  primary: [
    'Chartered Accountant community India',
    'CA professional community',
    'young Chartered Accountants',
    'CA networking platform',
    'professional community for CAs',
  ],
  eventsAndLearning: [
    'CA seminars in India',
    'CA workshops',
    'Chartered Accountant networking events',
    'tax seminars',
    'GST workshops',
    'professional development for CAs',
  ],
  careerAndCommunity: [
    'CA career development',
    'young CA networking',
    'Chartered Accountant mentorship',
    'CA leadership development',
    'CA student professional development',
  ],
  specialistTopics: [
    'International taxation',
    'audit and assurance',
    'accounting practice development',
    'AI for Chartered Accountants',
    'finance automation',
    'women in the accounting profession',
  ],
  principle:
    'create useful, original content around topics the community actually covers. Do not repeat keyword lists unnaturally or create pages that offer no distinct value.',
} as const;

/**
 * ============================================================================
 * Blueprint Section 15: Developer SEO & Launch Checklist
 * ============================================================================
 */
export const DEVELOPER_SEO_CHECKLIST = {
  brandAndContent: [
    'Replace ASCEND branding with EAGLE 2.0 throughout the site, metadata and social previews.',
    'Use Nayi Soch, Nayi Udaan consistently in English and Hindi.',
    'Remove unapproved sample speakers, events, ticket prices, membership fees and contact details.',
    'Verify leadership appointments, membership eligibility and all published initiatives.',
    'Publish final Privacy Policy, Terms & Conditions and relevant event/payment policies.',
  ],
  onPageSeo: [
    'Give every indexable page a unique title and meta description.',
    'Use one clear H1 per page and logical H2/H3 headings.',
    'Use descriptive, readable URLs and relevant internal links.',
    'Use meaningful alt text for informative images.',
    'Ensure important content is available as crawlable page text.',
  ],
  technicalSeo: [
    'Enable HTTPS and confirm mobile responsiveness.',
    'Generate and submit an XML sitemap.',
    'Configure robots.txt and check that public pages are crawlable.',
    'Set canonical URLs and appropriate redirects when replacing preview URLs.',
    'Add appropriate Organization, Breadcrumb and Article structured data where applicable.',
    'Add Event structured data to eligible, individually accessible event pages.',
  ],
  analyticsAndConversion: [
    'Set up Google Search Console and verify the official domain.',
    'Configure Google Analytics 4 and test key conversion events.',
    'Track community registrations, event registrations and successful payments.',
    'Test registration confirmations, payment failures and retry flows.',
    'Test forms, navigation, accessibility and loading speed on mobile and desktop.',
  ],
} as const;

/**
 * ============================================================================
 * Blueprint Section 16: Final Brand & Editorial Guidelines
 * ============================================================================
 */
export const BRAND_EDITORIAL_GUIDELINES = {
  coreGuidelines: [
    'Lead with the community, not the committee. Visitors should immediately understand what EAGLE 2.0 offers and why it matters.',
    'Use the tagline as a brand signature. Keep “EAGLE 2.0 — Nayi Soch, Nayi Udaan” prominent without repeating it mechanically in every paragraph.',
    'Balance ambition with credibility. Describe future initiatives as proposed or upcoming until they are approved and operational.',
    'Make participation the primary action. Guide visitors towards joining, exploring a wing, registering for an event or contacting the team.',
    'Keep the website useful after launch. Regularly publish relevant events, genuine community updates, original articles and practical learning resources.',
  ],
  recommendedPositioning: {
    brandSignature: 'EAGLE 2.0 | नई सोच, नई उड़ान',
    positioningStatement:
      'A community that brings the profession together through knowledge, connections, leadership and collective action.',
    corePillars: 'Learn. Connect. Grow. Transform. Thrive. Contribute.',
  },
} as const;

/**
 * ============================================================================
 * Blueprint Section 17: Final Pre-Publication Confirmation List
 * ============================================================================
 */
export const PRE_PUBLICATION_CONFIRMATION_LIST = [
  'Confirm official organisation name, logo and brand colours.',
  'Confirm the final ten wing names and their exact scope against the approved blueprint.',
  'Confirm leadership titles, names, bios and publication permissions.',
  'Confirm membership eligibility, benefits, fees and any member-only access.',
  'Confirm event calendar, registration workflow, payment gateway and refund policy.',
  'Confirm official email, phone, address and social media links.',
  'Approve legal pages and privacy/data handling language.',
  'Replace preview domain and test all internal/external links.',
  'Test the site on mobile, tablet and desktop before launch.',
] as const;




