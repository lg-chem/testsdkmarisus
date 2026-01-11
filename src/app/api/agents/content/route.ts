import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runContentAgent } from "@/services/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  strategy: z.string().min(10, "Strategy must be at least 10 characters"),
  knowledgeBase: z.string().min(10, "Knowledge base must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategy, knowledgeBase } = requestSchema.parse(body);

    const posts = await runContentAgent(strategy, knowledgeBase);

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Content Agent Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
