import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const debug: Record<string, unknown> = {
    timestamp: new Date().toISOString(),

    // Environment variables
    env: {
      hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasGoogleProject: Boolean(process.env.GOOGLE_CLOUD_PROJECT),
      googleProject: process.env.GOOGLE_CLOUD_PROJECT || "NOT SET",
      googleLocation: process.env.GOOGLE_CLOUD_LOCATION || "NOT SET",
      hasServiceAccountKey: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      serviceAccountKeyLength: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.length || 0,
      hasGoogleApiKey: Boolean(process.env.GOOGLE_API_KEY),
    },

    // Test results
    jsonParse: { status: "pending", error: null as string | null },
    dbConnection: { status: "pending", error: null as string | null },
    dbTables: { status: "pending", tables: [] as string[], error: null as string | null },
    geminiInit: { status: "pending", isVertexAI: false, error: null as string | null },
    geminiCall: { status: "pending", error: null as string | null },
  };

  // 1. Test JSON parsing
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      const requiredFields = ["type", "project_id", "private_key", "client_email"];
      const missingFields = requiredFields.filter(f => !parsed[f]);

      if (missingFields.length > 0) {
        debug.jsonParse = { status: "MISSING_FIELDS", error: `Missing: ${missingFields.join(", ")}` };
      } else if (!parsed.private_key?.includes("-----BEGIN PRIVATE KEY-----")) {
        debug.jsonParse = { status: "INVALID_KEY_FORMAT", error: "No BEGIN PRIVATE KEY header" };
      } else {
        debug.jsonParse = { status: "OK", error: null };
      }
    } catch (e) {
      debug.jsonParse = { status: "PARSE_ERROR", error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 2. Test database connection
  try {
    const { db } = await import("@/db");
    const result = await db.execute("SELECT 1 as test");
    debug.dbConnection = { status: "OK", error: null };
  } catch (e) {
    debug.dbConnection = { status: "ERROR", error: e instanceof Error ? e.message : String(e) };
  }

  // 3. Check which tables exist
  try {
    const { db } = await import("@/db");
    const tables = await db.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const tableNames = (tables.rows as Array<{table_name: string}>).map(r => r.table_name);
    debug.dbTables = { status: "OK", tables: tableNames, error: null };
  } catch (e) {
    debug.dbTables = { status: "ERROR", tables: [], error: e instanceof Error ? e.message : String(e) };
  }

  // 4. Test Gemini initialization
  try {
    const { genai, vertexConfig, MODEL_NAME } = await import("@/services/agents/gemini-client");
    debug.geminiInit = {
      status: vertexConfig.initError ? "INIT_ERROR" : "OK",
      isVertexAI: vertexConfig.isVertexAI,
      model: MODEL_NAME,
      project: vertexConfig.project,
      location: vertexConfig.location,
      error: vertexConfig.initError || null,
    };
  } catch (e) {
    debug.geminiInit = { status: "ERROR", isVertexAI: false, error: e instanceof Error ? e.message : String(e) };
  }

  // 5. Test actual Gemini API call
  try {
    const { genai, MODEL_NAME } = await import("@/services/agents/gemini-client");
    const response = await genai.models.generateContent({
      model: MODEL_NAME,
      contents: "Say 'test ok' in 2 words",
      config: { maxOutputTokens: 10 },
    });
    debug.geminiCall = { status: "OK", error: null, response: response.text?.substring(0, 50) };
  } catch (e) {
    debug.geminiCall = { status: "ERROR", error: e instanceof Error ? e.message : String(e) };
  }

  // 6. Test embedding generation (used by RAG)
  const embeddingTest: { status: string; error: string | null; dimensions?: number } = { status: "pending", error: null };
  try {
    const { generateEmbedding } = await import("@/services/rag/embeddings");
    const embedding = await generateEmbedding("test query");
    embeddingTest.status = "OK";
    embeddingTest.dimensions = embedding.length;
  } catch (e) {
    embeddingTest.status = "ERROR";
    embeddingTest.error = e instanceof Error ? e.message : String(e);
  }
  (debug as Record<string, unknown>).embeddingTest = embeddingTest;

  // 7. Test listConversations (exact function used by chat API)
  const chatServiceTest: { status: string; error: string | null; count?: number } = { status: "pending", error: null };
  try {
    const { listConversations } = await import("@/services/chat");
    const convs = await listConversations();
    chatServiceTest.status = "OK";
    chatServiceTest.count = convs.length;
  } catch (e) {
    chatServiceTest.status = "ERROR";
    chatServiceTest.error = e instanceof Error ? e.message : String(e);
  }
  (debug as Record<string, unknown>).chatServiceTest = chatServiceTest;

  return NextResponse.json(debug);
}
