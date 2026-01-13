import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subDays } from "date-fns";

// Mock Order Payload
// {
//   "order_id": "1001",
//   "email": "customer@example.com",
//   "phone": "+15551234567",
//   "total": 99.99,
//   "currency": "USD"
// }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, email, phone, total, currency = "USD" } = body;

    if (!order_id || !total || (!email && !phone)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 1. Find the contact
    const contact = await db.contact.findFirst({
      where: {
        OR: [
          phone ? { phone } : {}, // Check phone if provided
          email ? { email } : {}  // Check email if provided
        ].filter(obj => Object.keys(obj).length > 0)
      }
    });

    if (!contact) {
      // Option: Create contact if not exists, but for attribution we typically need a pre-existing contact
      // For now, we'll log it but not attribute if we don't know them
      console.log(`Order ${order_id} received but contact not found for ${email || phone}`);
      return NextResponse.json({ status: "contact_not_found" });
    }

    // 2. Check for attribution (Last Click Wins, 7-day window)
    const sevenDaysAgo = subDays(new Date(), 7);
    
    // Find the most recent click from this contact
    const lastClick = await db.click.findFirst({
      where: {
        contactId: contact.id,
        createdAt: { gte: sevenDaysAgo }
      },
      include: {
        link: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    let attributionType = null;
    let attributedId = null;

    if (lastClick && lastClick.link.campaignId) {
      attributionType = "campaign";
      attributedId = lastClick.link.campaignId;

      // Update Campaign Revenue Stats
      await db.campaign.update({
        where: { id: lastClick.link.campaignId },
        data: {
          revenue: { increment: parseFloat(total) }
        }
      });
    }

    // 3. Create the Order
    const order = await db.order.create({
      data: {
        externalId: String(order_id),
        totalAmount: parseFloat(total),
        currency,
        contactId: contact.id,
        attributionType,
        attributedId,
      }
    });

    return NextResponse.json({ 
      status: "success", 
      orderId: order.id,
      attributedTo: attributionType ? `${attributionType}:${attributedId}` : "none"
    });

  } catch (error) {
    console.error("Order webhook error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
