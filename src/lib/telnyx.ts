// Telnyx SMS/MMS client using fetch API
// The Telnyx Node SDK has type issues - using direct API calls

const TELNYX_API_URL = "https://api.telnyx.com/v2";

export interface SendSmsOptions {
  to: string;
  message: string;
  mediaUrl?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function telnyxRequest<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${TELNYX_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.errors?.[0]?.detail || error.message || "Telnyx API error");
  }

  return response.json();
}

/**
 * Send an SMS message via Telnyx
 */
export async function sendSMS(options: SendSmsOptions): Promise<SendResult> {
  try {
    const response = await telnyxRequest<{ data: { id: string } }>("/messages", {
      from: process.env.TELNYX_PHONE_NUMBER,
      to: options.to,
      text: options.message,
      messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
    });

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error("SMS send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send an MMS message (with image) via Telnyx
 */
export async function sendMMS(options: SendSmsOptions): Promise<SendResult> {
  if (!options.mediaUrl) {
    return sendSMS(options);
  }

  try {
    const response = await telnyxRequest<{ data: { id: string } }>("/messages", {
      from: process.env.TELNYX_PHONE_NUMBER,
      to: options.to,
      text: options.message,
      media_urls: [options.mediaUrl],
      messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
    });

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error("MMS send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send SMS or MMS based on whether media is provided
 */
export async function sendMessage(options: SendSmsOptions): Promise<SendResult> {
  if (options.mediaUrl) {
    return sendMMS(options);
  }
  return sendSMS(options);
}

/**
 * Check if current time is within quiet hours (before 8 AM or after 9 PM)
 */
export function isQuietHours(timezone: string = "America/Chicago"): boolean {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(formatter.format(now), 10);
    return hour < 8 || hour >= 21;
  } catch {
    // Default to checking Central time if timezone is invalid
    const now = new Date();
    const centralHour = now.getUTCHours() - 6; // Approximate CST
    return centralHour < 8 || centralHour >= 21;
  }
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Add +1 if US number without country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Add + if 11 digits starting with 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  
  // Already has country code
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  return phone;
}

/**
 * Append opt-out message for TCPA compliance
 */
export function appendOptOutMessage(message: string): string {
  const optOutText = "\n\nReply STOP to unsubscribe.";
  if (message.toLowerCase().includes("stop") && message.toLowerCase().includes("unsubscribe")) {
    return message;
  }
  return message + optOutText;
}
