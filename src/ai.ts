import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure GEMINI_API_KEY or GOOGLE_API_KEY is mapped if GOOGLE_GENAI_API_KEY is provided
if (process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;
}

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY })],
  model: "googleai/gemini-2.5-flash", // Default model for all flows
});
