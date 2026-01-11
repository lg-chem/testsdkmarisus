# System Ledger - Marketing AI Agents

## Overview
Multi-agent system for marketing strategy and content creation using Google Gemini API with RAG (Retrieval Augmented Generation) and Google Search Grounding.

---

## Architecture

```
Frontend (Next.js) → API Routes → Agent Functions → Gemini 2.0 Flash (Vertex AI)
                          ↓                                ↓
                   RAG Service ←→ Neon Postgres (pgvector) → Embeddings
                          ↓
                   Google Search (Grounding)
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

### 2. RAG Services

#### Embeddings
- **Location**: `src/services/rag/embeddings.ts`
- **Purpose**: Generate text embeddings using Vertex AI
- **Model**: `text-embedding-004` (768 dimensions)
- **Functions**:
  - `generateEmbedding(text)` - Single text embedding
  - `generateEmbeddings(texts[])` - Batch embeddings
  - `splitIntoChunks(text)` - Split text for embedding

#### Document Processing
- **Location**: `src/services/rag/documents.ts`
- **Purpose**: Process and store documents with embeddings
- **Supported Types**: PDF, TXT, URL
- **Functions**:
  - `processDocument(filename, type, content)` - Upload and chunk document
  - `deleteDocument(id)` - Remove document and chunks
  - `listDocuments()` - List all documents

#### Search
- **Location**: `src/services/rag/search.ts`
- **Purpose**: Vector similarity search for RAG
- **Functions**:
  - `searchDocuments(query, limit, minSimilarity)` - Find relevant chunks
  - `buildContext(results)` - Build context string for AI

---

### 3. Chat Service

- **Location**: `src/services/chat/index.ts`
- **Purpose**: AI chat with RAG and Google Search integration
- **Features**:
  - Conversation history persistence
  - RAG context from uploaded documents
  - Google Search Grounding (Vertex AI)
- **Functions**:
  - `chat(message, options)` - Send message and get AI response
  - `createConversation()` - Start new conversation
  - `getConversationHistory(id)` - Get messages
  - `listConversations()` - List all conversations
  - `deleteConversation(id)` - Delete conversation

---

### 4. API Routes

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

#### Chat API
- **Location**: `src/app/api/chat/route.ts`
- **Runtime**: Node.js
- **Endpoints**:
  - `POST` - Send chat message with RAG/Grounding
  - `GET` - List conversations or get conversation history
  - `DELETE` - Delete conversation

#### Documents API
- **Location**: `src/app/api/documents/route.ts`
- **Runtime**: Node.js
- **Endpoints**:
  - `POST` - Upload document (PDF, TXT) or process URL
  - `GET` - List all documents
  - `DELETE` - Delete document

---

### 5. Database Schema

**Location**: `src/db/schema.ts`

| Table | Purpose |
|-------|---------|
| `knowledge_base` | Stores uploaded knowledge base entries |
| `strategies` | Stores generated marketing strategies |
| `posts` | Stores generated social media posts |
| `agent_runs` | Logs agent executions for debugging |
| `documents` | Uploaded documents (PDF, TXT, URL) |
| `document_chunks` | Document chunks with pgvector embeddings |
| `conversations` | Chat conversation metadata |
| `messages` | Chat messages in conversations |

**Note**: Requires pgvector extension for embeddings. Run `drizzle/setup-pgvector.sql` before migrations.

---

### 6. UI Components

#### Main Page (Agents)
- **Location**: `src/app/page.tsx`
- **Features**:
  - Knowledge base textarea input
  - Run agents button
  - Real-time agent status indicators
  - Strategy display panel
  - Posts display panel

#### Chat Page
- **Location**: `src/app/chat/page.tsx`
- **Features**:
  - Conversation sidebar with history
  - Real-time chat with AI
  - Toggle for Google Search (Grounding)
  - Toggle for document search (RAG)
  - New conversation / delete functionality

#### Documents Page
- **Location**: `src/app/documents/page.tsx`
- **Features**:
  - File upload (PDF, TXT)
  - URL processing
  - Document list with metadata
  - Delete documents

#### Navigation
- **Location**: `src/components/Navigation.tsx`
- **Tabs**: Agents, Chat, Documents

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `GOOGLE_API_KEY` | Google Gemini API key (for basic mode) |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID (for Vertex AI) |
| `GOOGLE_CLOUD_LOCATION` | Region (default: us-central1) |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Service Account JSON (for Vertex AI)

---

## Flow

1. User enters knowledge base (brand info)
2. Clicks "Run Agents"
3. Strategy Agent analyzes → outputs strategy
4. Content Agent receives strategy → outputs 3 posts
5. Results displayed in UI

---

## Dependencies

- `@google/genai` - Google Gemini/Vertex AI SDK
- `@neondatabase/serverless` - Serverless Postgres
- `drizzle-orm` - Type-safe ORM with pgvector support
- `pdf-parse` - PDF text extraction
- `cheerio` - HTML parsing for URL extraction
- `zod` - Schema validation
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `tailwindcss` - Styling

---

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Get Gemini API key from https://aistudio.google.com/apikey OR configure Vertex AI:
   - Create Service Account in Google Cloud Console
   - Download JSON key
   - Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` with the JSON content
   - Set `GOOGLE_CLOUD_PROJECT` with your project ID
4. Get Neon Postgres connection string from https://console.neon.tech
5. Enable pgvector extension in Neon (run `drizzle/setup-pgvector.sql`)
6. Fill in environment variables
7. Run `npm install`
8. Run `npm run db:push` to create database tables
9. Run `npm run dev` to start development server

## Vertex AI Features

When configured with Vertex AI (Service Account), you get:
- **Google Search Grounding**: AI can search the web for current information
- **RAG**: Search your uploaded documents for context
- **Full Vertex AI feature set**: Fine-tuning, Agent Builder, etc.
