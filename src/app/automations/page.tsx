"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Zap, Trash2, Play, Pause } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface AutomationStep {
  id: string;
  type: string;
  config: string;
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  triggerConfig: string | null;
  isActive: boolean;
  createdAt: string;
  steps: AutomationStep[];
  _count: { logs: number };
}

const TRIGGER_LABELS: Record<string, string> = {
  new_contact: "New Contact Added",
  keyword: "Keyword Received",
  scheduled: "Scheduled Time",
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await fetch("/api/automations");
      const data = await res.json();
      setAutomations(data);
    } catch (err) {
      console.error("Failed to fetch automations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutomation = async (id: string) => {
    try {
      const res = await fetch(`/api/automations/${id}/toggle`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isActive: data.isActive } : a))
        );
        toast.success(data.isActive ? "Automation activated" : "Automation paused");
      }
    } catch {
      toast.error("Failed to toggle automation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automation?")) return;

    try {
      const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Automation deleted");
        fetchAutomations();
      }
    } catch {
      toast.error("Failed to delete automation");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Automations
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Send automatic messages based on triggers
            </p>
          </div>
          <Button asChild>
            <Link href="/automations/new">
              <Plus className="mr-2 h-4 w-4" />
              New Automation
            </Link>
          </Button>
        </div>

        {/* Automations List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : automations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Zap className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No automations yet</h3>
              <p className="mt-2 text-gray-500">
                Create an automation to send messages automatically
              </p>
              <Button className="mt-4" asChild>
                <Link href="/automations/new">Create Your First Automation</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => (
              <Card key={automation.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          automation.isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {automation.isActive ? (
                          <Play className="h-5 w-5" />
                        ) : (
                          <Pause className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{automation.name}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {TRIGGER_LABELS[automation.trigger] || automation.trigger}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={automation.isActive}
                        onCheckedChange={() => toggleAutomation(automation.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => handleDelete(automation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{automation.steps.length} steps</span>
                    <span>{automation._count.logs} times triggered</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
