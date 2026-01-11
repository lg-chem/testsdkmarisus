import { GoogleGenAI } from "@google/genai";

// Vertex AI Configuration
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

// Check if we're using Vertex AI or Gemini API
const useVertexAI = Boolean(projectId && serviceAccountKey);

let genaiInstance: GoogleGenAI;

if (useVertexAI) {
  // Parse service account JSON from env variable
  let credentials;
  try {
    credentials = JSON.parse(serviceAccountKey!);
  } catch (e) {
    console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:", e);
    console.error("Key length:", serviceAccountKey?.length);
    console.error("Key preview:", serviceAccountKey?.substring(0, 50) + "...");
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON format");
  }

  // Initialize with Vertex AI
  genaiInstance = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location,
    googleAuthOptions: {
      credentials: credentials,
    },
  });

  console.log(`Vertex AI initialized: project=${projectId}, location=${location}`);
} else {
  // Fallback to Gemini API with API key
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn(
      "Warning: Neither Vertex AI nor Gemini API configured. Set GOOGLE_CLOUD_PROJECT + GOOGLE_SERVICE_ACCOUNT_KEY for Vertex AI, or GOOGLE_API_KEY for Gemini API."
    );
  }

  genaiInstance = new GoogleGenAI({ apiKey: apiKey || "" });
  console.log("Gemini API initialized (not Vertex AI)");
}

export const genai = genaiInstance;

// Vertex AI supports more models
export const MODEL_NAME = "gemini-2.0-flash";

// Export config for other modules
export const vertexConfig = {
  isVertexAI: useVertexAI,
  project: projectId,
  location: location,
};
