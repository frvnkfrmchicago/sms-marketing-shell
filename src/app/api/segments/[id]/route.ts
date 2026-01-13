import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildWhereClause } from "../route";

// GET /api/segments/[id] - Get segment details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const segment = await db.segment.findUnique({
      where: { id },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    if (!segment) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Failed to fetch segment:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment" },
      { status: 500 }
    );
  }
}

// PATCH /api/segments/[id] - Update segment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, filters } = body;

    // Recalculate contact count if filters changed
    let contactCount: number | undefined;
    if (filters) {
      const where = buildWhereClause(filters);
      contactCount = await db.contact.count({ where });
    }

    const segment = await db.segment.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filters && { filters: JSON.stringify(filters) }),
        ...(contactCount !== undefined && { contactCount }),
      },
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Failed to update segment:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 }
    );
  }
}

// DELETE /api/segments/[id] - Delete segment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.segment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete segment:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 }
    );
  }
}
