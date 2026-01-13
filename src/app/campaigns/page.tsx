import { MainLayout } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { MessageSquare, Plus, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

type Campaign = {
  id: string;
  name: string;
  content: string;
  mediaUrl: string | null;
  status: string;
  totalCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: Date;
};

async function getCampaigns() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = {
    total: await db.campaign.count(),
    draft: await db.campaign.count({ where: { status: "draft" } }),
    sending: await db.campaign.count({ where: { status: "sending" } }),
    sent: await db.campaign.count({ where: { status: "sent" } }),
  };

  return { campaigns, stats };
}

function getStatusColor(status: string) {
  switch (status) {
    case "draft":
      return "outline";
    case "scheduled":
      return "secondary";
    case "sending":
      return "default";
    case "sent":
      return "default";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function CampaignsPage() {
  const { campaigns, stats } = await getCampaigns();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Campaigns
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {stats.total} campaigns • {stats.sent} sent
            </p>
          </div>
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.draft}</p>
              <p className="text-sm text-gray-500">Drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">{stats.sending}</p>
              <p className="text-sm text-gray-500">Sending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No campaigns yet
                </h3>
                <p className="mt-2 text-gray-500">
                  Create your first campaign to start sending messages.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/campaigns/new">Create Campaign</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign: Campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        {campaign.mediaUrl ? (
                          <ImageIcon className="h-6 w-6 text-primary" />
                        ) : (
                          <MessageSquare className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {campaign.name}
                        </p>
                        <p className="line-clamp-1 max-w-md text-sm text-muted-foreground">
                          {campaign.content?.substring(0, 100) || "No content"}
                          {(campaign.content?.length || 0) > 100 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {campaign.deliveredCount}/{campaign.totalCount}
                        </p>
                        <p className="text-xs text-gray-500">delivered</p>
                      </div>
                      <Badge variant={getStatusColor(campaign.status) as "default" | "secondary" | "destructive" | "outline"}>
                        {campaign.status}
                      </Badge>
                      <p className="w-24 text-right text-sm text-gray-500">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
