import { EventStatus, PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required seed environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const customerPassword = await hash(required("DEMO_CUSTOMER_PASSWORD"), 12);
  const organizerPassword = await hash(required("DEMO_ORGANIZER_PASSWORD"), 12);

  const organizer = await prisma.user.upsert({
    where: { email: required("DEMO_ORGANIZER_EMAIL") },
    update: {},
    create: {
      email: required("DEMO_ORGANIZER_EMAIL"),
      passwordHash: organizerPassword,
      name: "Ayu Pratama",
      role: UserRole.ORGANIZER,
      referralCode: "EV-AYU2026",
    },
  });

  await prisma.user.upsert({
    where: { email: required("DEMO_CUSTOMER_EMAIL") },
    update: {},
    create: {
      email: required("DEMO_CUSTOMER_EMAIL"),
      passwordHash: customerPassword,
      name: "Bima Santoso",
      role: UserRole.CUSTOMER,
      referralCode: "EV-BIMA2026",
      referredById: organizer.id,
    },
  });

  const categorySeeds = [
    ["Music", "music"],
    ["Technology", "technology"],
    ["Food & Drink", "food-and-drink"],
    ["Sports", "sports"],
  ] as const;

  const categories = await Promise.all(
    categorySeeds.map(([name, slug]) =>
      prisma.category.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
      }),
    ),
  );

  const technology = categories.find((category) => category.slug === "technology");
  const music = categories.find((category) => category.slug === "music");
  const food = categories.find((category) => category.slug === "food-and-drink");

  if (!technology || !music || !food) {
    throw new Error("Event category seed failed");
  }

  const productMeetup = await prisma.event.upsert({
    where: { slug: "jakarta-product-meetup-2026" },
    update: {},
    create: {
      organizerId: organizer.id,
      categoryId: technology.id,
      name: "Jakarta Product Meetup 2026",
      slug: "jakarta-product-meetup-2026",
      description:
        "A practical evening of product talks, portfolio feedback, and community networking.",
      venue: "Kuningan City Hall",
      address: "Jl. Prof. Dr. Satrio, Kuningan",
      city: "Jakarta",
      province: "DKI Jakarta",
      startsAt: new Date("2026-10-17T11:00:00.000Z"),
      endsAt: new Date("2026-10-17T14:30:00.000Z"),
      capacity: 150,
      availableSeats: 150,
      isFree: false,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      ticketTypes: {
        create: [
          {
            name: "General Admission",
            price: 150_000,
            capacity: 120,
            availableSeats: 120,
          },
          {
            name: "Community Pass",
            description: "Limited allocation for students and community members.",
            price: 75_000,
            capacity: 30,
            availableSeats: 30,
          },
        ],
      },
    },
  });

  const sunsetSessions = await prisma.event.upsert({
    where: { slug: "sunset-sessions-bandung" },
    update: {},
    create: {
      organizerId: organizer.id,
      categoryId: music.id,
      name: "Sunset Sessions Bandung",
      slug: "sunset-sessions-bandung",
      description:
        "An open-air evening of independent music, local food stalls, and relaxed city views.",
      venue: "Teras Cikapundung",
      address: "Jl. Siliwangi, Cipaganti",
      city: "Bandung",
      province: "West Java",
      startsAt: new Date("2026-11-07T09:30:00.000Z"),
      endsAt: new Date("2026-11-07T14:00:00.000Z"),
      capacity: 300,
      availableSeats: 300,
      isFree: false,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      ticketTypes: {
        create: [
          {
            name: "Festival Pass",
            price: 125_000,
            capacity: 250,
            availableSeats: 250,
          },
          {
            name: "Front Stage",
            description: "A limited section close to the main stage.",
            price: 225_000,
            capacity: 50,
            availableSeats: 50,
          },
        ],
      },
    },
  });

  await prisma.event.upsert({
    where: { slug: "surabaya-taste-trail" },
    update: {},
    create: {
      organizerId: organizer.id,
      categoryId: food.id,
      name: "Surabaya Taste Trail",
      slug: "surabaya-taste-trail",
      description:
        "Meet local cooks and sample a curated trail of Surabaya favorites in one afternoon.",
      venue: "Tunjungan Plaza Courtyard",
      address: "Jl. Jenderal Basuki Rachmat No. 8-12",
      city: "Surabaya",
      province: "East Java",
      startsAt: new Date("2026-12-05T04:00:00.000Z"),
      endsAt: new Date("2026-12-05T09:00:00.000Z"),
      capacity: 200,
      availableSeats: 200,
      isFree: true,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      ticketTypes: {
        create: [
          {
            name: "Free Registration",
            price: 0,
            capacity: 200,
            availableSeats: 200,
          },
        ],
      },
    },
  });

  await prisma.voucher.upsert({
    where: { code: "PRODUCT10" },
    update: {},
    create: {
      eventId: productMeetup.id,
      code: "PRODUCT10",
      name: "Product community offer",
      discountPercent: 10,
      usageLimit: 40,
      startsAt: new Date("2026-07-01T00:00:00.000Z"),
      endsAt: new Date("2026-10-10T23:59:59.000Z"),
    },
  });

  await prisma.voucher.upsert({
    where: { code: "SUNSET25" },
    update: {},
    create: {
      eventId: sunsetSessions.id,
      code: "SUNSET25",
      name: "Sunset early booking",
      discountAmount: 25_000,
      usageLimit: 60,
      startsAt: new Date("2026-07-01T00:00:00.000Z"),
      endsAt: new Date("2026-10-31T23:59:59.000Z"),
    },
  });

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      name: "Referral welcome reward",
      discountPercent: 10,
      validityDays: 90,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
