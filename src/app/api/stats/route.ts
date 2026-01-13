import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats - Get dashboard stats
export async function GET() {
  const [
    totalContacts,
    activeContacts,
    optedOutContacts,
    totalCampaigns,
    sentCampaigns,
    totalMessagesSent,
    totalMessagesDelivered,
    totalMessagesFailed,
    recentCampaigns,
  ] = await Promise.all([
    db.contact.count(),
    db.contact.count({ where: { optedOut: false } }),
    db.contact.count({ where: { optedOut: true } }),
    db.campaign.count(),
    db.campaign.count({ where: { status: "sent" } }),
    db.smsLog.count({ where: { status: "sent" } }),
    db.smsLog.count({ where: { status: "delivered" } }),
    db.smsLog.count({ where: { status: "failed" } }),
    db.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
        totalCount: true,
        createdAt: true,
      },
    }),
  ]);

  // Calculate delivery rate
  const deliveryRate =
    totalMessagesSent > 0
      ? Math.round((totalMessagesDelivered / totalMessagesSent) * 100)
      : 0;

  return NextResponse.json({
    contacts: {
      total: totalContacts,
      active: activeContacts,
      optedOut: optedOutContacts,
    },
    campaigns: {
      total: totalCampaigns,
      sent: sentCampaigns,
    },
    messages: {
      sent: totalMessagesSent,
      delivered: totalMessagesDelivered,
      failed: totalMessagesFailed,
      deliveryRate,
    },
    recentCampaigns,
  });
}
