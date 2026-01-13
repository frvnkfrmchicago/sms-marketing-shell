import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/webhooks/telnyx - Handle Telnyx webhooks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: "No data in webhook" }, { status: 400 });
    }

    const eventType = data.event_type;
    const payload = data.payload;

    console.log("Telnyx webhook received:", eventType);

    switch (eventType) {
      // Outbound message status updates
      case "message.sent":
        await handleMessageSent(payload);
        break;

      case "message.finalized":
        await handleMessageFinalized(payload);
        break;

      // Inbound messages (for STOP/opt-out handling)
      case "message.received":
        await handleInboundMessage(payload);
        break;

      default:
        console.log("Unhandled webhook event:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleMessageSent(payload: { id: string }) {
  const messageId = payload.id;

  await db.smsLog.updateMany({
    where: { providerMsgId: messageId },
    data: {
      status: "sent",
      sentAt: new Date(),
    },
  });
}

async function handleMessageFinalized(payload: {
  id: string;
  to: { phone_number: string }[];
  finalized_status: string;
  errors?: { title: string }[];
}) {
  const messageId = payload.id;
  const status = payload.finalized_status;

  // Map Telnyx status to our status
  let mappedStatus = "sent";
  if (status === "delivered") {
    mappedStatus = "delivered";
  } else if (status === "sending_failed" || status === "delivery_failed") {
    mappedStatus = "failed";
  } else if (status === "delivery_unconfirmed") {
    mappedStatus = "undelivered";
  }

  const updateData: {
    status: string;
    deliveredAt?: Date;
    error?: string;
  } = { status: mappedStatus };

  if (mappedStatus === "delivered") {
    updateData.deliveredAt = new Date();
  }

  if (payload.errors && payload.errors.length > 0) {
    updateData.error = payload.errors.map((e) => e.title).join(", ");
  }

  await db.smsLog.updateMany({
    where: { providerMsgId: messageId },
    data: updateData,
  });

  // Update campaign delivered count
  if (mappedStatus === "delivered") {
    const log = await db.smsLog.findFirst({
      where: { providerMsgId: messageId },
    });
    if (log) {
      await db.campaign.update({
        where: { id: log.campaignId },
        data: { deliveredCount: { increment: 1 } },
      });
    }
  }
}

async function handleInboundMessage(payload: {
  from: { phone_number: string };
  text: string;
}) {
  const fromPhone = payload.from.phone_number;
  const messageText = payload.text?.toLowerCase().trim() || "";

  // Check for opt-out keywords
  const optOutKeywords = ["stop", "unsubscribe", "cancel", "quit", "end"];
  const isOptOut = optOutKeywords.some((keyword) => messageText === keyword);

  if (isOptOut) {
    console.log(`Opt-out request from ${fromPhone}`);

    // Mark contact as opted out
    await db.contact.updateMany({
      where: { phone: fromPhone },
      data: {
        optedOut: true,
        optedOutAt: new Date(),
      },
    });

    // Note: Telnyx auto-responds with confirmation when auto opt-out is enabled
    // in Messaging Profile settings
  }

  // Check for help request
  if (messageText === "help" || messageText === "info") {
    console.log(`Help request from ${fromPhone}`);
    // You could send an auto-response here with sendSMS
  }
}

// Telnyx sends GET requests for webhook validation
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
