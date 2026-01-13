import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/segments - List all segments
export async function GET() {
  try {
    const segments = await db.segment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    return NextResponse.json(segments);
  } catch (error) {
    console.error("Failed to fetch segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
      { status: 500 }
    );
  }
}

// POST /api/segments - Create a new segment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, filters } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Segment name is required" },
        { status: 400 }
      );
    }

    // Parse filters and count matching contacts
    const contactCount = await countContactsForFilters(filters || []);

    const segment = await db.segment.create({
      data: {
        name,
        description: description || null,
        filters: JSON.stringify(filters || []),
        contactCount,
      },
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Failed to create segment:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}

// Helper: Count contacts matching filters
async function countContactsForFilters(filters: FilterRule[]): Promise<number> {
  const where = buildWhereClause(filters);
  return db.contact.count({ where });
}

interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

// Build Prisma where clause from filter rules
export function buildWhereClause(filters: FilterRule[]) {
  const conditions: Record<string, unknown>[] = [];

  for (const filter of filters) {
    const { field, operator, value } = filter;

    switch (field) {
      case "tags":
        if (operator === "contains") {
          conditions.push({ tags: { contains: value } });
        } else if (operator === "equals") {
          conditions.push({ tags: value });
        }
        break;

      case "optedOut":
        conditions.push({ optedOut: value === "true" });
        break;

      case "source":
        conditions.push({ source: value });
        break;

      case "messageCount":
        if (operator === "greaterThan") {
          conditions.push({ messageCount: { gt: parseInt(value) } });
        } else if (operator === "lessThan") {
          conditions.push({ messageCount: { lt: parseInt(value) } });
        } else {
          conditions.push({ messageCount: parseInt(value) });
        }
        break;

      case "lastTextedAt":
        if (operator === "before") {
          conditions.push({ lastTextedAt: { lt: new Date(value) } });
        } else if (operator === "after") {
          conditions.push({ lastTextedAt: { gt: new Date(value) } });
        }
        break;
    }
  }

  // Always exclude opted-out contacts unless explicitly included
  if (!filters.some((f) => f.field === "optedOut")) {
    conditions.push({ optedOut: false });
  }

  return conditions.length > 0 ? { AND: conditions } : { optedOut: false };
}
