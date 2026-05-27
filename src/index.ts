/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TravelAnatolia V2 — Agentic Core                              ║
 * ║  Hyper-Personalized AI Travel Itinerary Generator               ║
 * ║                                                                  ║
 * ║  Stack: Node.js · TypeScript · Firebase Genkit · Gemini LLM     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { z } from "genkit";
import { startFlowServer } from "@genkit-ai/express";
import { ai } from "./ai";
import { analyzeProfileFlow } from "./onboarding";
import { travelAssistantFlow } from "./agent";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1 ▸ Original Itinerary Generator Schema
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PointOfInterestSchema = z.object({
  name: z
    .string()
    .describe("Name of the attraction or location (e.g. 'Göreme Open-Air Museum')"),
  description: z
    .string()
    .describe("A rich, 2-3 sentence description of why this place is worth visiting"),
  time: z
    .string()
    .describe("Suggested time slot for the visit (e.g. '09:00 – 11:30')"),
  category: z
    .enum(["history", "nature", "food", "culture", "adventure", "relaxation"])
    .describe("Thematic category of this POI"),
  estimatedDurationMinutes: z
    .number()
    .int()
    .positive()
    .describe("Estimated visit duration in minutes"),
  tips: z
    .string()
    .optional()
    .describe("Insider tip or practical advice for the visitor"),
});

const DaySchema = z.object({
  dayNumber: z.number().int().positive().describe("Sequential day number (1, 2, 3…)"),
  title: z.string().describe("A catchy title summarizing the day (e.g. 'Underground Cities & Fairy Chimneys')"),
  summary: z.string().describe("Brief 1-2 sentence overview of the day's theme"),
  pointsOfInterest: z
    .array(PointOfInterestSchema)
    .min(2)
    .max(6)
    .describe("Ordered list of places to visit this day"),
});

const ItinerarySchema = z.object({
  tripTitle: z
    .string()
    .describe("Creative, eye-catching title for the entire trip"),
  destination: z
    .string()
    .describe("Primary destination or region (e.g. 'Cappadocia, Türkiye')"),
  totalDays: z
    .number()
    .int()
    .positive()
    .describe("Total number of days in the itinerary"),
  overview: z
    .string()
    .describe("A compelling 3-4 sentence overview of the entire trip experience"),
  days: z
    .array(DaySchema)
    .min(1)
    .describe("Array of day-by-day plans, ordered chronologically"),
  bestTimeToVisit: z
    .string()
    .describe("Recommended season or months (e.g. 'April – June')"),
  packingRecommendations: z
    .array(z.string())
    .min(3)
    .describe("Essential items to pack for this specific trip"),
});

const ItineraryInputSchema = z.object({
  userPrompt: z
    .string()
    .min(10)
    .describe("Natural-language travel request (e.g. 'I want a 3-day history trip to Cappadocia')"),
});

export const generateItineraryFlow = ai.defineFlow(
  {
    name: "generateItineraryFlow",
    inputSchema: ItineraryInputSchema,
    outputSchema: ItinerarySchema,
  },
  async (input) => {
    const systemPrompt = `You are ANA (Anatolian Navigator AI), a world-class travel concierge 
specializing in Türkiye and the broader Anatolian region. You craft deeply personalized, 
culturally rich travel itineraries. Your tone is warm, inspiring, and authoritative.

Rules:
- Generate a day-by-day itinerary that matches the traveler's request exactly.
- Each day MUST have between 2 and 6 points of interest.
- Time slots should be realistic and account for travel between locations.
- Include insider tips whenever possible.
- Packing recommendations must be specific to the destination and activities.
- All output MUST conform strictly to the provided JSON schema.`;

    const { output } = await ai.generate({
      system: systemPrompt,
      prompt: input.userPrompt,
      output: {
        schema: ItinerarySchema,
      },
      config: {
        temperature: 0.95,
        maxOutputTokens: 8192,
      },
    });

    if (!output) {
      throw new Error("LLM returned an empty response — no itinerary generated.");
    }

    console.log(`🗺️  Generated itinerary: "${output.tripTitle}" — ${output.totalDays} days in ${output.destination}`);
    return output;
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2 ▸ Start Express server hosting all three flows
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

startFlowServer({
  flows: [
    generateItineraryFlow,
    analyzeProfileFlow,
    travelAssistantFlow,
  ],
  port: 4005,
  cors: {
    origin: "*", // Lock this down in production
  },
});

console.log("🚀 TravelAnatolia V2 Agentic Core is live on http://localhost:4005");
