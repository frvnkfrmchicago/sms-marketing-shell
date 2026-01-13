import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/automations/[id] - Get automation details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const automation = await db.automation.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { logs: true },
        },
      },
    });

    if (!automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Failed to fetch automation:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation" },
      { status: 500 }
    );
  }
}

// PATCH /api/automations/[id] - Update automation
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, trigger, triggerConfig, steps, isActive } = body;

    // If steps provided, delete old and create new
    if (steps) {
      await db.automationStep.deleteMany({ where: { automationId: id } });
    }

    const automation = await db.automation.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(trigger && { trigger }),
        ...(triggerConfig !== undefined && {
          triggerConfig: triggerConfig ? JSON.stringify(triggerConfig) : null,
        }),
        ...(isActive !== undefined && { isActive }),
        ...(steps && {
          steps: {
            create: steps.map((step: { type: string; config: Record<string, unknown> }, index: number) => ({
              order: index,
              type: step.type,
              config: JSON.stringify(step.config || {}),
            })),
          },
        }),
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Failed to update automation:", error);
    return NextResponse.json(
      { error: "Failed to update automation" },
      { status: 500 }
    );
  }
}

// DELETE /api/automations/[id] - Delete automation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.automation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete automation:", error);
    return NextResponse.json(
      { error: "Failed to delete automation" },
      { status: 500 }
    );
  }
}
