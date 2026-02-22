# Asther - AI Chatbot API with Management Dashboard

A full-stack AI chatbot solution with knowledge base management, memory isolation per user, and a comprehensive admin dashboard.

![Workflow](figures/workflow.png)

## Features

- **Chat API** - RESTful endpoint with bearer token authentication and streaming support
- **Memory Isolation** - Each user's chat history is isolated by phone number
- **Knowledge Base** - RAG-powered responses using pgvector for semantic search
- **Admin Dashboard** - Configure LLM, manage knowledge, view chat history
- **Multi-model Support** - Uses gpt-4.1-nano for text, gpt-4.1 for images
- **Demo Mode** - Test the chatbot with ephemeral (non-persistent) conversations

## Architecture

```
asther/
├── src/
│   ├── app/
│   │   ├── api/          # Next.js API routes (chat, auth)
│   │   ├── dashboard/    # Admin dashboard pages
│   │   └── login/        # Authentication page
│   ├── components/       # React components
│   └── lib/
│       ├── db/           # Drizzle ORM schema and client
│       └── utils/        # Utilities, auth, RAG
├── public/               # Static assets
└── drizzle/              # Database migrations
```

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16.1.6 with Turbopack (App Router)
- **Database**: PostgreSQL 17 with pgvector extension
- **ORM**: Drizzle ORM
- **AI**: OpenAI (gpt-4.1-nano for text, gpt-4.1 for images, text-embedding-3-small for embeddings)
- **Styling**: Tailwind CSS

---

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) installed
- [Docker](https://docker.com) installed
- OpenAI API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd asther
```

### 2. Start Database

```bash
cd postgres
docker compose up -d
cd ..
```

This starts PostgreSQL with pgvector on port 5433.

### 3. Configure Environment

```bash
cd asther
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database
DATABASE_URL=postgresql://astheron:supersmart@localhost:5433/asther

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Admin Credentials (first run only)
DEFAULT_USERNAME=asther
DEFAULT_PASSWORD=admin

# Session
SESSION_SECRET=your-random-session-secret-at-least-32-chars

# Optional
MEMORY_LENGTH=5
CORS_ORIGIN=*
```

### 4. Install Dependencies

```bash
bun install
```

### 5. Setup Database Schema

```bash
bun run db:push
```

### 6. Start Development Server

```bash
bun run dev
```

Visit http://localhost:3000 to access the dashboard.

Default login:
- **Username**: Value of `DEFAULT_USERNAME` (default: `asther`)
- **Password**: Value of `DEFAULT_PASSWORD` (default: `admin`)

---

## Docker Deployment

### Quick Start

Deploy the entire stack with a single command:

```bash
# From root directory (not asther/)
docker compose up -d
```

This starts:
- PostgreSQL with pgvector on port 5435 (container: `asther_postgre`)
- Asther web application on port 5000 (container: `asther-web`)

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key
SESSION_SECRET=your-random-session-secret-at-least-32-chars

# Optional - Database credentials
POSTGRES_USER=astheron
POSTGRES_PASSWORD=supersmart
POSTGRES_DB=asther

# Optional - Admin credentials (used on first run)
DEFAULT_USERNAME=asther
DEFAULT_PASSWORD=admin

# Optional - API settings
BEARER_TOKEN=asther_your_custom_token
MEMORY_LENGTH=5
CORS_ORIGIN=*
```

### Docker Commands

```bash
# Start services
docker compose up -d

# View logs
docker logs asther-web -f
docker logs asther_postgre -f

# Stop services
docker compose down

# Rebuild after code changes
docker compose build asther-web
docker compose up -d

# Full rebuild (no cache)
docker compose build --no-cache
docker compose up -d

# Remove volumes (WARNING: deletes all data)
docker compose down -v
```

### Production Considerations

1. **Change default credentials** - Set strong `DEFAULT_USERNAME` and `DEFAULT_PASSWORD`
2. **Secure SESSION_SECRET** - Use a cryptographically random string (32+ chars)
3. **CORS configuration** - Set `CORS_ORIGIN` to your frontend domain instead of `*`
4. **Database backups** - The postgres data is persisted in a Docker volume

---

## API Usage

### Authentication

All API requests require a Bearer token:

```
Authorization: Bearer asther_xxxxxxxxxxxxx
```

Get your token from Dashboard → Configuration → API Key.

### Chat Endpoint

**POST** `/api/chat`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | No | User's display name |
| `phonenumber` | string | Yes | Unique identifier for the user |
| `chat` | string | Yes | User's message |
| `has_image` | boolean | No | Whether the message contains an image |
| `image_url` | string | Conditional | URL of the image (required if `has_image` is true) |
| `ephemeral` | boolean | No | If true, don't persist the conversation |

#### Example Request

```json
{
  "username": "John Doe",
  "phonenumber": "+1234567890",
  "chat": "Hello, how can you help me?",
  "has_image": false
}
```

#### Example Response

```json
{
  "success": true,
  "response": "Hello! I'm Asther, your AI assistant...",
  "model": "gpt-4.1-nano",
  "usage": {
    "prompt_tokens": 125,
    "completion_tokens": 42,
    "total_tokens": 167
  }
}
```

### cURL Example

```bash
curl -X POST "http://localhost:5000/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "John",
    "phonenumber": "+1234567890",
    "chat": "Hello!"
  }'
```

### Image Analysis Example

```bash
curl -X POST "http://localhost:5000/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "John",
    "phonenumber": "+1234567890",
    "chat": "What is in this image?",
    "has_image": true,
    "image_url": "https://example.com/image.jpg"
  }'
```

---

## Dashboard Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview of conversations, RAG status, and token usage |
| **Configuration** | Set system prompt, bot persona, AI models, and RAG settings |
| **Knowledge** | Add/edit/delete knowledge documents (auto-chunked and embedded) |
| **History** | View all conversations, filter by user, delete chats |
| **Demo** | Test the chatbot with ephemeral conversations |
| **API Docs** | Interactive documentation with cURL examples |
| **Settings** | Change profile and password |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `SESSION_SECRET` | Cookie signing secret (32+ chars) | Required |
| `DEFAULT_USERNAME` | Initial admin email | `asther` |
| `DEFAULT_PASSWORD` | Initial admin password | `admin` |
| `MEMORY_LENGTH` | Chat messages to include as context | `5` |
| `BEARER_TOKEN` | API authentication token | Auto-generated |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |

---

## License

Proprietary - All Rights Reserved

See [LICENSE](LICENSE) for details.
