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

  if (!technology) {
    throw new Error("Technology category seed failed");
  }

  await prisma.event.upsert({
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
