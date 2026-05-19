import { firestoreMock } from "./firestoreMock";
import { syncExperienceToGraph, syncUserProfileToGraph } from "./graphSync";
import { Experience, TravelerProfile } from "./types";
import { closeNeo4j } from "./neo4j";

const MOCK_EXPERIENCES: Experience[] = [
  {
    id: "exp_balloon_cappadocia",
    name: "Cappadocia Hot Air Balloon Flight",
    description: "Float gently over Cappadocia's fairy chimneys at sunrise. Experience a panoramic 360-degree view of the dramatic rock formations followed by a traditional champagne toast.",
    category: "adventure",
    location: "Göreme, Cappadocia",
    priceUSD: 250,
    tags: ["hot-air-balloon", "sunrise", "panoramic", "adventure", "nature"],
    availability: {
      maxCapacity: 16,
      slots: ["05:00", "06:30"],
    },
  },
  {
    id: "exp_goreme_museum",
    name: "Göreme Open-Air Museum Cave Church Tour",
    description: "Explore a vast monastic complex of rock-cut churches, chapels, and monasteries, featuring beautifully preserved Byzantine frescoes dating from the 10th to 12th centuries.",
    category: "history",
    location: "Göreme, Cappadocia",
    priceUSD: 30,
    tags: ["museums", "caves", "churches", "history", "art"],
    availability: {
      maxCapacity: 25,
      slots: ["09:00", "11:00", "14:00"],
    },
  },
  {
    id: "exp_cooking_class",
    name: "Traditional Anatolian Cooking Class & Wine Tasting",
    description: "Learn to prepare traditional home-cooked Turkish meals in a cave kitchen, using fresh, locally sourced ingredients. Paired with fine local Cappadocia wines.",
    category: "food",
    location: "Uçhisar, Cappadocia",
    priceUSD: 85,
    tags: ["cooking", "local-food", "wine", "culinary", "experience"],
    availability: {
      maxCapacity: 8,
      slots: ["11:30", "18:00"],
    },
  },
  {
    id: "exp_turkish_hamam",
    name: "Historic Turkish Bath (Hamam) Experience",
    description: "Pamper yourself with a luxurious foam massage and exfoliating scrub inside a beautiful, dome-ceilinged Ottoman-era bathhouse built in the 16th century.",
    category: "relaxation",
    location: "Sultanahmet, Istanbul",
    priceUSD: 90,
    tags: ["spa", "relaxation", "hamam", "wellness", " Ottoman"],
    availability: {
      maxCapacity: 12,
      slots: ["10:00", "13:00", "16:00", "19:00"],
    },
  },
  {
    id: "exp_bosphorus_sunset",
    name: "Luxury Bosphorus Sunset Yacht Cruise",
    description: "Sail along the Bosphorus Strait dividing Europe and Asia. Enjoy stunning sunset views of Istanbul's historic mansions, palaces, and minarets with refreshments.",
    category: "relaxation",
    location: "Beşiktaş, Istanbul",
    priceUSD: 120,
    tags: ["cruise", "sunset", "istanbul", "scenic", "relaxation"],
    availability: {
      maxCapacity: 20,
      slots: ["18:00"],
    },
  },
  {
    id: "exp_hiking_rose_valley",
    name: "Guided Hiking Tour of Rose & Red Valleys",
    description: "Hike through Cappadocia's most colorful valleys, discovering hidden rock-cut pigeon houses, vineyards, and ancient churches along the way. Includes a sunset viewpoint finish.",
    category: "adventure",
    location: "Cavusin, Cappadocia",
    priceUSD: 45,
    tags: ["hiking", "nature", "caves", "adventure", "active"],
    availability: {
      maxCapacity: 15,
      slots: ["15:30"],
    },
  },
  {
    id: "exp_derinkuyu_underground",
    name: "Derinkuyu Deep Underground City Exploration",
    description: "Descend into Turkey's deepest excavated underground city, which once housed up to 20,000 people fleeing persecution. Explore ventilation shafts, stables, and chapels.",
    category: "history",
    location: "Derinkuyu, Cappadocia",
    priceUSD: 40,
    tags: ["history", "caves", "underground", "adventure", "archaeology"],
    availability: {
      maxCapacity: 20,
      slots: ["10:00", "13:30"],
    },
  },
  {
    id: "exp_fine_dining",
    name: "Rooftop Fine Dining at Mikla",
    description: "Savor a multi-course New Anatolian tasting menu featuring cutting-edge culinary techniques, served alongside breath-taking panoramic views of the illuminated Istanbul skyline.",
    category: "food",
    location: "Beyoğlu, Istanbul",
    priceUSD: 180,
    tags: ["fine-dining", "rooftop", "culinary", "istanbul", "modern-turkish"],
    availability: {
      maxCapacity: 30,
      slots: ["19:30", "21:30"],
    },
  },
];

const MOCK_USERS: TravelerProfile[] = [
  {
    userId: "user_alice",
    fullName: "Alice Smith",
    travelStyle: "Adventure",
    budgetRange: "Moderate",
    companion: "Solo",
    interests: ["hiking", "nature", "hot-air-balloon", "adventure", "caves"],
    personaDescription: "Alice is an intrepid solo hiker who loves chasing sunrises and exploring rugged trails. She prefers active outdoor activities over relaxing spas.",
    createdAt: new Date().toISOString(),
  },
  {
    userId: "user_bob",
    fullName: "Bob Johnson",
    travelStyle: "Culinary",
    budgetRange: "Luxury",
    companion: "Partner",
    interests: ["fine-dining", "wine", "culinary", "sunset", "relaxation"],
    personaDescription: "Bob travels with his partner to indulge in gourmet tasting menus and scenic cruises. He enjoys high-end culinary excursions and relaxing visual experiences.",
    createdAt: new Date().toISOString(),
  },
  {
    userId: "user_clara",
    fullName: "Clara Garcia",
    travelStyle: "History",
    budgetRange: "Budget",
    companion: "Friends",
    interests: ["history", "museums", "caves", "archaeology", "hiking"],
    personaDescription: "Clara is a budget-conscious backpacker exploring with her friends. She is passionate about ancient civilizations, underground caves, and local archaeological museums.",
    createdAt: new Date().toISOString(),
  },
];

export async function seedDatabase() {
  console.log("🌱 Starting Database Seeding...");

  // 1. Seed Experiences to Firestore Mock & Neo4j
  for (const exp of MOCK_EXPERIENCES) {
    await firestoreMock.experiences.set(exp.id, exp);
    try {
      await syncExperienceToGraph(exp);
    } catch (err) {
      console.warn(`Failed to sync experience ${exp.id} to Neo4j.`, err);
    }
  }

  // 2. Seed Users to Firestore Mock & Neo4j
  for (const user of MOCK_USERS) {
    await firestoreMock.profiles.set(user.userId, user);
    try {
      await syncUserProfileToGraph(user);
    } catch (err) {
      console.warn(`Failed to sync user ${user.userId} to Neo4j.`, err);
    }
  }

  console.log("🌱 Database Seeding Completed Successfully.");
}

// Run the script directly if executed
if (require.main === module) {
  seedDatabase()
    .catch((err) => console.error("Error seeding database:", err))
    .finally(() => closeNeo4j());
}
