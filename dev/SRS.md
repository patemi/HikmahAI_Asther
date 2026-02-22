# Ekabot - Software Requirements Specification (SRS)

**Version:** 1.0  
**Date:** January 29, 2026  
**Author:** Astheron  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for Ekabot, an AI-powered chatbot API server with a comprehensive management dashboard. The system provides chat memory management, knowledge base integration via RAG (Retrieval Augmented Generation), and administrative controls for configuration.

### 1.2 Scope
Ekabot is a full-stack application that enables:
- RESTful API endpoints for chatbot interactions
- Admin dashboard for system configuration
- Knowledge base management with semantic search
- Per-user chat memory isolation
- Multi-model AI support (text and image)

### 1.3 Definitions
| Term | Definition |
|------|------------|
| RAG | Retrieval Augmented Generation - enhancing LLM responses with relevant knowledge |
| Participant | External user interacting with the chatbot via API |
| Memory | Recent chat history included as context for AI responses |
| Knowledge | Text documents chunked and embedded for semantic search |
| Bearer Token | API authentication credential |

---

## 2. System Overview

### 2.1 Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Client Applications                     │
│              (Mobile Apps, Web Apps, Integrations)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (Bearer Token Auth)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Ekabot Server                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Chat API   │  │  Auth API   │  │  Admin Dashboard    │  │
│  │  /api/chat  │  │  /api/auth  │  │  /dashboard/*       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                              │                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Core Services                     │    │
│  │  • OpenAI Integration (GPT-4.1-nano, GPT-4.1)       │    │
│  │  • RAG Engine (text-embedding-3-small)              │    │
│  │  • Memory Management                                 │    │
│  │  • Knowledge Chunking & Embedding                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL 17 + pgvector                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐  │
│  │   users    │ │app_config  │ │ chat_*     │ │knowledge_│  │
│  │            │ │            │ │ messages   │ │ chunks   │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Tech Stack
| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Framework | Next.js 16.x (App Router, Turbopack) |
| Database | PostgreSQL 17 with pgvector extension |
| ORM | Drizzle ORM |
| AI Provider | OpenAI API |
| Text Model | gpt-4.1-nano (default), configurable |
| Image Model | gpt-4.1 (default), configurable |
| Embedding Model | text-embedding-3-small (1536 dimensions) |
| Styling | Tailwind CSS 4.x |
| Authentication | Cookie-based sessions (dashboard), Bearer token (API) |

---

## 3. Functional Requirements

### 3.1 Authentication System

#### FR-3.1.1 Dashboard Login
- Single admin user authentication
- Credentials configurable via environment variables
- Default: username=`aron`, password=`admin`
- No session timeout (persistent login)
- Cookie-based session management

#### FR-3.1.2 API Authentication
- Bearer token authentication for all API endpoints
- Token configurable via `.env` or dashboard
- Token stored as bcrypt hash in database
- Unauthorized requests return HTTP 401

### 3.2 Chat API

#### FR-3.2.1 Chat Endpoint
**Endpoint:** `POST /api/chat`

**Request Schema:**
```typescript
{
  participantId: string;    // Required - unique identifier for the user
  message: string;          // Required - user's message
  userName?: string;        // Optional - display name for the user
  imageUrl?: string;        // Optional - URL of image for analysis
  saveHistory?: boolean;    // Optional - default true, set false for demo mode
}
```

**Response:** Server-Sent Events (SSE) stream
```
data: {"content": "Hello"}
data: {"content": " there!"}
data: [DONE]
```

#### FR-3.2.2 Model Selection
- Text-only messages: Use configured text model (default: gpt-4.1-nano)
- Messages with images: Use configured image model (default: gpt-4.1)
- Models configurable via dashboard

#### FR-3.2.3 Memory Management
- Store all messages in database per participant
- Include configurable number of recent message pairs as context
- Memory length configurable (default: 5 pairs = 10 messages)
- Memory isolated per participant ID

#### FR-3.2.4 RAG Integration
- When enabled, retrieve relevant knowledge chunks
- Configurable parameters:
  - Top K results (default: 5)
  - Minimum similarity score (default: 70%)
- Knowledge context appended to system prompt

#### FR-3.2.5 Chat History API
**Endpoint:** `GET /api/chat/history?participantId={id}`
- Returns conversation history for a participant
- Requires bearer token authentication

**Endpoint:** `DELETE /api/chat/history`
- Deletes conversation history for a participant
- Request body: `{ "participantId": string }`

### 3.3 Knowledge Base Management

#### FR-3.3.1 Document Management
- Create, read, update, delete knowledge documents
- Each document has:
  - Title (required)
  - Content (plain text, required)
  - Source (optional metadata)

#### FR-3.3.2 Chunking Strategy
- Split documents into chunks of ~500 characters
- Maintain chunk order with index
- Re-chunk on document update

#### FR-3.3.3 Embedding Generation
- Generate embeddings using text-embedding-3-small (1536 dimensions)
- Store embeddings in pgvector column
- Re-embed when embedding model changes (warning displayed)

#### FR-3.3.4 Semantic Search
- Use cosine similarity for vector search
- HNSW index for efficient retrieval
- Filter by minimum score threshold

### 3.4 Admin Dashboard

#### FR-3.4.1 Dashboard Home
Display:
- Total participants count
- Total messages count
- Knowledge documents count
- Memory length setting
- Bot configuration summary (name, models, RAG status)
- Quick links to other sections

#### FR-3.4.2 Configuration Page
**Bot Identity:**
- Bot name
- Bot personality description
- System prompt (textarea)

**Model Settings:**
- OpenAI API key (optional override)
- Text model selector
- Image model selector
- Embedding model selector (with warning about re-embedding)

**RAG Settings:**
- Enable/disable RAG toggle
- Memory length (message pairs)
- Top K results
- Minimum score percentage

**API Settings:**
- View current bearer token
- Set new bearer token (hashed storage)

#### FR-3.4.3 Knowledge Page
- List all knowledge documents with metadata
- Add new document form
- Edit existing document
- Delete document with confirmation
- Show chunk count per document

#### FR-3.4.4 Chat History Page
- List all participants with last activity
- View individual conversation
- Delete participant chat history
- Display message metadata (tokens, timestamps)

#### FR-3.4.5 API Documentation Page
- Interactive documentation
- Show/hide bearer token
- cURL examples for all endpoints
- Download as Markdown file

#### FR-3.4.6 Settings Page
- Update admin profile (name, email)
- Change password
- View username (read-only)

#### FR-3.4.7 Demo/Playground Page
- Test chat interface
- Configure user name
- Image URL input support
- Ephemeral mode (doesn't save to history)
- New chat button to reset

### 3.5 User Interface Requirements

#### FR-3.5.1 Design System
- Light/dark mode with system preference detection
- Stone color palette (neutral, professional)
- Responsive layout (mobile-friendly)
- Toast notifications (floating, auto-dismiss)

#### FR-3.5.2 Navigation
- Sidebar navigation with icons
- Collapsible on mobile
- Active state indication
- Theme toggle

---

## 4. Non-Functional Requirements

### 4.1 Performance
- NFR-4.1.1: Chat API response time < 500ms to first token
- NFR-4.1.2: Dashboard page load < 2 seconds
- NFR-4.1.3: Vector search < 100ms for 10,000 chunks

### 4.2 Security
- NFR-4.2.1: Passwords hashed with bcrypt (cost factor 10)
- NFR-4.2.2: API tokens hashed with bcrypt
- NFR-4.2.3: Session cookies HTTP-only, secure in production
- NFR-4.2.4: CORS configurable via environment variable
- NFR-4.2.5: Input validation with Zod schemas

### 4.3 Scalability
- NFR-4.3.1: Support 100+ concurrent API requests
- NFR-4.3.2: Handle 1M+ messages in database
- NFR-4.3.3: Support 100,000+ knowledge chunks

### 4.4 Reliability
- NFR-4.4.1: Graceful error handling with user-friendly messages
- NFR-4.4.2: Database connection pooling
- NFR-4.4.3: Automatic reconnection on database failure

### 4.5 Maintainability
- NFR-4.5.1: TypeScript for type safety
- NFR-4.5.2: Drizzle ORM for database migrations
- NFR-4.5.3: Modular code structure

---

## 5. Database Schema

### 5.1 Tables

#### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| email | TEXT | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| name | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### app_config
| Column | Type | Default |
|--------|------|---------|
| id | UUID | PK |
| bot_name | TEXT | "Ekabot" |
| bot_personality | TEXT | "friendly and helpful" |
| system_prompt | TEXT | "You are a helpful assistant." |
| api_key_hash | TEXT | |
| openai_api_key | TEXT | |
| text_model | TEXT | "gpt-4.1-nano" |
| image_model | TEXT | "gpt-4.1" |
| embedding_model | TEXT | "text-embedding-3-small" |
| rag_enabled | BOOLEAN | false |
| rag_top_k | INTEGER | 5 |
| rag_min_score | INTEGER | 70 |
| memory_length | INTEGER | 5 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### chat_participants
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| external_id | TEXT | UNIQUE, NOT NULL |
| name | TEXT | |
| metadata | JSONB | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### chat_messages
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| participant_id | UUID | FK → chat_participants |
| role | TEXT | "user" or "assistant" |
| content | TEXT | NOT NULL |
| image_url | TEXT | |
| image_analysis | TEXT | |
| prompt_tokens | INTEGER | |
| completion_tokens | INTEGER | |
| created_at | TIMESTAMP | |

#### knowledge_documents
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| title | TEXT | NOT NULL |
| content | TEXT | NOT NULL |
| source | TEXT | |
| metadata | JSONB | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### knowledge_chunks
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| document_id | UUID | FK → knowledge_documents |
| content | TEXT | NOT NULL |
| embedding | VECTOR(1536) | |
| chunk_index | INTEGER | NOT NULL |
| created_at | TIMESTAMP | |

#### sessions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| expires_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | |

---

## 6. API Specification

### 6.1 Authentication
All API endpoints require:
```
Authorization: Bearer <token>
```

### 6.2 Endpoints

#### POST /api/chat
Send a message and receive streaming response.

**Request:**
```json
{
  "participantId": "user-123",
  "message": "Hello!",
  "userName": "John",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:** SSE stream with JSON chunks

#### GET /api/chat/history
Get conversation history.

**Query Parameters:**
- `participantId` (required): User identifier
- `limit` (optional): Max messages (default 50)

#### DELETE /api/chat/history
Delete conversation history.

**Request:**
```json
{
  "participantId": "user-123"
}
```

#### POST /api/auth/login
Dashboard authentication (cookie-based).

#### POST /api/auth/logout
End dashboard session.

---

## 7. Environment Configuration

### 7.1 Required Variables
```env
DATABASE_URL=postgresql://user:pass@host:port/db
OPENAI_API_KEY=sk-...
SESSION_SECRET=random-string
```

### 7.2 Optional Variables
```env
DEFAULT_USERNAME=aron
DEFAULT_PASSWORD=admin
BEARER_TOKEN=your-token
MEMORY_LENGTH=5
CORS_ORIGIN=*
```

---

## 8. Deployment

### 8.1 Development
```bash
# Install dependencies
bun install

# Push database schema
bun run db:push

# Start dev server
bun run dev
```

### 8.2 Docker Production
```bash
# Build and run
docker compose up -d

# Or build image manually
docker build -t ekabot .
```

### 8.3 Requirements
- PostgreSQL 17 with pgvector extension
- Bun runtime
- OpenAI API access

---

## 9. Appendices

### A. Supported Models
| Type | Models |
|------|--------|
| Text | gpt-4.1-nano, gpt-4.1-mini, gpt-4.1, gpt-4o, gpt-4o-mini |
| Image | gpt-4.1, gpt-4o, gpt-4o-mini |
| Embedding | text-embedding-3-small, text-embedding-3-large, text-embedding-ada-002 |

### B. Error Codes
| Code | Description |
|------|-------------|
| 400 | Invalid request body |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Resource not found |
| 500 | Internal server error |

### C. Changelog
- v1.0 (2026-01-29): Initial release
