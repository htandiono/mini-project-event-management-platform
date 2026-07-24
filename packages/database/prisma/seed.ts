import { EventStatus, PrismaClient, UserRole, TransactionStatus } from "@prisma/client";
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
  console.log("🌱 Starting rich database seed (30+ products, transactions, and logs)...");

  const customerPassword = await hash(required("DEMO_CUSTOMER_PASSWORD"), 12);
  const organizerPassword = await hash(required("DEMO_ORGANIZER_PASSWORD"), 12);
  const generalPassword = await hash("Password123!", 12);

  // 1. Create Organizers
  const organizer1 = await prisma.user.upsert({
    where: { email: required("DEMO_ORGANIZER_EMAIL") },
    update: { name: "Eventure Live" },
    create: {
      email: required("DEMO_ORGANIZER_EMAIL"),
      passwordHash: organizerPassword,
      name: "Eventure Live",
      role: UserRole.ORGANIZER,
      referralCode: "EV-LIVE2026",
    },
  });

  const organizer2 = await prisma.user.upsert({
    where: { email: "oscar@example.com" },
    update: { name: "Purwadhika Live" },
    create: {
      email: "oscar@example.com",
      passwordHash: generalPassword,
      name: "Purwadhika Live",
      role: UserRole.ORGANIZER,
      referralCode: "EV-PURWA2026",
    },
  });

  const organizer3 = await prisma.user.upsert({
    where: { email: "sound@example.com" },
    update: { name: "Soundrenaline Live" },
    create: {
      email: "sound@example.com",
      passwordHash: generalPassword,
      name: "Soundrenaline Live",
      role: UserRole.ORGANIZER,
      referralCode: "EV-SOUND2026",
    },
  });

  const organizers = [organizer1, organizer2, organizer3];

  // 2. Create Customers (10 customers for rich transaction volume)
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
    where: { email: "alice@example.com" },
    update: { name: "Alice Wonderland" },
    create: {
      email: "alice@example.com",
      passwordHash: generalPassword,
      name: "Alice Wonderland",
      role: UserRole.CUSTOMER,
      referralCode: "EV-ALICE2026",
      referredById: organizer1.id,
    },
  });

  const extraCustomers = [];
  const customerNames = [
    "Cindy Crawford", "David Beckham", "Elena Rostova", "Fajar Nugraha",
    "Gita Gutawa", "Hendra Setiawan", "Indah Permatasari", "Joko Anwar"
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

  // 3. Create Categories
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

  // 4. Create Coupons & Vouchers
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

  // 5. Generate 36 Events ("Products") across different months of 2026
  console.log("📦 Seeding 36 Events (Products)...");
  const eventTemplates = [
    { title: "Jakarta Tech Summit", city: "Jakarta", venue: "Kuningan City Hall", cat: "technology", basePrice: 200000 },
    { title: "Soundrenaline Music Festival", city: "Bali", venue: "Garuda Wisnu Kencana", cat: "music", basePrice: 500000 },
    { title: "Nusantara Culinary Expo", city: "Bandung", venue: "Trans Studio Convention", cat: "food-and-drink", basePrice: 50000 },
    { title: "Indonesia Marathon", city: "Jakarta", venue: "Gelora Bung Karno", cat: "sports", basePrice: 250000 },
    { title: "AI & Future Product Conference", city: "Surabaya", venue: "Grand City Hall", cat: "technology", basePrice: 300000 },
    { title: "Jazz Traffic Festival", city: "Surabaya", venue: "Grand City Arena", cat: "music", basePrice: 350000 },
    { title: "Coffee & Barista Championship", city: "Yogyakarta", venue: "Jogja Expo Center", cat: "food-and-drink", basePrice: 75000 },
    { title: "Badminton Open 2026", city: "Jakarta", venue: "Istora Senayan", cat: "sports", basePrice: 150000 },
    { title: "Startup Pitch & Networking", city: "Jakarta", venue: "SCBD District 8", cat: "business", basePrice: 100000 },
    { title: "Modern Contemporary Art Gala", city: "Bandung", venue: "NuArt Sculpture Park", cat: "art-and-theater", basePrice: 120000 },
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
        province: tmpl.city === "Jakarta" ? "DKI Jakarta" : tmpl.city === "Bali" ? "Bali" : "Jawa Barat",
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

  // 6. Generate 40 Transactions & 40+ Attendee Items ("Transactions")
  console.log("💳 Seeding 40 Transactions & Order Verifications...");
  
  const receiptImages = [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80",
    "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&q=80",
    "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=600&q=80",
  ];

  for (let j = 1; j <= 40; j++) {
    const invoiceNumber = `INV-2026-${String(j).padStart(3, "0")}`;
    const customer = allCustomers[j % allCustomers.length]!;
    const event = createdEvents[j % createdEvents.length]!;
    const ticketType = event.ticketTypes[j % event.ticketTypes.length]!;
    
    if (!ticketType || !customer || !event) continue;

    const qty = (j % 4) + 1; // 1 to 4 tickets per transaction
    const subtotal = ticketType.price * qty;
    const total = subtotal;

    // Determine realistic transaction status
    // 1-15: DONE (Accepted & Paid) -> Rich gross revenue & attendee data
    // 16-30: WAITING_FOR_CONFIRMATION -> Pending proof review for Organizer
    // 31-35: REJECTED -> Historical rejected orders
    // 36-40: WAITING_FOR_PAYMENT -> New orders awaiting upload
    let status: TransactionStatus = TransactionStatus.WAITING_FOR_PAYMENT;
    let paymentUploadedAt: Date | null = null;
    let completedAt: Date | null = null;
    let organizerDeadline: Date | null = null;
    let isAttended = false;

    const createdAt = new Date(Date.UTC(2026, (j - 1) % 12, (j % 20) + 1, 14, 30, 0));
    const paymentDeadline = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);

    if (j <= 15) {
      status = TransactionStatus.DONE;
      paymentUploadedAt = new Date(createdAt.getTime() + 30 * 60 * 1000);
      completedAt = new Date(paymentUploadedAt.getTime() + 60 * 60 * 1000);
      organizerDeadline = new Date(paymentUploadedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      isAttended = true;
    } else if (j <= 30) {
      status = TransactionStatus.WAITING_FOR_CONFIRMATION;
      paymentUploadedAt = new Date(createdAt.getTime() + 45 * 60 * 1000);
      organizerDeadline = new Date(paymentUploadedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    } else if (j <= 35) {
      status = TransactionStatus.REJECTED;
      paymentUploadedAt = new Date(createdAt.getTime() + 20 * 60 * 1000);
      organizerDeadline = new Date(paymentUploadedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    }

    const tx = await prisma.transaction.upsert({
      where: { invoiceNumber },
      update: {
        status,
        paymentUploadedAt,
        completedAt,
        organizerDeadline,
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

    // Attach PaymentProof if status is WAITING_FOR_CONFIRMATION or DONE or REJECTED
    if (status !== TransactionStatus.WAITING_FOR_PAYMENT) {
      await prisma.paymentProof.upsert({
        where: { transactionId: tx.id },
        update: {},
        create: {
          transactionId: tx.id,
          fileUrl: receiptImages[j % receiptImages.length] || "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
          publicId: `proofs/${invoiceNumber}`,
          mimeType: "image/jpeg",
          fileSize: 125000,
          uploadedAt: paymentUploadedAt || new Date(),
        },
      });
    }

    // 7. Generate Event Reviews ("Logs") for DONE transactions
    if (status === TransactionStatus.DONE) {
      await prisma.review.upsert({
        where: { transactionId: tx.id },
        update: {},
        create: {
          transactionId: tx.id,
          eventId: event.id,
          customerId: customer.id,
          rating: (j % 2 === 0) ? 5 : 4,
          comment: `Great experience at ${event.name}! Smooth check-in and fantastic atmosphere.`,
          createdAt: completedAt || new Date(),
        },
      });
    }
  }

  // 8. Generate Point Ledger entries ("Logs") for referral rewards
  console.log("📜 Seeding Point Ledger Entries & Referral Logs...");
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

  console.log("✅ Seed completed successfully! Over 36 products, 40 transactions, and 30 logs generated.");
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
