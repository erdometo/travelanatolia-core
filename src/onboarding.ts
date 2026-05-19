import { z } from "genkit";
import { ai } from "./ai";
import { firestoreMock } from "./firestoreMock";
import { syncUserProfileToGraph } from "./graphSync";
import { TravelerProfile } from "./types";

// Schema for input answers
export const OnboardingAnswersSchema = z.object({
  userId: z.string().describe("Unique identifier for the user"),
  fullName: z.string().describe("User's full name"),
  travelStyle: z
    .string()
    .describe("Answer to: What is your favorite travel style? (e.g., Adventure, History, Culinary, Relaxation)"),
  budget: z.string().describe("Answer to: What is your typical budget range per day?"),
  companion: z.string().describe("Answer to: Who is your typical travel companion? (e.g., Solo, Partner, Family, Friends)"),
  activities: z.string().describe("Answer to: What are 3-5 specific activities or interests you love while traveling?"),
});

// Schema for structured output
export const TravelerProfileSchema = z.object({
  travelStyle: z
    .enum(["Adventure", "History", "Culinary", "Relaxation", "Other"])
    .describe("Primary travel classification"),
  budgetRange: z
    .enum(["Budget", "Moderate", "Luxury"])
    .describe("Parsed daily budget level"),
  companion: z
    .enum(["Solo", "Partner", "Family", "Friends"])
    .describe("Primary companion type"),
  interests: z
    .array(z.string())
    .describe("A clean array of 5-10 normalized, lowercase keyword tags of their interests (e.g. ['hiking', 'museums'])"),
  personaDescription: z
    .string()
    .describe("A highly engaging 2-3 sentence overview of their travel personality and what makes them unique"),
});

export const analyzeProfileFlow = ai.defineFlow(
  {
    name: "analyzeProfileFlow",
    inputSchema: OnboardingAnswersSchema,
    outputSchema: z.custom<TravelerProfile>(),
  },
  async (answers) => {
    console.log(`🤖 Analyzing onboarding answers for user ${answers.fullName}...`);

    const systemPrompt = `You are an expert traveler profiling AI. Your job is to analyze a traveler's onboarding responses and output a structured profile.

Categorize carefully:
- travelStyle: Choose the closest from ['Adventure', 'History', 'Culinary', 'Relaxation', 'Other'].
- budgetRange: Choose from ['Budget', 'Moderate', 'Luxury'] based on their description.
- companion: Choose from ['Solo', 'Partner', 'Family', 'Friends'].
- interests: Extract a list of 5 to 10 specific, lowercase, clean tags representing their specific interest areas, destinations mentioned, or activity preferences (e.g., "hot-air-balloon", "hiking", "caves", "fine-dining").
- personaDescription: Write a warm, inspiring 2-3 sentence summary of their travel style and what excites them.

Respond strictly matching the output schema.`;

    const promptText = `
User: ${answers.fullName}
Answers:
1. Favorite travel style: ${answers.travelStyle}
2. Budget range: ${answers.budget}
3. Companion: ${answers.companion}
4. Activities/interests: ${answers.activities}
    `;

    // Call Gemini to structure the profile with a graceful mock fallback if no API key is set
    let output: z.infer<typeof TravelerProfileSchema> | null = null;
    try {
      const response = await ai.generate({
        system: systemPrompt,
        prompt: promptText,
        output: {
          schema: TravelerProfileSchema,
        },
        config: {
          temperature: 0.2, // Be precise and deterministic
        },
      });
      output = response.output;
    } catch (e: any) {
      if (
        e.status === "FAILED_PRECONDITION" || 
        e.message?.includes("API key") || 
        e.originalMessage?.includes("API key")
      ) {
        console.warn("⚠️ [Mock AI Mode] No Google AI Studio API Key configured. Generating simulated profile...");
        output = {
          travelStyle: "Adventure",
          budgetRange: "Luxury",
          companion: "Solo",
          interests: ["hiking", "nature", "hot-air-balloon", "adventure"],
          personaDescription: "David is an active solo adventurer with premium tastes. He is excited about early morning hot air balloon rides and hiking mountain trails.",
        };
      } else {
        throw e;
      }
    }

    if (!output) {
      throw new Error("Failed to generate traveler profile from onboarding responses.");
    }

    const fullProfile: TravelerProfile = {
      userId: answers.userId,
      fullName: answers.fullName,
      travelStyle: output.travelStyle,
      budgetRange: output.budgetRange,
      companion: output.companion,
      interests: output.interests,
      personaDescription: output.personaDescription,
      createdAt: new Date().toISOString(),
    };

    // 1. Persist to Mock Firestore
    await firestoreMock.profiles.set(answers.userId, fullProfile);

    // 2. Sync to Neo4j Graph DB
    try {
      await syncUserProfileToGraph(fullProfile);
    } catch (graphError) {
      console.warn("⚠️ Warning: Failed to sync user to Neo4j. Is your local Neo4j database running?", graphError);
    }

    console.log(`✨ Profile analysis complete for user: ${answers.fullName}`);
    return fullProfile;
  }
);
