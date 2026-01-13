import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding revenue tracking data...");

  // 1. Create a Contact
  const contact = await prisma.contact.create({
    data: {
      phone: "+15550000001",
      firstName: "Test",
      lastName: "Buyer",
      email: "buyer@example.com",
    },
  });
  console.log("Created Contact:", contact.id);

  // 2. Create a Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: "Black Friday Sale",
      content: "Hey, check out our sale! Click here: /l/bf2025",
      status: "sent",
      type: "sms",
      sentCount: 100,
      deliveredCount: 95,
      totalCount: 100,
    },
  });
  console.log("Created Campaign:", campaign.id);

  // 3. Create a Link
  const link = await prisma.link.create({
    data: {
      originalUrl: "https://myshop.com/products/awesome-thing",
      slug: "bf2025",
      campaignId: campaign.id,
    },
  });
  console.log("Created Link:", link.slug);

  // 4. Simulate a Click (7 days ago is the limit, let's do 1 hour ago)
  await prisma.click.create({
    data: {
      linkId: link.id,
      contactId: contact.id,
      ip: "127.0.0.1",
      userAgent: "Mozilla/5.0...",
    },
  });
  console.log("Simulated Click for Contact:", contact.id);

  // 5. Update campaign click count
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { clickedCount: { increment: 1 } },
  });

  console.log("✅ Seed complete. Ready to test Order Webhook.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
