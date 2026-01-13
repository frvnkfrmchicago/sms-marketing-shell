import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatPhoneNumber } from "@/lib/telnyx";

// GET /api/contacts - List all contacts with pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where = {
    ...(search && {
      OR: [
        { phone: { contains: search } },
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const contacts = await db.contact.findMany({
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    where,
    orderBy: { createdAt: "desc" },
  });

  const hasMore = contacts.length > limit;
  const data = hasMore ? contacts.slice(0, -1) : contacts;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  // Get total count
  const total = await db.contact.count({ where });
  const optedOutCount = await db.contact.count({ where: { optedOut: true } });

  return NextResponse.json({
    data,
    nextCursor,
    hasMore,
    total,
    optedOutCount,
  });
}

// POST /api/contacts - Create a single contact
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, firstName, lastName, email, tags } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Check if contact already exists
    const existing = await db.contact.findUnique({
      where: { phone: formattedPhone },
    });

    if (existing) {
      if (existing.optedOut) {
        return NextResponse.json(
          { error: "This contact has opted out and cannot be re-added" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Contact with this phone number already exists" },
        { status: 400 }
      );
    }

    const contact = await db.contact.create({
      data: {
        phone: formattedPhone,
        firstName,
        lastName,
        email,
        tags: tags || "",
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts - Delete multiple contacts (soft delete for opted-out)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Contact IDs required" },
        { status: 400 }
      );
    }

    // Only delete contacts that haven't opted out
    const deleted = await db.contact.deleteMany({
      where: {
        id: { in: ids },
        optedOut: false,
      },
    });

    return NextResponse.json({ deleted: deleted.count });
  } catch (error) {
    console.error("Error deleting contacts:", error);
    return NextResponse.json(
      { error: "Failed to delete contacts" },
      { status: 500 }
    );
  }
}
