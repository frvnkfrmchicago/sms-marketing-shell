import { Queue, Worker, Job, ConnectionOptions } from "bullmq";
import IORedis from "ioredis";
import { db } from "./db";
import { sendMessage, isQuietHours, appendOptOutMessage } from "./telnyx";

// Redis connection for BullMQ - lazy initialized
let connection: IORedis | null = null;

const getConnection = () => {
  if (connection) return connection;
  
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured");
  }
  
  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  
  return connection;
};

// SMS Queue - lazy initialized
let _smsQueue: Queue | null = null;

export function getSmsQueue() {
  if (_smsQueue) return _smsQueue;
  
  _smsQueue = new Queue("sms", {
    connection: getConnection() as unknown as ConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
  
  return _smsQueue;
}

// Job data interface
export interface SmsJobData {
  campaignId: string;
  contactId: string;
  phone: string;
  message: string;
  mediaUrl?: string;
  timezone?: string;
}

/**
 * Add messages to the queue for a campaign
 */
export async function queueCampaignMessages(campaignId: string): Promise<number> {
  const smsQueue = getSmsQueue();
  
  // Get campaign
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Get all active (non-opted-out) contacts
  const contacts = await db.contact.findMany({
    where: { optedOut: false },
  });

  // Add compliance message
  const messageWithOptOut = appendOptOutMessage(campaign.content);

  // Queue each message
  const jobs = contacts.map((contact) => ({
    name: "send-sms",
    data: {
      campaignId,
      contactId: contact.id,
      phone: contact.phone,
      message: messageWithOptOut,
      mediaUrl: campaign.mediaUrl || undefined,
      timezone: contact.timezone,
    } as SmsJobData,
  }));

  await smsQueue.addBulk(jobs);

  // Update campaign status
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: "sending",
      totalCount: contacts.length,
      sentAt: new Date(),
    },
  });

  // Create SmsLog entries for each message
  await db.smsLog.createMany({
    data: contacts.map((contact) => ({
      campaignId,
      contactId: contact.id,
      phone: contact.phone,
      message: messageWithOptOut,
      mediaUrl: campaign.mediaUrl,
      messageType: campaign.mediaUrl ? "mms" : "sms",
      status: "queued",
    })),
  });

  return contacts.length;
}

/**
 * Create and start the SMS worker
 */
export function createSmsWorker() {
  const worker = new Worker<SmsJobData>(
    "sms",
    async (job: Job<SmsJobData>) => {
      const { campaignId, contactId, phone, message, mediaUrl, timezone } = job.data;

      // Check quiet hours
      if (isQuietHours(timezone)) {
        // Delay until 8 AM
        throw new Error("QUIET_HOURS");
      }

      // Check if contact has opted out (in case they opted out while queued)
      const contact = await db.contact.findUnique({
        where: { id: contactId },
      });

      if (contact?.optedOut) {
        // Skip this message, mark as skipped
        await db.smsLog.updateMany({
          where: { campaignId, contactId },
          data: { status: "skipped", error: "Contact opted out" },
        });
        return { skipped: true };
      }

      // Send the message
      const result = await sendMessage({ to: phone, message, mediaUrl });

      // Update SmsLog
      await db.smsLog.updateMany({
        where: { campaignId, contactId },
        data: {
          status: result.success ? "sent" : "failed",
          providerMsgId: result.messageId,
          error: result.error,
          sentAt: result.success ? new Date() : undefined,
        },
      });

      // Update campaign counts
      if (result.success) {
        await db.campaign.update({
          where: { id: campaignId },
          data: { sentCount: { increment: 1 } },
        });
      } else {
        await db.campaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        });
      }

      return result;
    },
    {
      connection: getConnection() as unknown as ConnectionOptions,
      concurrency: 10,
      limiter: {
        max: 100,
        duration: 1000, // 100 messages per second
      },
    }
  );

  worker.on("completed", async (job) => {
    console.log(`Job ${job.id} completed`);
    
    // Check if campaign is complete
    const campaignId = job.data.campaignId;
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });
    
    if (campaign && campaign.sentCount + campaign.failedCount >= campaign.totalCount) {
      await db.campaign.update({
        where: { id: campaignId },
        data: {
          status: "sent",
        },
      });
    }
  });

  worker.on("failed", (job, err) => {
    if (err.message === "QUIET_HOURS") {
      console.log(`Job ${job?.id} delayed due to quiet hours`);
    } else {
      console.error(`Job ${job?.id} failed:`, err.message);
    }
  });

  return worker;
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const smsQueue = getSmsQueue();
  const waiting = await smsQueue.getWaitingCount();
  const active = await smsQueue.getActiveCount();
  const completed = await smsQueue.getCompletedCount();
  const failed = await smsQueue.getFailedCount();

  return { waiting, active, completed, failed };
}
