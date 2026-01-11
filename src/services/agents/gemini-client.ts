import { GoogleGenAI } from "@google/genai";

// Vertex AI Configuration
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

// Check if we should try Vertex AI
const shouldTryVertexAI = Boolean(projectId && serviceAccountKey);

let genaiInstance: GoogleGenAI;
let isVertexAI = false;

if (shouldTryVertexAI) {
  // Parse service account JSON from env variable
  try {
    const credentials = JSON.parse(serviceAccountKey!);

    // Initialize with Vertex AI
    genaiInstance = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location: location,
      googleAuthOptions: {
        credentials: credentials,
      },
    });
    isVertexAI = true;
    console.log(`Vertex AI initialized: project=${projectId}, location=${location}`);
  } catch (e) {
    console.error("Failed to init Vertex AI:", e);
    console.error("Falling back to Gemini API...");

    // Fallback to Gemini API
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
    genaiInstance = new GoogleGenAI({ apiKey });
    console.log("Fallback: Gemini API initialized");
  }
} else {
  // Use Gemini API with API key
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn(
      "Warning: No API configured. Set GOOGLE_CLOUD_PROJECT + GOOGLE_SERVICE_ACCOUNT_KEY for Vertex AI, or GOOGLE_API_KEY for Gemini API."
    );
  }

  genaiInstance = new GoogleGenAI({ apiKey: apiKey || "" });
  console.log("Gemini API initialized");
}

export const genai = genaiInstance;
export const MODEL_NAME = "gemini-2.0-flash-001";

// Export config for other modules
export const vertexConfig = {
  isVertexAI,
  project: projectId,
  location: location,
};
