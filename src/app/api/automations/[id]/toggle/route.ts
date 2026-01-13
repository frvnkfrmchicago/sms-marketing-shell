import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/automations/[id]/toggle - Toggle automation active state
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const automation = await db.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    const updated = await db.automation.update({
      where: { id },
      data: { isActive: !automation.isActive },
    });

    return NextResponse.json({
      success: true,
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error("Failed to toggle automation:", error);
    return NextResponse.json(
      { error: "Failed to toggle automation" },
      { status: 500 }
    );
  }
}
