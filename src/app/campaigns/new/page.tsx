"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Image as ImageIcon,
  Send,
  X,
  Smartphone,
  AlertCircle,
  Calendar,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

export default function NewCampaignPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [segmentId, setSegmentId] = useState<string>("all");
  const [segments, setSegments] = useState<{ id: string; name: string; contactCount: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/segments")
      .then((res) => res.json())
      .then((data) => setSegments(data))
      .catch(console.error);
  }, []);

  // Character count logic
  const maxChars = mediaUrl ? 1600 : 160;
  const charCount = message.length;
  const messageCount = mediaUrl ? 1 : Math.ceil(charCount / 160) || 1;
  const isOverLimit = charCount > maxChars;


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result as string);
      // In production, you'd upload to S3/Cloudinary and get URL
      // For MVP, we'll use a placeholder
      setMediaUrl("https://via.placeholder.com/400x300");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setMediaUrl("");
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (action: "save" | "send") => {
    if (!name.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (isOverLimit) {
      toast.error("Message is too long");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create campaign
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          message,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaUrl ? "image/jpeg" : undefined,
          scheduledAt: scheduledAt || undefined,
          segmentId: segmentId === "all" ? undefined : segmentId || undefined,
        }),
      });

      const campaign = await createRes.json();

      if (!createRes.ok) {
        throw new Error(campaign.error || "Failed to create campaign");
      }

      if (action === "send") {
        // Send campaign
        const sendRes = await fetch(`/api/campaigns/${campaign.id}/send`, {
          method: "POST",
        });

        const sendResult = await sendRes.json();

        if (!sendRes.ok) {
          throw new Error(sendResult.error || "Failed to send campaign");
        }

        toast.success(`Campaign queued: ${sendResult.queuedCount} messages`);
        if (sendResult.warning) {
          toast.warning(sendResult.warning);
        }
      } else {
        toast.success("Campaign saved as draft");
      }

      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              New Campaign
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Create an SMS or MMS campaign
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Composer */}
          <div className="space-y-6">
            {/* Campaign Name */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Holiday Sale Announcement"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <Select value={segmentId} onValueChange={setSegmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Contacts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Contacts</SelectItem>
                        {segments.map((seg) => (
                          <SelectItem key={seg.id} value={seg.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {seg.name} ({seg.contactCount})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message */}
            <Card>
              <CardHeader>
                <CardTitle>Message</CardTitle>
                <CardDescription>
                  {mediaUrl ? "MMS" : "SMS"} • {charCount}/{maxChars} characters
                  {!mediaUrl && messageCount > 1 && ` (${messageCount} segments)`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className={isOverLimit ? "border-red-500" : ""}
                />

                {isOverLimit && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    Message exceeds {maxChars} character limit
                  </div>
                )}

                <Separator />

                {/* Image Upload */}
                <div>
                  <Label className="mb-2 block">Image (Optional - converts to MMS)</Label>
                  
                  {mediaPreview ? (
                    <div className="relative w-fit">
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="h-32 w-auto rounded-lg border object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500 transition-colors hover:border-violet-400 hover:text-violet-500"
                    >
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8" />
                        <p className="mt-1 text-sm">Add Image</p>
                        <p className="text-xs text-gray-400">Max 5MB (GIFs supported)</p>
                      </div>
                    </button>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <Separator />

                {/* Scheduling */}
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Schedule for later (Optional)</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-500">
                    Leave blank to send immediately. All times are local.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSubmit("save")}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleSubmit(scheduledAt ? "save" : "send")}
                disabled={isSubmitting}
              >
                {scheduledAt ? (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Campaign
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mx-auto w-72">
                  {/* Phone Frame */}
                  <div className="rounded-[2.5rem] border-8 border-gray-800 bg-gray-800 p-1">
                    <div className="rounded-[2rem] bg-gray-100 p-4 dark:bg-gray-900">
                      {/* Status Bar */}
                      <div className="mb-4 flex justify-between text-xs text-gray-500">
                        <span>9:41</span>
                        <span>SMS</span>
                      </div>

                      {/* Message Bubble */}
                      <div className="space-y-2">
                        {mediaPreview && (
                          <img
                            src={mediaPreview}
                            alt="MMS Preview"
                            className="rounded-lg"
                          />
                        )}
                        <div className="rounded-2xl rounded-tl-sm bg-gray-200 px-4 py-3 dark:bg-gray-700">
                          <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                            {message || "Your message will appear here..."}
                          </p>
                          {message && !message.toLowerCase().includes("stop") && (
                            <p className="mt-2 text-sm text-gray-500">
                              Reply STOP to unsubscribe.
                            </p>
                          )}
                        </div>
                        <p className="text-right text-xs text-gray-400">
                          {new Date().toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Info */}
                <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium">{mediaUrl ? "MMS" : "SMS"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Segments</p>
                      <p className="font-medium">{messageCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Characters</p>
                      <p className="font-medium">{charCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Est. Cost</p>
                      <p className="font-medium">
                        ~${((mediaUrl ? 0.02 : 0.004) * messageCount).toFixed(3)}/msg
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
