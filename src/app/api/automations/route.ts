import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/automations - List all automations
export async function GET() {
  try {
    const automations = await db.automation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { logs: true },
        },
      },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Failed to fetch automations:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

// POST /api/automations - Create a new automation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, trigger, triggerConfig, steps } = body;

    if (!name || !trigger) {
      return NextResponse.json(
        { error: "Name and trigger are required" },
        { status: 400 }
      );
    }

    const automation = await db.automation.create({
      data: {
        name,
        trigger,
        triggerConfig: triggerConfig ? JSON.stringify(triggerConfig) : null,
        steps: {
          create: (steps || []).map((step: { type: string; config: Record<string, unknown> }, index: number) => ({
            order: index,
            type: step.type,
            config: JSON.stringify(step.config || {}),
          })),
        },
      },
      include: {
        steps: true,
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Failed to create automation:", error);
    return NextResponse.json(
      { error: "Failed to create automation" },
      { status: 500 }
    );
  }
}
