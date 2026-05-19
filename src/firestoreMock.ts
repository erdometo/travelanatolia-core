import fs from "fs";
import path from "path";
import { TravelerProfile, Experience, ChatSession, Booking } from "./types";

const DB_DIR = path.join(__dirname, "../local_db");
const PROFILES_FILE = path.join(DB_DIR, "profiles.json");
const EXPERIENCES_FILE = path.join(DB_DIR, "experiences.json");
const SESSIONS_FILE = path.join(DB_DIR, "sessions.json");
const BOOKINGS_FILE = path.join(DB_DIR, "bookings.json");

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function readJSON<T>(filePath: string, defaultVal: T): T {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
    return defaultVal;
  }
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading database file: ${filePath}`, err);
    return defaultVal;
  }
}

function writeJSON<T>(filePath: string, data: T) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─────────────────────────────────────────────────────────────────
// Profiles Mock DB
// ─────────────────────────────────────────────────────────────────
export const firestoreMock = {
  profiles: {
    get: async (userId: string): Promise<TravelerProfile | null> => {
      const db = readJSON<Record<string, TravelerProfile>>(PROFILES_FILE, {});
      return db[userId] || null;
    },
    set: async (userId: string, profile: TravelerProfile): Promise<void> => {
      const db = readJSON<Record<string, TravelerProfile>>(PROFILES_FILE, {});
      db[userId] = profile;
      writeJSON(PROFILES_FILE, db);
    },
    list: async (): Promise<TravelerProfile[]> => {
      const db = readJSON<Record<string, TravelerProfile>>(PROFILES_FILE, {});
      return Object.values(db);
    }
  },

  experiences: {
    get: async (experienceId: string): Promise<Experience | null> => {
      const db = readJSON<Record<string, Experience>>(EXPERIENCES_FILE, {});
      return db[experienceId] || null;
    },
    set: async (experienceId: string, exp: Experience): Promise<void> => {
      const db = readJSON<Record<string, Experience>>(EXPERIENCES_FILE, {});
      db[experienceId] = exp;
      writeJSON(EXPERIENCES_FILE, db);
    },
    list: async (): Promise<Experience[]> => {
      const db = readJSON<Record<string, Experience>>(EXPERIENCES_FILE, {});
      return Object.values(db);
    }
  },

  sessions: {
    get: async (sessionId: string): Promise<ChatSession | null> => {
      const db = readJSON<Record<string, ChatSession>>(SESSIONS_FILE, {});
      return db[sessionId] || null;
    },
    set: async (sessionId: string, session: ChatSession): Promise<void> => {
      const db = readJSON<Record<string, ChatSession>>(SESSIONS_FILE, {});
      db[sessionId] = session;
      writeJSON(SESSIONS_FILE, db);
    }
  },

  bookings: {
    get: async (bookingId: string): Promise<Booking | null> => {
      const db = readJSON<Record<string, Booking>>(BOOKINGS_FILE, {});
      return db[bookingId] || null;
    },
    set: async (bookingId: string, booking: Booking): Promise<void> => {
      const db = readJSON<Record<string, Booking>>(BOOKINGS_FILE, {});
      db[bookingId] = booking;
      writeJSON(BOOKINGS_FILE, db);
    },
    list: async (): Promise<Booking[]> => {
      const db = readJSON<Record<string, Booking>>(BOOKINGS_FILE, {});
      return Object.values(db);
    }
  }
};
