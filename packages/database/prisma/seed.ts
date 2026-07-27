import { EventStatus, PrismaClient, TransactionStatus, UserRole } from "@prisma/client";
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
  console.log("Starting Indonesian event demo data seed...");

  const customerPassword = await hash(required("DEMO_CUSTOMER_PASSWORD"), 12);
  const organizerPassword = await hash(required("DEMO_ORGANIZER_PASSWORD"), 12);
  const generalPassword = await hash("Password123!", 12);

  // 1. Create Indonesian event organizers.
  const organizer1 = await prisma.user.upsert({
    where: { email: required("DEMO_ORGANIZER_EMAIL") },
    update: { name: "Eventure Nusantara" },
    create: {
      email: required("DEMO_ORGANIZER_EMAIL"),
      passwordHash: organizerPassword,
      name: "Eventure Nusantara",
      role: UserRole.ORGANIZER,
      referralCode: "EV-LIVE2026",
    },
  });

  const organizer2 = await prisma.user.upsert({
    where: { email: "oscar@example.com" },
    update: { name: "Purwadhika Event Lab" },
    create: {
      email: "oscar@example.com",
      passwordHash: generalPassword,
      name: "Purwadhika Event Lab",
      role: UserRole.ORGANIZER,
      referralCode: "EV-PURWA2026",
    },
  });

  const organizer3 = await prisma.user.upsert({
    where: { email: "sound@example.com" },
    update: { name: "Soundrenaline Indonesia" },
    create: {
      email: "sound@example.com",
      passwordHash: generalPassword,
      name: "Soundrenaline Indonesia",
      role: UserRole.ORGANIZER,
      referralCode: "EV-SOUND2026",
    },
  });

  const organizers = [organizer1, organizer2, organizer3];

  // 2. Create customers for referral, account, and transaction demos.
  const customer1 = await prisma.user.upsert({
    where: { email: required("DEMO_CUSTOMER_EMAIL") },
    update: { name: "Bima Santoso" },
    create: {
      email: required("DEMO_CUSTOMER_EMAIL"),
      passwordHash: customerPassword,
      name: "Bima Santoso",
      role: UserRole.CUSTOMER,
      referralCode: "EV-BIMA2026",
      referredById: organizer1.id,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "customer2@example.com" },
    update: { name: "Ayu Lestari" },
    create: {
      email: "customer2@example.com",
      passwordHash: generalPassword,
      name: "Ayu Lestari",
      role: UserRole.CUSTOMER,
      referralCode: "EV-AYU2026",
      referredById: organizer1.id,
    },
  });

  const extraCustomers = [];
  const customerNames = [
    "Citra Maharani",
    "Dimas Pratama",
    "Eka Wulandari",
    "Fajar Nugraha",
    "Gita Puspita",
    "Hendra Setiawan",
    "Indah Permatasari",
    "Joko Saputra",
  ];

  for (let i = 0; i < customerNames.length; i++) {
    const email = `customer${i + 3}@example.com`;
    const cust = await prisma.user.upsert({
      where: { email },
      update: { name: customerNames[i]! },
      create: {
        email,
        passwordHash: generalPassword,
        name: customerNames[i]!,
        role: UserRole.CUSTOMER,
        referralCode: `EV-CUST${i + 3}`,
        referredById: customer1.id,
      },
    });
    extraCustomers.push(cust);
  }

  const allCustomers = [customer1, customer2, ...extraCustomers];

  // 3. Create event categories.
  const categorySeeds = [
    ["Music", "music"],
    ["Technology", "technology"],
    ["Food & Drink", "food-and-drink"],
    ["Sports", "sports"],
    ["Art & Theater", "art-and-theater"],
    ["Business", "business"],
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
      organizerId: organizer1.id,
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
      organizerId: organizer1.id,
      categoryId: music.id,
      name: "Sunset Sessions Bandung",
      slug: "sunset-sessions-bandung",
      description:
        "An open-air evening of independent music, local food stalls, and relaxed city views.",
      venue: "Teras Cikapundung",
      address: "Jl. Siliwangi, Cipaganti",
      city: "Bandung",
      province: "Jawa Barat",
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
      organizerId: organizer1.id,
      categoryId: food.id,
      name: "Surabaya Taste Trail",
      slug: "surabaya-taste-trail",
      description:
        "Meet local cooks and sample a curated trail of Surabaya favorites in one afternoon.",
      venue: "Tunjungan Plaza Courtyard",
      address: "Jl. Jenderal Basuki Rachmat No. 8-12",
      city: "Surabaya",
      province: "Jawa Timur",
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
  const welcomeCoupon = await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      name: "Referral welcome reward",
      discountPercent: 10,
      validityDays: 90,
    },
  });

  await prisma.userCoupon.upsert({
    where: {
      userId_couponId: {
        userId: customer1.id,
        couponId: welcomeCoupon.id,
      },
    },
    update: {
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      redeemedAt: null,
    },
    create: {
      userId: customer1.id,
      couponId: welcomeCoupon.id,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  // 5. Generate 36 events across Indonesian cities and every month of 2026.
  console.log("Seeding 36 events across Indonesia...");
  const eventTemplates = [
    {
      title: "Jakarta Tech Summit",
      city: "Jakarta",
      province: "DKI Jakarta",
      venue: "Kuningan City Hall",
      cat: "technology",
      basePrice: 200_000,
    },
    {
      title: "Soundrenaline Music Festival",
      city: "Badung",
      province: "Bali",
      venue: "Garuda Wisnu Kencana",
      cat: "music",
      basePrice: 500_000,
    },
    {
      title: "Nusantara Culinary Expo",
      city: "Bandung",
      province: "Jawa Barat",
      venue: "Trans Studio Convention Centre",
      cat: "food-and-drink",
      basePrice: 50_000,
    },
    {
      title: "Indonesia Marathon",
      city: "Jakarta",
      province: "DKI Jakarta",
      venue: "Gelora Bung Karno",
      cat: "sports",
      basePrice: 250_000,
    },
    {
      title: "AI & Future Product Conference",
      city: "Surabaya",
      province: "Jawa Timur",
      venue: "Grand City Convention Hall",
      cat: "technology",
      basePrice: 300_000,
    },
    {
      title: "Jazz Traffic Festival",
      city: "Surabaya",
      province: "Jawa Timur",
      venue: "Grand City Arena",
      cat: "music",
      basePrice: 350_000,
    },
    {
      title: "Coffee & Barista Championship",
      city: "Yogyakarta",
      province: "Daerah Istimewa Yogyakarta",
      venue: "Jogja Expo Center",
      cat: "food-and-drink",
      basePrice: 75_000,
    },
    {
      title: "Badminton Open 2026",
      city: "Jakarta",
      province: "DKI Jakarta",
      venue: "Istora Senayan",
      cat: "sports",
      basePrice: 150_000,
    },
    {
      title: "Startup Pitch & Networking",
      city: "Jakarta",
      province: "DKI Jakarta",
      venue: "District 8 SCBD",
      cat: "business",
      basePrice: 100_000,
    },
    {
      title: "Modern Contemporary Art Gala",
      city: "Bandung",
      province: "Jawa Barat",
      venue: "NuArt Sculpture Park",
      cat: "art-and-theater",
      basePrice: 120_000,
    },
  ];

  const createdEvents = [];
  for (let i = 1; i <= 36; i++) {
    const tmpl = eventTemplates[i % eventTemplates.length]!;
    const slug = `${tmpl.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-2026-${i}`;
    const org = organizers[i % organizers.length]!;
    const cat = (categories.find((c) => c.slug === tmpl.cat) || categories[0])!;

    // Spread event dates across all 12 months of 2026 (month index 0 to 11)
    const month = (i - 1) % 12;
    const day = (i % 25) + 1;
    const startsAt = new Date(Date.UTC(2026, month, day, 10, 0, 0));
    const endsAt = new Date(Date.UTC(2026, month, day, 18, 0, 0));
    const publishedAt = new Date(Date.UTC(2026, Math.max(0, month - 1), 1, 8, 0, 0));

    const event = await prisma.event.upsert({
      where: { slug },
      update: {
        startsAt,
        endsAt,
        status: EventStatus.PUBLISHED,
      },
      create: {
        organizerId: org.id,
        categoryId: cat.id,
        name: `${tmpl.title} #${i}`,
        slug,
        description: `Experience the best of ${tmpl.cat} at ${tmpl.venue}, ${tmpl.city}. Join hundreds of enthusiasts for an unforgettable day!`,
        venue: tmpl.venue,
        address: `Jl. Utama No. ${i}, ${tmpl.city}`,
        city: tmpl.city,
        province: tmpl.province,
        startsAt,
        endsAt,
        capacity: 200,
        availableSeats: 180,
        isFree: false,
        status: EventStatus.PUBLISHED,
        publishedAt,
        ticketTypes: {
          create: [
            {
              name: "General Admission",
              price: tmpl.basePrice,
              capacity: 150,
              availableSeats: 135,
            },
            {
              name: "VIP Priority Access",
              price: tmpl.basePrice * 2,
              capacity: 50,
              availableSeats: 45,
            },
          ],
        },
      },
      include: {
        ticketTypes: true,
      },
    });
    createdEvents.push(event);
  }

  // 6. Generate a useful mix of transaction states for both customer and organizer demos.
  console.log("Seeding 40 transactions and payment proofs...");

  const receiptImages = [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80",
    "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&q=80",
    "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=600&q=80",
  ];

  const seededAt = new Date();
  const pastEvents = createdEvents.filter((event) => event.endsAt < seededAt);
  const futureEvents = createdEvents.filter((event) => event.startsAt > seededAt);

  if (pastEvents.length === 0 || futureEvents.length === 0) {
    throw new Error("Transaction seed requires both past and future events");
  }

  for (let j = 1; j <= 40; j++) {
    const invoiceNumber = `INV-2026-${String(j).padStart(3, "0")}`;
    const customer = allCustomers[(j - 1) % allCustomers.length]!;
    let status: TransactionStatus = TransactionStatus.WAITING_FOR_PAYMENT;

    if (j <= 15) {
      status = TransactionStatus.DONE;
    } else if (j <= 25) {
      status = TransactionStatus.WAITING_FOR_CONFIRMATION;
    } else if (j <= 30) {
      status = TransactionStatus.REJECTED;
    } else if (j > 35) {
      status = TransactionStatus.CANCELED;
    }

    const eventPool = status === TransactionStatus.DONE ? pastEvents : futureEvents;
    const event = eventPool[(j - 1) % eventPool.length]!;
    const ticketType = event.ticketTypes[(j - 1) % event.ticketTypes.length]!;
    const qty = ((j - 1) % 4) + 1;
    const subtotal = ticketType.price * qty;
    const total = subtotal;
    let paymentUploadedAt: Date | null = null;
    let completedAt: Date | null = null;
    let organizerDeadline: Date | null = null;
    let canceledAt: Date | null = null;
    let cancellationReason: string | null = null;
    let isAttended = false;
    const isPending =
      status === TransactionStatus.WAITING_FOR_PAYMENT ||
      status === TransactionStatus.WAITING_FOR_CONFIRMATION;
    const createdAt = isPending
      ? new Date(seededAt.getTime() - (j % 30) * 60 * 1000)
      : new Date(event.startsAt.getTime() - (14 + (j % 10)) * 24 * 60 * 60 * 1000);
    const paymentDeadline = isPending
      ? new Date(seededAt.getTime() + 2 * 60 * 60 * 1000)
      : new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);

    if (status === TransactionStatus.DONE) {
      paymentUploadedAt = new Date(createdAt.getTime() + 30 * 60 * 1000);
      completedAt = new Date(paymentUploadedAt.getTime() + 60 * 60 * 1000);
      organizerDeadline = new Date(paymentUploadedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      isAttended = true;
    } else if (status === TransactionStatus.WAITING_FOR_CONFIRMATION) {
      paymentUploadedAt = new Date(seededAt.getTime() - (j % 20) * 60 * 1000);
      organizerDeadline = new Date(seededAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    } else if (status === TransactionStatus.REJECTED) {
      paymentUploadedAt = new Date(createdAt.getTime() + 20 * 60 * 1000);
      organizerDeadline = new Date(paymentUploadedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      canceledAt = new Date(paymentUploadedAt.getTime() + 60 * 60 * 1000);
      cancellationReason = "Payment proof could not be verified";
    } else if (status === TransactionStatus.CANCELED) {
      canceledAt = new Date(createdAt.getTime() + 60 * 60 * 1000);
      cancellationReason = "Canceled by customer";
    }

    const tx = await prisma.transaction.upsert({
      where: { invoiceNumber },
      update: {
        status,
        paymentUploadedAt,
        completedAt,
        organizerDeadline,
        canceledAt,
        cancellationReason,
        isAttended,
      },
      create: {
        invoiceNumber,
        customerId: customer.id,
        eventId: event.id,
        status,
        subtotal,
        total,
        paymentDeadline,
        organizerDeadline,
        paymentUploadedAt,
        completedAt,
        canceledAt,
        cancellationReason,
        isAttended,
        createdAt,
        items: {
          create: [
            {
              ticketTypeId: ticketType.id,
              quantity: qty,
              unitPrice: ticketType.price,
              subtotal: total,
            },
          ],
        },
      },
    });

    if (
      status === TransactionStatus.WAITING_FOR_CONFIRMATION ||
      status === TransactionStatus.DONE ||
      status === TransactionStatus.REJECTED
    ) {
      await prisma.paymentProof.upsert({
        where: { transactionId: tx.id },
        update: {},
        create: {
          transactionId: tx.id,
          fileUrl:
            receiptImages[j % receiptImages.length] ??
            "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
          publicId: `proofs/${invoiceNumber}`,
          mimeType: "image/jpeg",
          fileSize: 125000,
          uploadedAt: paymentUploadedAt || new Date(),
        },
      });
    }

    // 7. Generate post-event reviews for attended transactions.
    if (status === TransactionStatus.DONE) {
      await prisma.review.upsert({
        where: { transactionId: tx.id },
        update: {},
        create: {
          transactionId: tx.id,
          eventId: event.id,
          customerId: customer.id,
          rating: j % 2 === 0 ? 5 : 4,
          comment: `Pengalaman yang menyenangkan di ${event.name}. Proses check-in lancar dan acaranya seru.`,
          createdAt: new Date(event.endsAt.getTime() + 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // 8. Generate point ledger entries for referral reward demos.
  console.log("Seeding referral point ledger entries...");
  for (let k = 0; k < extraCustomers.length; k++) {
    const cust = extraCustomers[k];
    if (!cust) continue;
    const desc = `Referral reward from ${cust.name}`;
    const existingLedger = await prisma.pointLedger.findFirst({
      where: { userId: customer1.id, description: desc },
    });
    if (!existingLedger && k < 6) {
      await prisma.pointLedger.create({
        data: {
          userId: customer1.id,
          amount: 10000,
          type: "CREDIT",
          description: desc,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("Seed completed: 39 Indonesian events, 40 transactions, and referral rewards.");
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
