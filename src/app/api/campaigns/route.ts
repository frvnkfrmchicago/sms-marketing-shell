import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/campaigns - List all campaigns
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where = status ? { status } : {};

  const campaigns = await db.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Get stats
  const total = await db.campaign.count();
  const stats = {
    draft: await db.campaign.count({ where: { status: "draft" } }),
    scheduled: await db.campaign.count({ where: { status: "scheduled" } }),
    sending: await db.campaign.count({ where: { status: "sending" } }),
    sent: await db.campaign.count({ where: { status: "sent" } }),
  };

  return NextResponse.json({
    data: campaigns,
    total,
    stats,
  });
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, message, mediaUrl, scheduledAt } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: "Name and message are required" },
        { status: 400 }
      );
    }

    if (message.length > 1600) {
      return NextResponse.json(
        { error: "Message exceeds maximum length of 1600 characters" },
        { status: 400 }
      );
    }

    const campaign = await db.campaign.create({
      data: {
        name,
        content: message,
        mediaUrl,
        type: mediaUrl ? "mms" : "sms",
        status: scheduledAt ? "scheduled" : "draft",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
