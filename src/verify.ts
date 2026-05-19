import { seedDatabase } from "./seed";
import { analyzeProfileFlow } from "./onboarding";
import { travelAssistantFlow } from "./agent";
import { closeNeo4j } from "./neo4j";

// Shim to invoke the flows directly programmatically
async function runVerification() {
  console.log("🏁 Starting End-to-End Verification of TravelAnatolia V2 Backend...");

  // Step 1: Seed Catalog & Mock Users
  console.log("\n--- Step 1: Seeding Catalog & Users ---");
  await seedDatabase();

  // Step 2: Run Onboarding Questionnaire for a New User
  console.log("\n--- Step 2: Running Onboarding Questionnaire ---");
  const onboardingInput = {
    userId: "user_david",
    fullName: "David Beckham",
    travelStyle: "I love active adventures and hiking, but also enjoy high-quality culinary experiences.",
    budget: "I have a high budget and prefer premium luxury options where possible.",
    companion: "I will be traveling solo on this journey.",
    activities: "I want to do sunrise hot air ballooning, active hiking in scenic valleys, and rooftop fine dining at night.",
  };

  const profile = await analyzeProfileFlow(onboardingInput);
  console.log("\nGenerated Traveler Profile:", JSON.stringify(profile, null, 2));

  // Step 3: Run Interactive Chat Session with ANA
  console.log("\n--- Step 3: Starting Chat Session with ANA ---");
  const sessionId = `session_${Math.random().toString(36).substr(2, 9)}`;

  // Turn 1: Welcome and profile check + recommendation query
  console.log("\n[User -> ANA]: Hi ANA! I am David. Can you fetch my profile and recommend some experiences for my upcoming trip?");
  const turn1 = await travelAssistantFlow({
    userId: "user_david",
    sessionId,
    message: "Hi ANA! I am David. Can you fetch my profile and recommend some experiences for my upcoming trip?",
  });
  console.log(`\n[ANA]: ${turn1.responseMessage}`);

  // Turn 2: Book the recommended experience
  console.log("\n[User -> ANA]: That balloon flight sounds amazing! Can you book it for me for tomorrow (2026-05-20) for the 05:00 sunrise slot?");
  const turn2 = await travelAssistantFlow({
    userId: "user_david",
    sessionId,
    message: "That balloon flight sounds amazing! Can you book it for me for tomorrow (2026-05-20) for the 05:00 sunrise slot?",
  });
  console.log(`\n[ANA]: ${turn2.responseMessage}`);

  console.log("\n🎉 End-to-End Verification Script Completed.");
}

runVerification()
  .catch((err) => console.error("❌ Verification failed:", err))
  .finally(() => closeNeo4j());
