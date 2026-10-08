import { PrismaClient, Role, UserStatus, EventMode, EventCategory } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  PROTOTYPE_WINGS,
  PROTOTYPE_SPEAKERS,
  PROTOTYPE_EVENTS,
  PROTOTYPE_NEWS,
  PROTOTYPE_RESOURCES,
  DEFAULT_DARK_TOKENS,
  DEFAULT_LIGHT_TOKENS,
} from '@ascend/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ASCEND CA Community database from prototype...');

  // 1. Create Super Admin
  const adminPasswordHash = await argon2.hash('Admin@Ascend2027!');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@ascend-ca.in' },
    update: {},
    create: {
      email: 'admin@ascend-ca.in',
      mobile: '9876543210',
      passwordHash: adminPasswordHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isMobileVerified: true,
      twoFactorEnabled: false, // will require setup on first login or pre-set
    },
  });
  console.log(`Created Super Admin: ${superAdmin.email}`);

  // 2. Seed Default Themes
  await prisma.themeSettings.upsert({
    where: {
      platform_mode_status: {
        platform: 'WEB',
        mode: 'DARK',
        status: 'PUBLISHED',
      },
    },
    update: {
      tokens: DEFAULT_DARK_TOKENS as any,
    },
    create: {
      platform: 'WEB',
      mode: 'DARK',
      status: 'PUBLISHED',
      version: 1,
      tokens: DEFAULT_DARK_TOKENS as any,
      fonts: {
        sans: 'Inter',
        display: 'Inter Tight',
        serif: 'Instrument Serif',
        mono: 'Geist Mono',
      },
    },
  });

  await prisma.themeSettings.upsert({
    where: {
      platform_mode_status: {
        platform: 'WEB',
        mode: 'LIGHT',
        status: 'PUBLISHED',
      },
    },
    update: {
      tokens: DEFAULT_LIGHT_TOKENS as any,
    },
    create: {
      platform: 'WEB',
      mode: 'LIGHT',
      status: 'PUBLISHED',
      version: 1,
      tokens: DEFAULT_LIGHT_TOKENS as any,
      fonts: {
        sans: 'Inter',
        display: 'Inter Tight',
        serif: 'Instrument Serif',
        mono: 'Geist Mono',
      },
    },
  });
  console.log('Seeded Dark & Light published theme tokens');

  // 3. Seed Wings
  const wingMap: Record<number, string> = {};
  for (const w of PROTOTYPE_WINGS) {
    const wing = await prisma.wing.upsert({
      where: { number: w.number },
      update: {
        name: w.name,
        color: w.color,
        tags: w.tags,
        activities: w.activities,
      },
      create: {
        number: w.number,
        name: w.name,
        color: w.color,
        tags: w.tags,
        activities: w.activities,
      },
    });
    wingMap[w.number] = wing.id;
  }
  console.log(`Seeded ${PROTOTYPE_WINGS.length} Wings`);

  // 4. Seed Speakers
  const speakerMap: Record<string, string> = {};
  for (const [key, s] of Object.entries(PROTOTYPE_SPEAKERS)) {
    const speaker = await prisma.speaker.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        title: s.title,
        bio: s.bio,
        expertise: s.expertise,
      },
      create: {
        slug: s.slug,
        name: s.name,
        title: s.title,
        bio: s.bio,
        expertise: s.expertise,
      },
    });
    speakerMap[key] = speaker.id;
  }
  console.log(`Seeded ${Object.keys(PROTOTYPE_SPEAKERS).length} Speakers`);

  // 5. Seed Events & Link Speakers
  for (const e of PROTOTYPE_EVENTS) {
    const wingId = wingMap[e.wingNumber];
    if (!wingId) continue;

    const event = await prisma.event.upsert({
      where: { slug: e.slug },
      update: {
        title: e.title,
        wingId,
        category: e.category as EventCategory,
        date: e.date,
        time: e.time,
        venue: e.venue,
        city: e.city,
        mode: e.mode as EventMode,
        fee: e.fee,
        memberFee: e.memberFee,
        seatsTotal: e.seatsTotal,
        seatsTaken: e.seatsTaken,
        description: e.description,
      },
      create: {
        slug: e.slug,
        title: e.title,
        wingId,
        category: e.category as EventCategory,
        date: e.date,
        time: e.time,
        venue: e.venue,
        city: e.city,
        mode: e.mode as EventMode,
        fee: e.fee,
        memberFee: e.memberFee,
        seatsTotal: e.seatsTotal,
        seatsTaken: e.seatsTaken,
        description: e.description,
      },
    });

    // Link speakers
    for (let idx = 0; idx < e.speakerSlugs.length; idx++) {
      const spkSlug = e.speakerSlugs[idx];
      const speakerId = speakerMap[spkSlug];
      if (speakerId) {
        await prisma.eventSpeaker.upsert({
          where: {
            eventId_speakerId: {
              eventId: event.id,
              speakerId,
            },
          },
          update: { order: idx },
          create: {
            eventId: event.id,
            speakerId,
            order: idx,
          },
        });
      }
    }
  }
  console.log(`Seeded ${PROTOTYPE_EVENTS.length} Events`);

  // 6. Seed News
  for (const n of PROTOTYPE_NEWS) {
    const slug = n.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.news.upsert({
      where: { slug },
      update: {
        title: n.title,
        category: n.category,
        date: n.date,
        summary: n.summary,
        content: n.content,
      },
      create: {
        slug,
        title: n.title,
        category: n.category,
        date: n.date,
        summary: n.summary,
        content: n.content,
      },
    });
  }
  console.log(`Seeded ${PROTOTYPE_NEWS.length} News items`);

  // 7. Seed Resources
  for (const r of PROTOTYPE_RESOURCES) {
    const existing = await prisma.resource.findFirst({ where: { title: r.title } });
    if (!existing) {
      await prisma.resource.create({
        data: {
          title: r.title,
          category: r.category,
          format: r.format,
        },
      });
    }
  }
  console.log(`Seeded ${PROTOTYPE_RESOURCES.length} Resources`);

  // 8. Seed ContentBlocks (CMS)
  const contentBlocks = [
    {
      key: 'home.hero',
      section: 'home',
      title: 'Where young CAs rise together.',
      subtitle: 'Events, ten professional wings and a network that grows with your career.',
      content: {
        eyebrow: 'Pan-India CA community · Est. 2027',
        targetDate: '2027-01-01T00:00:00',
        primaryCta: 'Join the community',
        secondaryCta: 'Explore events',
      },
    },
    {
      key: 'about.vision',
      section: 'about',
      title: 'Vision & Mission',
      content: {
        vision:
          "One of India's most active professional communities for Chartered Accountants, built on connection, continuous learning and leadership.",
        mission:
          'A platform where professionals learn, connect, grow, transform, thrive and contribute.',
      },
    },
    {
      key: 'about.principles',
      section: 'about',
      title: 'How we decide.',
      content: {
        principles: [
          'Member first',
          'Value driven',
          'Inclusive community',
          'Future-ready',
          'Ethical & professional',
          'National & global',
        ],
      },
    },
    {
      key: 'contact.info',
      section: 'contact',
      title: 'Talk to us.',
      content: {
        email: 'hello@ascend-ca.in',
        phone: '+91 98XXX XXXXX',
        office: 'New Delhi',
      },
    },
  ];

  for (const cb of contentBlocks) {
    await prisma.contentBlock.upsert({
      where: { key: cb.key },
      update: {
        section: cb.section,
        title: cb.title,
        subtitle: cb.subtitle,
        content: cb.content,
      },
      create: {
        key: cb.key,
        section: cb.section,
        title: cb.title,
        subtitle: cb.subtitle,
        content: cb.content,
      },
    });
  }
  console.log(`Seeded CMS Content Blocks`);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
