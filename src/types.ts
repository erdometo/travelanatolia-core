export interface TravelerProfile {
  userId: string;
  fullName: string;
  travelStyle: "Adventure" | "History" | "Culinary" | "Relaxation" | string;
  budgetRange: "Budget" | "Moderate" | "Luxury" | string;
  companion: "Solo" | "Partner" | "Family" | "Friends" | string;
  interests: string[]; // e.g. ["hiking", "museums", "cappadocia", "wine tasting"]
  personaDescription: string; // Rich, AI-generated summary describing the user's travel persona
  createdAt: string;
}

export interface Experience {
  id: string;
  name: string;
  description: string;
  category: "adventure" | "history" | "food" | "culture" | "relaxation" | string;
  location: string; // e.g. "Göreme, Cappadocia" or "Sultanahmet, Istanbul"
  priceUSD: number;
  tags: string[]; // e.g. ["hot-air-balloon", "sunset", "cave", "hiking", "fine-dining"]
  availability: {
    maxCapacity: number;
    slots: string[]; // e.g. ["09:00", "14:00", "19:00"]
  };
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  experienceId: string;
  experienceName: string;
  bookingDate: string;
  slot: string;
  partySize: number;
  totalPriceUSD: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}
