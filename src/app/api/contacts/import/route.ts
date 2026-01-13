import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatPhoneNumber } from "@/lib/telnyx";
import { parse } from "csv-parse/sync";

type CsvRecord = Record<string, string>;

// POST /api/contacts/import - Import contacts from CSV
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();
    
    // Parse CSV
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRecord[];

    if (!records.length) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      );
    }

    // Detect column names (case-insensitive)
    const firstRecord = records[0];
    const columns = Object.keys(firstRecord);
    
    const phoneColumn = columns.find((c: string) =>
      ["phone", "phone_number", "phonenumber", "mobile", "cell"].includes(c.toLowerCase())
    );
    const firstNameColumn = columns.find((c: string) =>
      ["firstname", "first_name", "first", "name"].includes(c.toLowerCase())
    );
    const lastNameColumn = columns.find((c: string) =>
      ["lastname", "last_name", "last"].includes(c.toLowerCase())
    );
    const emailColumn = columns.find((c: string) =>
      ["email", "email_address", "emailaddress"].includes(c.toLowerCase())
    );

    if (!phoneColumn) {
      return NextResponse.json(
        { error: "CSV must have a phone/phone_number column" },
        { status: 400 }
      );
    }

    // Get existing opted-out phones to prevent re-adding
    const optedOutPhones = await db.contact.findMany({
      where: { optedOut: true },
      select: { phone: true },
    });
    const optedOutSet = new Set(optedOutPhones.map((c: { phone: string }) => c.phone));

    // Process records
    const results = {
      imported: 0,
      skipped: 0,
      duplicates: 0,
      optedOut: 0,
      errors: [] as string[],
    };

    const contactsToCreate: Array<{
      phone: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    }> = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rawPhone = record[phoneColumn];

      if (!rawPhone) {
        results.skipped++;
        continue;
      }

      const phone = formatPhoneNumber(rawPhone);

      // Check if opted out
      if (optedOutSet.has(phone)) {
        results.optedOut++;
        continue;
      }

      contactsToCreate.push({
        phone,
        firstName: firstNameColumn ? record[firstNameColumn] : undefined,
        lastName: lastNameColumn ? record[lastNameColumn] : undefined,
        email: emailColumn ? record[emailColumn] : undefined,
      });
    }

    // Bulk insert with skipDuplicates
    // Bulk insert/update using upsert (SQLite safe)
    if (contactsToCreate.length > 0) {
      let importedCount = 0;
      let duplicateCount = 0;

      await Promise.all(
        contactsToCreate.map(async (contact) => {
          try {
            await db.contact.upsert({
              where: { phone: contact.phone },
              update: {
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
              },
              create: contact,
            });
            importedCount++;
          } catch (error) {
            console.error(`Failed to upsert contact ${contact.phone}`, error);
          }
        })
      );

      results.imported = importedCount;
      // In upsert mode, we don't strictly distinguish duplicates vs new, 
      // but for this simple stats return, we can approximate or just report imported/updated.
      // Or we can check existence first if strict stats are needed, but performance is key.
      // Let's just say all successful ops are "imported/updated".
      results.duplicates = contactsToCreate.length - importedCount; 
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
