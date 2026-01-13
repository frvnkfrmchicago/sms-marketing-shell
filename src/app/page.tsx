import { MainLayout } from "@/components/layout/sidebar";
import { AnimatedStatCard } from "@/components/ui/animated-cards";
import { ActionBar } from "@/components/dashboard/action-bar";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

// Helper to get last 7 days keys
const getLast7Days = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

async function getStats() {
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
    revenueAgg,
    // Fetch logs for analytics (last 7 days - simplified for MVP)
    recentLogs,
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
    }),
    db.campaign.aggregate({
      _sum: {
        revenue: true,
        clickedCount: true,
      },
    }),
    db.smsLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    }),
  ]);

  // Process Daily Volume
  const last7Days = getLast7Days();
  const dailyVolume = last7Days.map((date) => {
    const logsForDate = recentLogs.filter(
      (log) => log.createdAt.toISOString().split("T")[0] === date
    );
    return {
      date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      sent: logsForDate.filter((l) => l.status === "sent" || l.status === "delivered").length,
      failed: logsForDate.filter((l) => l.status === "failed").length,
    };
  });

  // Process Delivery Stats for Pie Chart
  const deliveryStats = [
    { name: "Delivered", value: totalMessagesDelivered, color: "#22c55e" }, // Green
    { name: "Failed", value: totalMessagesFailed, color: "#ef4444" }, // Red
    { name: "Sent", value: totalMessagesSent - totalMessagesDelivered - totalMessagesFailed, color: "#eab308" }, // Yellow
  ].filter(stat => stat.value > 0);

  return {
    contacts: { total: totalContacts, active: activeContacts, optedOut: optedOutContacts },
    campaigns: { total: totalCampaigns, sent: sentCampaigns },
    messages: { sent: totalMessagesSent, delivered: totalMessagesDelivered, failed: totalMessagesFailed },
    revenue: { total: revenueAgg._sum.revenue || 0, clicks: revenueAgg._sum.clickedCount || 0 },
    recentCampaigns,
    dailyVolume,
    deliveryStats,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();
  const unsubscribeRate = stats.contacts.total > 0 
    ? ((stats.contacts.optedOut / stats.contacts.total) * 100).toFixed(1) 
    : "0.0";

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Overview of your platform performance
          </p>
        </div>

        {/* Action Bar (Replaced weak Quick Actions) */}
        <section>
          <ActionBar />
        </section>

        {/* Stats Cards Row 1 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatedStatCard
            title="Total Revenue"
            value={`$${stats.revenue.total.toFixed(2)}`}
            subtitle="Lifetime Value"
            iconName="DollarSign"
            index={0}
            iconColor="text-amber-500"
          />
          <AnimatedStatCard
            title="Total Clicks"
            value={stats.revenue.clicks}
            subtitle="Link Interactions"
            iconName="MousePointerClick"
            index={1}
            iconColor="text-cyan-500"
          />
          <AnimatedStatCard
            title="Unsubscribe Rate"
            value={`${unsubscribeRate}%`}
            subtitle={`${stats.contacts.optedOut} contacts opted out`}
            iconName="Users"
            index={2}
            iconColor="text-rose-500"
          />
          <AnimatedStatCard
            title="Messages Delivered"
            value={stats.messages.delivered}
            subtitle={`${stats.messages.failed} failed`}
            iconName="CheckCircle"
            index={3}
            iconColor="text-emerald-500"
          />
        </div>

        {/* Analytics Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Analytics & Performance</h2>
            <div className="text-sm text-muted-foreground">Last 7 Days</div>
          </div>
          <AnalyticsCharts 
            dailyVolume={stats.dailyVolume} 
            deliveryStats={stats.deliveryStats} 
          />
        </section>

        {/* Recent Campaigns (Wide Layout) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Recent Campaigns</h2>
            <Link 
              href="/campaigns" 
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {stats.recentCampaigns.length === 0 ? (
                <div className="py-12 text-center bg-gray-50/50 dark:bg-zinc-900/50">
                  <div className="bg-white dark:bg-zinc-800 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4 shadow-sm">
                    <MessageSquare className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    No campaigns yet
                  </h3>
                  <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                    Create your first campaign to start sending messages and gathering analytics.
                  </p>
                  <Button className="mt-6" asChild>
                    <Link href="/campaigns/new">Launch Campaign</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stats.recentCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {campaign.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(campaign.createdAt).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {campaign.sentCount} / {campaign.totalCount}
                          </p>
                          <p className="text-xs text-gray-500">delivered</p>
                        </div>
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
                          className="capitalize min-w-[80px] justify-center"
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
