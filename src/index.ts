/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TravelAnatolia V2 — Agentic Core                              ║
 * ║  Hyper-Personalized AI Travel Itinerary Generator               ║
 * ║                                                                  ║
 * ║  Stack: Node.js · TypeScript · Firebase Genkit · Gemini LLM     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { startFlowServer } from "@genkit-ai/express";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1 ▸ Initialize Genkit with the Google Gemini Plugin
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ai = genkit({
  plugins: [googleAI()],
  model: "googleai/gemini-2.5-flash", // Default model for all flows
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2 ▸ Zod Schemas — Strict Structured Output Contract
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** A single point of interest within a day. */
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

/** A single day within the multi-day itinerary. */
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

/** The complete multi-day travel itinerary — top-level output schema. */
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

/** Input schema for the flow — the user's natural-language prompt. */
const ItineraryInputSchema = z.object({
  userPrompt: z
    .string()
    .min(10)
    .describe("Natural-language travel request (e.g. 'I want a 3-day history trip to Cappadocia')"),
});

// Export types for downstream consumers (Flutter client, Data Connect, etc.)
export type PointOfInterest = z.infer<typeof PointOfInterestSchema>;
export type Day = z.infer<typeof DaySchema>;
export type Itinerary = z.infer<typeof ItinerarySchema>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3 ▸ Genkit Flow — generateItineraryFlow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const generateItineraryFlow = ai.defineFlow(
  {
    name: "generateItineraryFlow",
    inputSchema: ItineraryInputSchema,
    outputSchema: ItinerarySchema,
  },
  async (input) => {
    // ── Step 1: Build the system prompt ──────────────────────────
    const systemPrompt = `You are ANA (Anatolian Navigator AI), a world-class travel concierge 
specializing in Türkiye and the broader Anatolian region. You craft deeply personalized, 
culturally rich travel itineraries. Your tone is warm, knowledgeable, and inspiring.

Rules:
- Generate a day-by-day itinerary that matches the traveler's request exactly.
- Each day MUST have between 2 and 6 points of interest.
- Time slots should be realistic and account for travel between locations.
- Include insider tips whenever possible.
- Packing recommendations must be specific to the destination and activities.
- All output MUST conform strictly to the provided JSON schema.`;

    // ── Step 2: Call the LLM with structured output ─────────────
    const { output } = await ai.generate({
      system: systemPrompt,
      prompt: input.userPrompt,
      output: {
        schema: ItinerarySchema,
      },
      // Optional: fine-tune generation parameters
      config: {
        temperature: 0.9, // Creative but coherent
        maxOutputTokens: 8192,
      },
    });

    // Genkit validates the response against ItinerarySchema automatically.
    // If the model returns malformed JSON, Genkit will throw a structured error.
    if (!output) {
      throw new Error("LLM returned an empty response — no itinerary generated.");
    }

    // ── Step 3: [PLACEHOLDER] Save to Firebase Data Connect ─────
    //
    // TODO: Inject Firebase Data Connect (PostgreSQL) logic here.
    //
    // Example pseudocode:
    // ─────────────────────────────────────────────────────────────
    // import { getDataConnect } from 'firebase/data-connect';
    //
    // const dc = getDataConnect({ connector: 'travelanatolia' });
    //
    // // 1. Insert the top-level itinerary record
    // const itineraryRef = await dc.mutation('CreateItinerary', {
    //   tripTitle:    output.tripTitle,
    //   destination:  output.destination,
    //   totalDays:    output.totalDays,
    //   overview:     output.overview,
    //   bestTime:     output.bestTimeToVisit,
    //   packing:      output.packingRecommendations,
    //   userId:       '<from-auth-context>',
    //   createdAt:    new Date().toISOString(),
    // });
    //
    // // 2. Insert each day + its points of interest
    // for (const day of output.days) {
    //   const dayRef = await dc.mutation('CreateDay', {
    //     itineraryId: itineraryRef.id,
    //     dayNumber:   day.dayNumber,
    //     title:       day.title,
    //     summary:     day.summary,
    //   });
    //
    //   for (const poi of day.pointsOfInterest) {
    //     await dc.mutation('CreatePointOfInterest', {
    //       dayId:       dayRef.id,
    //       name:        poi.name,
    //       description: poi.description,
    //       time:        poi.time,
    //       category:    poi.category,
    //       duration:    poi.estimatedDurationMinutes,
    //       tips:        poi.tips ?? null,
    //     });
    //   }
    // }
    //
    // console.log(`✅ Itinerary saved: ${itineraryRef.id}`);
    // ─────────────────────────────────────────────────────────────

    console.log(`🗺️  Generated itinerary: "${output.tripTitle}" — ${output.totalDays} days in ${output.destination}`);
    return output;
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4 ▸ Start the Express-based Flow Server
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

startFlowServer({
  flows: [generateItineraryFlow],
  port: 4000,
  cors: {
    origin: "*", // Lock this down in production
  },
});

console.log("🚀 TravelAnatolia Agentic Core is live on http://localhost:4000");
