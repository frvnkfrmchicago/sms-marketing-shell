"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

export function SendCampaignButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send campaign");
      }

      toast.success(`Campaign queued: ${data.queuedCount} messages`);
      
      if (data.warning) {
        toast.warning(data.warning);
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button onClick={handleSend} disabled={isSending}>
      <Send className="mr-2 h-4 w-4" />
      {isSending ? "Sending..." : "Send Campaign"}
    </Button>
  );
}
