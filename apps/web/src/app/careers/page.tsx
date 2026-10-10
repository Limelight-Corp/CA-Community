import type { Metadata } from 'next';
import { WORK_MODES } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { CtaBand, PageHero, Section } from '../../components/content/ui';
import { JobBoard, type JobCard } from '../../components/careers/JobBoard';
import { getSettings } from '../../lib/community-store';
import { safeUrl } from '../../lib/content';
import { openJobs } from '../../lib/jobs';
import { siteTaxonomy } from '../../lib/taxonomy';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'Careers & articleship',
    description: `Articleship, jobs and internships for Chartered Accountants and CA students, shared by ${siteName}.`,
    alternates: { canonical: '/careers' },
  };
}

export default function CareersPage() {
  const jobs: JobCard[] = openJobs().map((j) => ({
    slug: j.slug,
    title: j.title,
    organisation: j.organisation,
    type: j.type,
    location: j.location,
    workMode: j.workMode,
    experience: j.experience,
    compensation: j.compensation,
    deadline: j.deadline,
    wing: j.wing,
    logoUrl: safeUrl(j.logoUrl),
    featured: !!j.featured,
    isMembersOnly: j.isMembersOnly,
  }));

  return (
    <>
      <PageHero
        eyebrow="Careers board"
        eyebrowTone="blue"
        title="Your next move,"
        accent="right here."
        lead="Articleship, jobs and internships for CAs and CA students — shared by firms and members of the community."
        ghost="CAREERS"
      />
      <Section className="pt-12 md:pt-16">
        <Container size="wide">
          <JobBoard jobs={jobs} types={siteTaxonomy('jobTypes', jobs.map((j) => j.type))} modes={[...WORK_MODES]} />
        </Container>
      </Section>
      <CtaBand
        title="Hiring CAs or"
        accent="articled assistants?"
        lead="Share your opening with the community — tell us the role, eligibility and how to apply."
        primary={{ href: '/contact?topic=careers#contact-form', label: 'Post an opening' }}
      />
    </>
  );
}
