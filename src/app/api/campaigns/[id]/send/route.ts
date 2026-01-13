import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { queueCampaignMessages } from "@/lib/sms-queue";
import { isQuietHours } from "@/lib/telnyx";

// POST /api/campaigns/[id]/send - Queue campaign for sending
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const campaign = await db.campaign.findUnique({ where: { id } });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return NextResponse.json(
        { error: `Campaign is already ${campaign.status}` },
        { status: 400 }
      );
    }

    // Get contact count
    const contactCount = await db.contact.count({
      where: { optedOut: false },
    });

    if (contactCount === 0) {
      return NextResponse.json(
        { error: "No active contacts to send to" },
        { status: 400 }
      );
    }

    // Check quiet hours warning
    const quietHoursWarning = isQuietHours()
      ? "Note: It's currently quiet hours (9 PM - 8 AM). Messages will be delayed."
      : null;

    // Queue messages
    const queuedCount = await queueCampaignMessages(id);

    return NextResponse.json({
      success: true,
      queuedCount,
      message: `Queued ${queuedCount} messages for sending`,
      warning: quietHoursWarning,
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send campaign" },
      { status: 500 }
    );
  }
}
