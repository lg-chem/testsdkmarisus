import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  chat,
  listConversations,
  getConversationHistory,
  deleteConversation,
  createConversation,
} from "@/services/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  // Accept null from frontend and convert to undefined
  conversationId: z.string().uuid().optional().nullable().transform(v => v ?? undefined),
  useGrounding: z.boolean().optional().default(true),
  useRAG: z.boolean().optional().default(true),
});

// POST - Send chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, useGrounding, useRAG } =
      chatSchema.parse(body);

    const response = await chat(message, {
      conversationId,
      useGrounding,
      useRAG,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Chat Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// GET - List conversations or get conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const history = await getConversationHistory(conversationId);
      return NextResponse.json({ success: true, messages: history });
    }

    const convs = await listConversations();
    return NextResponse.json({ success: true, conversations: convs });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Get conversations error:", errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

// DELETE - Delete conversation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "conversationId required" },
        { status: 400 }
      );
    }

    await deleteConversation(conversationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
