import { MainLayout } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Image as ImageIcon,
  MessageSquare,
  DollarSign,
  MousePointerClick,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SendCampaignButton } from "./send-button";
import { DeleteCampaignButton } from "./delete-button";

type MessageLog = {
  id: string;
  phone: string;
  status: string;
  sentAt: Date | null;
  error: string | null;
  contact: {
    firstName: string | null;
    lastName: string | null;
  } | null;
};

async function getCampaign(id: string) {
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

  if (!campaign) return null;

  const stats = {
    queued: await db.smsLog.count({ where: { campaignId: id, status: "queued" } }),
    sent: await db.smsLog.count({ where: { campaignId: id, status: "sent" } }),
    delivered: await db.smsLog.count({ where: { campaignId: id, status: "delivered" } }),
    failed: await db.smsLog.count({ where: { campaignId: id, status: "failed" } }),
    skipped: await db.smsLog.count({ where: { campaignId: id, status: "skipped" } }),
  };

  return { campaign, stats };
}

function getStatusColor(status: string) {
  switch (status) {
    case "queued":
      return "secondary";
    case "sent":
      return "default";
    case "delivered":
      return "default";
    case "failed":
      return "destructive";
    case "skipped":
      return "outline";
    default:
      return "outline";
  }
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCampaign(id);

  if (!data) {
    notFound();
  }

  const { campaign, stats } = data;
  const totalProcessed = stats.sent + stats.delivered + stats.failed + stats.skipped;
  const progressPercent =
    campaign.totalCount > 0 ? (totalProcessed / campaign.totalCount) * 100 : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/campaigns">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Created {new Date(campaign.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                campaign.status === "sent"
                  ? "default"
                  : campaign.status === "sending"
                  ? "secondary"
                  : campaign.status === "failed"
                  ? "destructive"
                  : "outline"
              }
              className="text-sm"
            >
              {campaign.status}
            </Badge>
            {(campaign.status === "draft" || campaign.status === "scheduled") && (
              <SendCampaignButton campaignId={campaign.id} />
            )}
            <DeleteCampaignButton campaignId={campaign.id} />
          </div>
        </div>

        {/* Progress */}
        {campaign.status === "sending" && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sending progress</span>
                  <span>
                    {totalProcessed}/{campaign.totalCount} messages
                  </span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.queued}</p>
                  <p className="text-sm text-gray-500">Queued</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.sent}</p>
                  <p className="text-sm text-gray-500">Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                  <p className="text-sm text-gray-500">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                  <p className="text-sm text-gray-500">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.skipped}</p>
                  <p className="text-sm text-gray-500">Skipped</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MousePointerClick className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{campaign.clickedCount}</p>
                  <p className="text-sm text-gray-500">Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">
                    ${campaign.revenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {campaign.mediaUrl ? (
                <ImageIcon className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              Message Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {campaign.mediaUrl && (
                <img
                  src={campaign.mediaUrl}
                  alt="Campaign media"
                  className="h-32 w-auto rounded-lg border object-cover"
                />
              )}
              <div className="flex-1">
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {campaign.content}
                </p>
                {!campaign.content.toLowerCase().includes("stop") && (
                  <p className="mt-2 text-sm text-gray-500">
                    + &quot;Reply STOP to unsubscribe.&quot;
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Log */}
        <Card>
          <CardHeader>
            <CardTitle>Message Log</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.messages.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No messages sent yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-gray-500 dark:border-gray-800">
                      <th className="pb-3 pr-4">Recipient</th>
                      <th className="pb-3 pr-4">Phone</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Sent At</th>
                      <th className="pb-3">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800">
                    {campaign.messages.map((log: MessageLog) => (
                      <tr key={log.id}>
                        <td className="py-3 pr-4">
                          {log.contact
                            ? `${log.contact.firstName || ""} ${log.contact.lastName || ""}`.trim() ||
                              "Unknown"
                            : "Unknown"}
                        </td>
                        <td className="py-3 pr-4 font-mono text-sm">
                          {log.phone}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={getStatusColor(log.status) as "default" | "secondary" | "destructive" | "outline"}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500">
                          {log.sentAt
                            ? new Date(log.sentAt).toLocaleString()
                            : "—"}
                        </td>
                        <td className="py-3 text-sm text-red-500">
                          {log.error || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
