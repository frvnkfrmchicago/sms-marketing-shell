import { MainLayout } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  // Check if env vars are configured
  const telnyxConfigured = process.env.TELNYX_API_KEY?.startsWith("KEY");
  const databaseConfigured = process.env.DATABASE_URL?.includes("supabase");
  const redisConfigured = process.env.REDIS_URL?.includes("upstash");

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure your SMS marketing platform
          </p>
        </div>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>
              Check the status of your connected services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {telnyxConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">Telnyx SMS/MMS</p>
                  <p className="text-sm text-gray-500">SMS and MMS sending</p>
                </div>
              </div>
              <Badge variant={telnyxConfigured ? "default" : "outline"}>
                {telnyxConfigured ? "Connected" : "Not Configured"}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {databaseConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">Database (Supabase)</p>
                  <p className="text-sm text-gray-500">Contact and campaign storage</p>
                </div>
              </div>
              <Badge variant={databaseConfigured ? "default" : "outline"}>
                {databaseConfigured ? "Connected" : "Not Configured"}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {redisConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">Redis Queue (Upstash)</p>
                  <p className="text-sm text-gray-500">Bulk message processing</p>
                </div>
              </div>
              <Badge variant={redisConfigured ? "default" : "outline"}>
                {redisConfigured ? "Connected" : "Not Configured"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Telnyx Config */}
        <Card>
          <CardHeader>
            <CardTitle>Telnyx Configuration</CardTitle>
            <CardDescription>
              Configure these values in your .env file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                value={telnyxConfigured ? "KEY_••••••••••••••••" : "Not configured"}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={process.env.TELNYX_PHONE_NUMBER || "Not configured"}
                disabled
              />
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800/50">
              <p className="font-medium">How to configure:</p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-gray-600 dark:text-gray-400">
                <li>Sign up at telnyx.com</li>
                <li>Buy a phone number</li>
                <li>Create a Messaging Profile</li>
                <li>Copy API key and phone number to .env</li>
                <li>Set up 10DLC for marketing messages</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Webhook */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook URL</CardTitle>
            <CardDescription>
              Set this URL in your Telnyx Messaging Profile for delivery tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-gray-50 p-4 font-mono text-sm dark:border-gray-700 dark:bg-gray-800/50">
              {process.env.NEXT_PUBLIC_URL || "https://your-domain.com"}/api/webhooks/telnyx
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Configure this in Telnyx Portal → Messaging → Messaging Profiles → Your Profile → Inbound Settings
            </p>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/10">
          <CardHeader>
            <CardTitle>TCPA Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm">Opt-out message auto-appended</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm">STOP keyword handling enabled</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm">Quiet hours enforcement (8 AM - 9 PM)</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm">Opted-out contacts protected from re-messaging</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
