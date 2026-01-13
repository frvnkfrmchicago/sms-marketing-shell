"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Filter, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Segment {
  id: string;
  name: string;
  description: string | null;
  contactCount: number;
  createdAt: string;
  _count: { campaigns: number };
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const res = await fetch("/api/segments");
      const data = await res.json();
      setSegments(data);
    } catch (error) {
      console.error("Failed to fetch segments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this segment?")) return;

    try {
      const res = await fetch(`/api/segments/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Segment deleted");
        fetchSegments();
      }
    } catch (error) {
      toast.error("Failed to delete segment");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Segments
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Create groups of contacts to target with campaigns
            </p>
          </div>
          <Button asChild>
            <Link href="/segments/new">
              <Plus className="mr-2 h-4 w-4" />
              New Segment
            </Link>
          </Button>
        </div>

        {/* Segments List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : segments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Filter className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No segments yet</h3>
              <p className="mt-2 text-gray-500">
                Create a segment to target specific groups of contacts
              </p>
              <Button className="mt-4" asChild>
                <Link href="/segments/new">Create Your First Segment</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {segments.map((segment) => (
              <Card key={segment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{segment.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => handleDelete(segment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {segment.description && (
                    <p className="text-sm text-gray-500">{segment.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{segment.contactCount} contacts</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {segment._count.campaigns} campaigns
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/segments/${segment.id}`}>View</Link>
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/campaigns/new?segmentId=${segment.id}`}>
                        Send Campaign
                      </Link>
                    </Button>
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
