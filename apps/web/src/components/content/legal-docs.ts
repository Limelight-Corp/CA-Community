/**
 * DRAFT legal documents (Website Checklist §24).
 * Generic placeholder wording only — to be reviewed and replaced by the organisation's
 * legal / professional advisor before launch. Do not add registration numbers or addresses here.
 */

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  slug: 'privacy' | 'terms' | 'event-terms' | 'refund' | 'payment' | 'cookies';
  title: string;
  short: string;
  summary: string;
  sections: LegalSection[];
}

const CONTACT_LINE = 'For any question about this document, please reach us through the Contact page of this website.';

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    short: 'Privacy',
    summary: 'What personal information we collect, why we collect it, how we protect it and the choices you have.',
    sections: [
      {
        heading: 'Who we are',
        body: [
          'This website is operated by the community named on this site (“we”, “us”, “our”). This policy explains how we handle personal information when you browse the site, apply for membership, register for an event, or contact us.',
        ],
      },
      {
        heading: 'Information we collect',
        body: [
          'Information you give us: your name, email address, mobile number, city, professional details (such as CA membership number, year of qualification, area of practice, firm or company, LinkedIn profile), your interests, and anything you write in a message to us.',
          'Event information: the events you register for, attendance, and payment status where an event is paid.',
          'Technical information: basic device and usage data (such as browser type, pages visited and approximate location derived from your IP address) collected through essential cookies and, only if you allow it, analytics cookies.',
        ],
      },
      {
        heading: 'How we use your information',
        body: [
          'To review and manage membership applications and member profiles; to process event registrations, payments and attendance; to respond to your enquiries; to send you service communications about your membership or registrations; and, where you have agreed, to share community news and updates.',
          'We also use information to keep the website secure, prevent misuse, and meet our legal obligations.',
        ],
      },
      {
        heading: 'Legal basis and consent',
        body: [
          'We process personal data on the basis of your consent (given, for example, when you submit a form) and for legitimate purposes connected with running the community, in line with applicable Indian data protection law, including the Digital Personal Data Protection Act, 2023 as and when its provisions apply.',
          'You may withdraw consent at any time; this does not affect processing already carried out.',
        ],
      },
      {
        heading: 'Sharing',
        body: [
          'We do not sell your personal data. We share it only with service providers who help us operate the community (for example hosting, email, payment processing and event management), under obligations of confidentiality, or where required by law.',
          'If you opt into a member directory, only the details you choose to show will be visible to other signed-in members.',
        ],
      },
      {
        heading: 'Retention and security',
        body: [
          'We keep personal data only for as long as needed for the purposes above or as required by law, and then delete or anonymise it. We use reasonable technical and organisational measures to protect it, but no method of transmission or storage is completely secure.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Subject to applicable law, you can ask to access, correct, update or erase your personal data, withdraw consent, or raise a grievance. We will respond within a reasonable time.',
          CONTACT_LINE,
        ],
      },
      {
        heading: 'Changes to this policy',
        body: ['We may update this policy from time to time. The latest version will always be available on this page.'],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    short: 'Terms',
    summary: 'The rules for using this website and the community’s online services.',
    sections: [
      {
        heading: 'Acceptance',
        body: ['By using this website you agree to these terms. If you do not agree, please do not use the site.'],
      },
      {
        heading: 'Use of the website',
        body: [
          'You agree to use the site lawfully and respectfully, not to attempt to gain unauthorised access to any part of it, not to interfere with its operation, and not to submit false, misleading or infringing information.',
        ],
      },
      {
        heading: 'Membership',
        body: [
          'Submitting a membership application does not by itself create a membership. Applications are reviewed by the community and may be accepted or declined. Plans, benefits and fees shown on the site are subject to confirmation and may change.',
          'Members are expected to uphold the community’s guiding principles and professional and ethical standards. Membership may be suspended or ended for conduct that harms the community or its members.',
        ],
      },
      {
        heading: 'Content and intellectual property',
        body: [
          'Content on this site — including text, graphics, logos, resources and recordings — belongs to the community or its licensors and is provided for personal, non-commercial professional use. Please do not reproduce or redistribute it without permission.',
          'Information and resources on the site are for general knowledge only and do not constitute professional advice. Always apply your own professional judgement.',
        ],
      },
      {
        heading: 'Third-party links',
        body: ['The site may link to third-party websites. We are not responsible for their content or practices.'],
      },
      {
        heading: 'Liability',
        body: [
          'To the extent permitted by law, the community is not liable for any indirect or consequential loss arising from use of the website or reliance on its content.',
        ],
      },
      {
        heading: 'Governing law',
        body: ['These terms are governed by the laws of India. ' + CONTACT_LINE],
      },
    ],
  },
  {
    slug: 'event-terms',
    title: 'Event Registration Terms',
    short: 'Event terms',
    summary: 'Terms that apply when you register for and attend a community event, online or in person.',
    sections: [
      {
        heading: 'Registration',
        body: [
          'A registration is confirmed only when you receive a confirmation for it and, for paid events, once payment has been successfully received. Seats are limited and allocated on a first-come basis.',
          'Please make sure the details you provide are accurate; certificates and communications will use them.',
        ],
      },
      {
        heading: 'Fees and member pricing',
        body: [
          'Event fees, member prices and any applicable taxes are shown on each event page. Member pricing applies only to members in good standing at the time of registration.',
        ],
      },
      {
        heading: 'Changes to events',
        body: [
          'We may need to change the date, time, venue, format, speakers or agenda of an event. We will let registered participants know as soon as reasonably possible. If an event is cancelled by us, the Cancellation & Refund Policy applies.',
        ],
      },
      {
        heading: 'Attendance and conduct',
        body: [
          'Participants are expected to behave professionally and respectfully. We may refuse entry to, or remove, anyone whose conduct is disruptive or unsafe, without refund.',
          'Entry may require the registration confirmation and a valid photo ID.',
        ],
      },
      {
        heading: 'Photography and recording',
        body: [
          'Events may be photographed, filmed or recorded, and the material may be used on the community’s website and social channels. If you prefer not to appear, please tell the event team on the day.',
        ],
      },
      {
        heading: 'Certificates and CPE',
        body: [
          'Participation certificates, where offered, are issued on the basis of recorded attendance. Any recognition of learning hours by a professional body is subject to that body’s rules.',
        ],
      },
      {
        heading: 'Contact',
        body: [CONTACT_LINE],
      },
    ],
  },
  {
    slug: 'refund',
    title: 'Cancellation & Refund Policy',
    short: 'Refunds',
    summary: 'How cancellations, transfers and refunds work for paid events and memberships.',
    sections: [
      {
        heading: 'Cancellation by you',
        body: [
          'If you can no longer attend a paid event, please let us know as early as possible. Unless an event page states otherwise, cancellations received a reasonable time before the event may be eligible for a refund or credit; late cancellations and no-shows may not be refundable.',
          'Where the event permits, you may transfer your registration to a colleague by contacting us before the event.',
        ],
      },
      {
        heading: 'Cancellation by us',
        body: [
          'If we cancel an event, registered participants will be offered a full refund of the amount paid, or the option to move to a rescheduled date where available.',
        ],
      },
      {
        heading: 'Membership fees',
        body: [
          'Membership fees are generally non-refundable once the membership has been activated, except where required by law or at the community’s discretion.',
        ],
      },
      {
        heading: 'How refunds are paid',
        body: [
          'Approved refunds are made to the original payment method. Processing times depend on the bank or payment provider. Payment gateway charges may be non-refundable where permitted by law.',
        ],
      },
      {
        heading: 'Requesting a refund',
        body: ['Please include your booking or registration reference with your request. ' + CONTACT_LINE],
      },
    ],
  },
  {
    slug: 'payment',
    title: 'Payment Terms',
    short: 'Payments',
    summary: 'How payments for events and memberships are taken, confirmed and invoiced.',
    sections: [
      {
        heading: 'Accepted payments',
        body: [
          'Payments are processed securely by a third-party payment gateway, which may support methods such as UPI, debit and credit cards and net banking. We do not store your full card details.',
        ],
      },
      {
        heading: 'Prices and taxes',
        body: [
          'All prices are in Indian Rupees (₹). Applicable taxes, if any, will be shown before you pay. Prices may change, but the price shown at the time of a confirmed payment applies to that purchase.',
        ],
      },
      {
        heading: 'Confirmation and receipts',
        body: [
          'Your registration or membership is confirmed once the payment provider reports a successful payment. A receipt or invoice will be issued to the email address you provide.',
        ],
      },
      {
        heading: 'Failed or duplicate payments',
        body: [
          'If a payment fails but your account is debited, the amount is usually reversed automatically by your bank or the payment provider. If it is not, or if you are charged twice, please contact us with the transaction details.',
        ],
      },
      {
        heading: 'Contact',
        body: [CONTACT_LINE],
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    short: 'Cookies',
    summary: 'What cookies and similar technologies this website uses and how you can control them.',
    sections: [
      {
        heading: 'What cookies are',
        body: ['Cookies are small text files stored on your device by your browser. They help websites work and can provide information to site owners.'],
      },
      {
        heading: 'Cookies we use',
        body: [
          'Essential cookies: needed for core features such as keeping you signed in, security and remembering your cookie choices. These cannot be switched off.',
          'Analytics cookies: used only with your consent to understand how visitors use the site so we can improve it. They collect aggregated information.',
        ],
      },
      {
        heading: 'Third-party content',
        body: [
          'Some pages embed content from third parties, such as maps or videos. Those services may set their own cookies when you interact with them, under their own policies.',
        ],
      },
      {
        heading: 'Managing cookies',
        body: [
          'You can change your choice for optional cookies at any time through the cookie banner where available, and you can block or delete cookies in your browser settings. Blocking essential cookies may stop parts of the site from working.',
        ],
      },
      {
        heading: 'Contact',
        body: [CONTACT_LINE],
      },
    ],
  },
];

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}
