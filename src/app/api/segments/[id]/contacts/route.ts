import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildWhereClause } from "../../route";

// GET /api/segments/[id]/contacts - Get contacts matching segment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const segment = await db.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    const filters = JSON.parse(segment.filters || "[]");
    const where = buildWhereClause(filters);

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      db.contact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to fetch segment contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment contacts" },
      { status: 500 }
    );
  }
}
