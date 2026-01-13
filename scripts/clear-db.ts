
import { db } from "../src/lib/db";

async function main() {
  console.log("Clearing all campaigns...");
  await db.smsLog.deleteMany({});
  await db.campaign.deleteMany({});
  console.log("Campaigns cleared.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
