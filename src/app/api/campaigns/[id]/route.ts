import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/campaigns/[id] - Get campaign details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  // Calculate delivery stats
  const stats = {
    queued: await db.smsLog.count({ where: { campaignId: id, status: "queued" } }),
    sent: await db.smsLog.count({ where: { campaignId: id, status: "sent" } }),
    delivered: await db.smsLog.count({ where: { campaignId: id, status: "delivered" } }),
    failed: await db.smsLog.count({ where: { campaignId: id, status: "failed" } }),
    skipped: await db.smsLog.count({ where: { campaignId: id, status: "skipped" } }),
  };

  return NextResponse.json({
    ...campaign,
    stats,
  });
}

// PATCH /api/campaigns/[id] - Update campaign
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const campaign = await db.campaign.findUnique({ where: { id } });

  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  if (campaign.status !== "draft") {
    return NextResponse.json(
      { error: "Can only edit draft campaigns" },
      { status: 400 }
    );
  }

  const updated = await db.campaign.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const campaign = await db.campaign.findUnique({ where: { id } });

  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  if (campaign.status === "sending") {
    return NextResponse.json(
      { error: "Cannot delete a campaign that is currently sending" },
      { status: 400 }
    );
  }

  // Delete associated logs first
  await db.smsLog.deleteMany({ where: { campaignId: id } });
  await db.campaign.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
