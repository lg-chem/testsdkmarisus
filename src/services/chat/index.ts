import { db, conversations, messages } from "@/db";
import { eq, desc } from "drizzle-orm";
import { genai, MODEL_NAME, vertexConfig } from "../agents/gemini-client";
import { searchDocuments, buildContext } from "../rag";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  useGrounding?: boolean; // Search Google
  useRAG?: boolean; // Search documents
  conversationId?: string;
}

export interface ChatResponse {
  content: string;
  conversationId: string;
  sources?: {
    rag?: { filename: string; content: string }[];
    grounding?: string[];
  };
}

/**
 * Create a new conversation
 */
export async function createConversation(title?: string): Promise<string> {
  const [conv] = await db
    .insert(conversations)
    .values({ title: title || "Nowa rozmowa" })
    .returning();
  return conv.id;
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  conversationId: string
): Promise<ChatMessage[]> {
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return msgs.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));
}

/**
 * Save message to conversation
 */
export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.insert(messages).values({
    conversationId,
    role,
    content,
    metadata,
  });

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

/**
 * List all conversations
 */
export async function listConversations() {
  return db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt));
}

/**
 * Chat with AI using Grounding and/or RAG
 */
export async function chat(
  userMessage: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const { useGrounding = true, useRAG = true, conversationId } = options;

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    convId = await createConversation();
  }

  // Get conversation history
  const history = await getConversationHistory(convId);

  // Build context from RAG
  let ragContext = "";
  let ragSources: { filename: string; content: string }[] = [];

  if (useRAG) {
    try {
      const searchResults = await searchDocuments(userMessage, 3, 0.6);
      if (searchResults.length > 0) {
        ragContext = buildContext(searchResults);
        ragSources = searchResults.map((r) => ({
          filename: r.filename,
          content: r.content.slice(0, 200) + "...",
        }));
      }
    } catch (e) {
      console.warn("RAG search failed (tables may not exist yet):", e);
    }
  }

  // Build system prompt
  let systemPrompt = `Jesteś pomocnym asystentem AI. Odpowiadaj po polsku, konkretnie i rzeczowo.`;

  if (ragContext) {
    systemPrompt += `\n\nMasz dostęp do następujących dokumentów użytkownika. Używaj ich do odpowiedzi:\n\n${ragContext}`;
  }

  // Save user message
  await saveMessage(convId, "user", userMessage);

  // Build messages for API - map assistant to model for Gemini
  const apiMessages = [
    ...history.map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content }],
    })),
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  // Configure tools for grounding
  const tools = [];
  if (useGrounding && vertexConfig.isVertexAI) {
    tools.push({ googleSearch: {} });
  }

  // Generate response
  const response = await genai.models.generateContent({
    model: MODEL_NAME,
    contents: apiMessages,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 2048,
      tools: tools.length > 0 ? tools : undefined,
    },
  });

  const assistantContent =
    response.text || "Przepraszam, nie udało się wygenerować odpowiedzi.";

  // Save assistant message
  await saveMessage(convId, "assistant", assistantContent, {
    useGrounding,
    useRAG,
    ragSourcesCount: ragSources.length,
  });

  return {
    content: assistantContent,
    conversationId: convId,
    sources: {
      rag: ragSources.length > 0 ? ragSources : undefined,
    },
  };
}

/**
 * Delete conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await db.delete(conversations).where(eq(conversations.id, conversationId));
}
