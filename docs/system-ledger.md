# System Ledger - Marketing AI Agents

## Overview
Multi-agent system for marketing strategy and content creation using Google Gemini API.

---

## Architecture

```
Frontend (Next.js) → API Routes → Agent Functions → Gemini 2.0 Flash
                                       ↓
                              Neon Postgres (Drizzle)
```

---

## Modules

### 1. Agents

#### Gemini Client
- **Location**: `src/services/agents/gemini-client.ts`
- **Purpose**: Initializes Google Gemini AI client
- **Model**: `gemini-2.0-flash`
- **Dependencies**: `@google/genai`

#### Strategy Agent
- **Location**: `src/services/agents/strategy-agent.ts`
- **Purpose**: Analyzes knowledge base and creates marketing strategy
- **Model**: Gemini 2.0 Flash
- **Input**: Knowledge base text (brand info, products, target audience)
- **Output**: Complete marketing strategy (target audience, brand voice, content pillars, goals, key messages)
- **Function**: `runStrategyAgent(knowledgeBase: string) → Promise<string>`

#### Content Agent
- **Location**: `src/services/agents/content-agent.ts`
- **Purpose**: Creates social media posts based on strategy
- **Model**: Gemini 2.0 Flash
- **Input**: Marketing strategy + Knowledge base
- **Output**: Array of 3 social media posts with hashtags
- **Function**: `runContentAgent(strategy: string, knowledgeBase: string) → Promise<string[]>`

---

### 2. API Routes

#### POST /api/agents/strategy
- **Location**: `src/app/api/agents/strategy/route.ts`
- **Runtime**: Node.js
- **Input**: `{ knowledgeBase: string }`
- **Output**: `{ success: boolean, strategy: string }`
- **Validation**: Zod schema, min 10 characters

#### POST /api/agents/content
- **Location**: `src/app/api/agents/content/route.ts`
- **Runtime**: Node.js
- **Input**: `{ strategy: string, knowledgeBase: string }`
- **Output**: `{ success: boolean, posts: string[] }`
- **Validation**: Zod schema, min 10 characters each

---

### 3. Database Schema

**Location**: `src/db/schema.ts`

| Table | Purpose |
|-------|---------|
| `knowledge_base` | Stores uploaded knowledge base entries |
| `strategies` | Stores generated marketing strategies |
| `posts` | Stores generated social media posts |
| `agent_runs` | Logs agent executions for debugging |

---

### 4. UI Components

#### Main Page
- **Location**: `src/app/page.tsx`
- **Features**:
  - Knowledge base textarea input
  - Run agents button
  - Real-time agent status indicators
  - Strategy display panel
  - Posts display panel
- **State Management**: React useState
- **Notifications**: Sonner toast

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `GOOGLE_API_KEY` | Google Gemini API key (from aistudio.google.com) |

---

## Flow

1. User enters knowledge base (brand info)
2. Clicks "Run Agents"
3. Strategy Agent analyzes → outputs strategy
4. Content Agent receives strategy → outputs 3 posts
5. Results displayed in UI

---

## Dependencies

- `@google/genai` - Google Gemini SDK
- `@neondatabase/serverless` - Serverless Postgres
- `drizzle-orm` - Type-safe ORM
- `zod` - Schema validation
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `tailwindcss` - Styling

---

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Get Gemini API key from https://aistudio.google.com/apikey
4. Get Neon Postgres connection string from https://console.neon.tech
5. Fill in environment variables
6. Run `npm install`
7. Run `npm run db:push` to create database tables
8. Run `npm run dev` to start development server
