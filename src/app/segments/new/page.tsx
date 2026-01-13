"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

const FILTER_FIELDS = [
  { value: "tags", label: "Tags" },
  { value: "source", label: "Source" },
  { value: "messageCount", label: "Message Count" },
  { value: "lastTextedAt", label: "Last Texted" },
  { value: "optedOut", label: "Opted Out" },
];

const OPERATORS: Record<string, { value: string; label: string }[]> = {
  tags: [
    { value: "contains", label: "contains" },
    { value: "equals", label: "equals" },
  ],
  source: [
    { value: "equals", label: "is" },
  ],
  messageCount: [
    { value: "greaterThan", label: "greater than" },
    { value: "lessThan", label: "less than" },
    { value: "equals", label: "equals" },
  ],
  lastTextedAt: [
    { value: "before", label: "before" },
    { value: "after", label: "after" },
  ],
  optedOut: [
    { value: "equals", label: "is" },
  ],
};

export default function NewSegmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addFilter = () => {
    setFilters([...filters, { field: "tags", operator: "contains", value: "" }]);
  };

  const updateFilter = (index: number, updates: Partial<FilterRule>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    
    // Reset operator when field changes
    if (updates.field) {
      newFilters[index].operator = OPERATORS[updates.field]?.[0]?.value || "equals";
      newFilters[index].value = "";
    }
    
    setFilters(newFilters);
    setPreviewCount(null);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
    setPreviewCount(null);
  };

  const previewSegment = async () => {
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "preview", filters }),
      });
      const data = await res.json();
      // This creates a segment and returns contactCount, but we'll delete it
      // For now, just show the count
      setPreviewCount(data.contactCount);
      // Delete the preview segment
      await fetch(`/api/segments/${data.id}`, { method: "DELETE" });
    } catch {
      toast.error("Failed to preview segment");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a segment name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, filters }),
      });

      if (!res.ok) throw new Error("Failed to create segment");

      toast.success("Segment created!");
      router.push("/segments");
    } catch {
      toast.error("Failed to create segment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/segments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              New Segment
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Create a group of contacts to target
            </p>
          </div>
        </div>

        {/* Segment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Segment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Segment Name</Label>
              <Input
                id="name"
                placeholder="e.g., VIP Customers"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe this segment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filter Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Rules</CardTitle>
            <CardDescription>
              Define which contacts belong to this segment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filters.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No filters added. All non-opted-out contacts will be included.
              </p>
            ) : (
              filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={filter.field}
                    onValueChange={(v) => updateFilter(index, { field: v })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(v) => updateFilter(index, { operator: v })}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS[filter.field]?.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {filter.field === "optedOut" ? (
                    <Select
                      value={filter.value}
                      onValueChange={(v) => updateFilter(index, { value: v })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : filter.field === "source" ? (
                    <Select
                      value={filter.value}
                      onValueChange={(v) => updateFilter(index, { value: v })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="csv">CSV Import</SelectItem>
                        <SelectItem value="keyword">Keyword</SelectItem>
                        <SelectItem value="popup">Popup</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : filter.field === "lastTextedAt" ? (
                    <Input
                      type="date"
                      className="flex-1"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                    />
                  ) : (
                    <Input
                      className="flex-1"
                      placeholder="Value..."
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilter(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}

            <Button variant="outline" onClick={addFilter} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Filter
            </Button>

            {filters.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="secondary" onClick={previewSegment}>
                  <Users className="mr-2 h-4 w-4" />
                  Preview Count
                </Button>
                {previewCount !== null && (
                  <span className="text-sm font-medium">
                    {previewCount} contacts match
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/segments">Cancel</Link>
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            Create Segment
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
