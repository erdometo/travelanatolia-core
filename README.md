<p align="center">
  <img src="https://img.shields.io/badge/Genkit-1.33-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-LLM-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
</p>

# 🗺️ TravelAnatolia V2 — Agentic Core

> **The AI brain behind TravelAnatolia.** A hyper-personalized travel itinerary engine powered by Firebase Genkit and Google Gemini, delivering structured, multi-day travel plans for Türkiye and beyond.

---

## ✨ What It Does

You give it a natural-language prompt like:

```
"I want a 3-day history trip to Cappadocia"
```

It returns a **fully structured, validated JSON itinerary** — complete with daily plans, points of interest, time slots, insider tips, and packing recommendations.

No free-form text. No hallucinated formats. **Strict Zod schema enforcement** ensures every response is machine-parseable and ready for your frontend.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Flutter Client                       │
│              (TravelAnatolia Mobile App)                │
└─────────────────┬───────────────────────────────────────┘
                  │  POST /generateItineraryFlow
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Express Flow Server (:4000)                │
│                  @genkit-ai/express                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌───────────────────────────────────────────────┐     │
│   │          generateItineraryFlow                │     │
│   │                                               │     │
│   │  1. System Prompt (ANA persona)               │     │
│   │  2. ai.generate() → Gemini 2.5 Flash          │     │
│   │  3. Zod Validation (ItinerarySchema)          │     │
│   │  4. [TODO] Save → Firebase Data Connect       │     │
│   │  5. Return structured JSON                    │     │
│   └───────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 22+ / TypeScript 5.6 |
| **AI Framework** | [Firebase Genkit](https://firebase.google.com/docs/genkit) 1.33 |
| **LLM** | Google Gemini 2.5 Flash via `@genkit-ai/google-genai` |
| **Schema Validation** | Zod 3.x (strict structured output) |
| **Server** | Express via `@genkit-ai/express` |
| **Database** | Firebase Data Connect / PostgreSQL *(planned)* |

---

## 📐 Output Schema

Every response is validated against a strict 3-level Zod hierarchy:

```
Itinerary
├── tripTitle          → "Echoes of Ancient Anatolia"
├── destination        → "Cappadocia, Türkiye"
├── totalDays          → 3
├── overview           → "A deep dive into..."
├── bestTimeToVisit    → "April – June"
├── packingRecs[]      → ["Comfortable walking shoes", ...]
│
└── days[]
    ├── dayNumber      → 1
    ├── title          → "Underground Cities & Fairy Chimneys"
    ├── summary        → "Explore the surreal landscape..."
    │
    └── pointsOfInterest[]
        ├── name       → "Göreme Open-Air Museum"
        ├── description→ "A UNESCO World Heritage site..."
        ├── time       → "09:00 – 11:30"
        ├── category   → "history" | "nature" | "food" | ...
        ├── duration   → 150  (minutes)
        └── tips?      → "Arrive before 9 AM to avoid crowds"
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 22
- **Google AI Studio API Key** — get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Setup

```bash
# 1. Clone
git clone https://github.com/erdometo/travelanatolia-core.git
cd travelanatolia-core

# 2. Install dependencies
npm install

# 3. Configure your API key
cp .env.example .env
# Edit .env and paste your GOOGLE_GENAI_API_KEY

# 4. Start the Genkit Developer UI
npm run dev
```

The Genkit Dev UI opens at **http://localhost:4000** — use it to test the flow interactively.

### Production

```bash
npm run build      # Compile TypeScript → lib/
npm run start      # Start the Express server
```

---

## 🧪 Testing the Flow

### Via Genkit Dev UI

1. Run `npm run dev`
2. Open http://localhost:4000
3. Select `generateItineraryFlow`
4. Enter input:
   ```json
   {
     "userPrompt": "I want a 3-day history trip to Cappadocia"
   }
   ```
5. Hit **Run** — get a fully structured itinerary back

### Via cURL

```bash
curl -X POST http://localhost:4000/generateItineraryFlow \
  -H "Content-Type: application/json" \
  -d '{"data": {"userPrompt": "Plan a 5-day food and culture tour of Istanbul"}}'
```

---

## 📁 Project Structure

```
Agentic-Core/
├── src/
│   └── index.ts          # Genkit init, Zod schemas, flow definition, Express server
├── lib/                  # Compiled output (git-ignored)
├── package.json
├── tsconfig.json
├── .env.example          # API key template
├── .gitignore
└── README.md
```

---

## 🗺️ Roadmap

- [x] Genkit + Gemini integration with structured output
- [x] Strict Zod schema for multi-day itineraries
- [x] Express flow server with CORS
- [ ] Firebase Data Connect (PostgreSQL) persistence
- [ ] Authentication context injection (Firebase Auth)
- [ ] Multi-agent orchestration (transport, dining, accommodation sub-agents)
- [ ] Streaming responses for real-time itinerary generation
- [ ] Rate limiting and usage analytics

---

## 📄 License

Proprietary — All rights reserved.

---

<p align="center">
  Built with 🧡 for Anatolia
</p>
