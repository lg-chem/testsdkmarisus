import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const debug = {
    // Database
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),

    // Google
    hasGoogleProject: Boolean(process.env.GOOGLE_CLOUD_PROJECT),
    googleProject: process.env.GOOGLE_CLOUD_PROJECT || "NOT SET",
    googleLocation: process.env.GOOGLE_CLOUD_LOCATION || "NOT SET",

    hasServiceAccountKey: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    serviceAccountKeyLength: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.length || 0,
    serviceAccountKeyStart: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.substring(0, 50) || "NOT SET",
    serviceAccountKeyEnd: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.slice(-50) || "NOT SET",

    hasGoogleApiKey: Boolean(process.env.GOOGLE_API_KEY),

    // Try parsing the JSON
    jsonParseResult: "not tested",
    jsonError: null as string | null,
  };

  // Test JSON parsing
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      debug.jsonParseResult = "SUCCESS";
      debug.jsonError = null;

      // Check required fields
      const requiredFields = ["type", "project_id", "private_key", "client_email"];
      const missingFields = requiredFields.filter(f => !parsed[f]);
      if (missingFields.length > 0) {
        debug.jsonParseResult = "MISSING_FIELDS";
        debug.jsonError = `Missing: ${missingFields.join(", ")}`;
      }

      // Check private_key format
      if (parsed.private_key) {
        if (!parsed.private_key.includes("-----BEGIN PRIVATE KEY-----")) {
          debug.jsonParseResult = "INVALID_PRIVATE_KEY";
          debug.jsonError = "private_key doesn't have BEGIN PRIVATE KEY header";
        }
      }
    } catch (e) {
      debug.jsonParseResult = "PARSE_ERROR";
      debug.jsonError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json(debug);
}
