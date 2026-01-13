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
import { ArrowLeft, Plus, X, MessageSquare, Clock, GitBranch } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface AutomationStep {
  type: string;
  config: {
    message?: string;
    delayMinutes?: number;
    delayUnit?: string;
  };
}

const TRIGGER_OPTIONS = [
  { value: "new_contact", label: "New Contact Added", description: "When a contact is added via CSV or manually" },
  { value: "keyword", label: "Keyword Received", description: "When someone texts a specific keyword" },
  { value: "scheduled", label: "Scheduled Time", description: "Run at a specific time daily/weekly" },
];

const STEP_TYPES = [
  { value: "send_sms", label: "Send SMS", icon: MessageSquare },
  { value: "wait", label: "Wait", icon: Clock },
];

export default function NewAutomationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("new_contact");
  const [triggerKeyword, setTriggerKeyword] = useState("");
  const [steps, setSteps] = useState<AutomationStep[]>([
    { type: "send_sms", config: { message: "" } },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addStep = (type: string) => {
    if (type === "send_sms") {
      setSteps([...steps, { type: "send_sms", config: { message: "" } }]);
    } else if (type === "wait") {
      setSteps([...steps, { type: "wait", config: { delayMinutes: 60, delayUnit: "minutes" } }]);
    }
  };

  const updateStep = (index: number, config: AutomationStep["config"]) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], config: { ...newSteps[index].config, ...config } };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) {
      toast.error("Automation must have at least one step");
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter an automation name");
      return;
    }

    if (trigger === "keyword" && !triggerKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    // Validate steps
    for (const step of steps) {
      if (step.type === "send_sms" && !step.config.message?.trim()) {
        toast.error("All SMS steps must have a message");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          trigger,
          triggerConfig: trigger === "keyword" ? { keyword: triggerKeyword } : null,
          steps,
        }),
      });

      if (!res.ok) throw new Error("Failed to create automation");

      toast.success("Automation created!");
      router.push("/automations");
    } catch {
      toast.error("Failed to create automation");
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
            <Link href="/automations">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              New Automation
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Create an automated message flow
            </p>
          </div>
        </div>

        {/* Automation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Automation Name</Label>
              <Input
                id="name"
                placeholder="e.g., Welcome Series"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trigger Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger</CardTitle>
            <CardDescription>When should this automation start?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {TRIGGER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTrigger(option.value)}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    trigger === option.value
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border-2 ${
                      trigger === option.value
                        ? "border-violet-500 bg-violet-500"
                        : "border-gray-300"
                    }`}
                  >
                    {trigger === option.value && (
                      <div className="h-full w-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {trigger === "keyword" && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="keyword">Keyword</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., JOIN"
                  value={triggerKeyword}
                  onChange={(e) => setTriggerKeyword(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-gray-500">
                  When someone texts this keyword to your number, the automation will start
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
            <CardDescription>Define what happens in this automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="relative rounded-lg border p-4">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs font-medium text-white">
                  {index + 1}
                </div>
                <div className="flex items-start justify-between ml-2">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      {step.type === "send_sms" ? (
                        <MessageSquare className="h-4 w-4 text-violet-500" />
                      ) : step.type === "wait" ? (
                        <Clock className="h-4 w-4 text-orange-500" />
                      ) : (
                        <GitBranch className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="font-medium">
                        {step.type === "send_sms" ? "Send SMS" : step.type === "wait" ? "Wait" : "Condition"}
                      </span>
                    </div>

                    {step.type === "send_sms" && (
                      <Textarea
                        placeholder="Type your message..."
                        value={step.config.message || ""}
                        onChange={(e) => updateStep(index, { message: e.target.value })}
                        rows={3}
                      />
                    )}

                    {step.type === "wait" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-20"
                          value={step.config.delayMinutes || 60}
                          onChange={(e) => updateStep(index, { delayMinutes: parseInt(e.target.value) })}
                        />
                        <Select
                          value={step.config.delayUnit || "minutes"}
                          onValueChange={(v) => updateStep(index, { delayUnit: v })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutes">Minutes</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => removeStep(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              {STEP_TYPES.map((stepType) => (
                <Button
                  key={stepType.value}
                  variant="outline"
                  size="sm"
                  onClick={() => addStep(stepType.value)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {stepType.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/automations">Cancel</Link>
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            Create Automation
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
