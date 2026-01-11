import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runStrategyAgent } from "@/services/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  knowledgeBase: z.string().min(10, "Knowledge base must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { knowledgeBase } = requestSchema.parse(body);

    const strategy = await runStrategyAgent(knowledgeBase);

    return NextResponse.json({
      success: true,
      strategy,
    });
  } catch (error) {
    console.error("Strategy Agent Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate strategy" },
      { status: 500 }
    );
  }
}
