import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client
// Uses GOOGLE_API_KEY env variable or GOOGLE_CLOUD_PROJECT for Vertex AI
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Warning: GOOGLE_API_KEY not set. AI features will not work.");
}

export const genai = new GoogleGenAI({ apiKey: apiKey || "" });

export const MODEL_NAME = "gemini-2.0-flash";
