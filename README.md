# Jawara WhatsApp Admin

A self-hosted WhatsApp business automation platform. It combines an AI-powered responder, order management, a document knowledge base (RAG), and a scheduled reminder/broadcast engine — all running locally via Docker Compose.

## Architecture

```
WhatsApp Customer
       │
       ▼
  ┌─────────┐    webhooks    ┌──────────────────────────────────┐
  │  WAHA   │◄──────────────►│  n8n (Workflow Automation)       │
  │ :3000   │                │  :5678                           │
  └─────────┘                │  Phase 1 — AI Responder (RAG)    │
                             │  Phase 1 — Doc Indexer           │
                             │  Phase 2 — Order Intake          │
                             │  Phase 3 — Reminders & Broadcast │
                             └────────────┬────────┬────────────┘
                                          │        │
                              ┌───────────▼──┐  ┌──▼──────────┐
                              │  Backend API │  │   Qdrant     │
                              │  Hapi.js     │  │  (Vector DB) │
                              │  :4000       │  │  :6333       │
                              └──────┬───────┘  └─────────────┘
                                     │
                              ┌──────▼───────┐
                              │   MongoDB    │
                              │   :27017     │
                              └─────────────┘
```

| Service | Technology | Role |
|---------|-----------|------|
| **WAHA** | devlikeapro/waha (NOWEB engine) | WhatsApp HTTP API — send & receive messages |
| **n8n** | n8nio/n8n + LangChain | Workflow automation & AI orchestration |
| **Backend** | Node.js 20 / Hapi.js | REST API for orders, reminders, broadcasts |
| **Qdrant** | qdrant/qdrant | Vector store for RAG (document embeddings) |
| **MongoDB** | mongo:7 | Persistent storage for all business data |

## Features

- **AI Responder** — GPT-4o-mini answers customer WhatsApp messages in Bahasa Indonesia, backed by a RAG knowledge base
- **Order Intake** — AI extracts order details from conversation and saves them via the backend API
- **Document Indexer** — Upload PDFs/Word docs to populate the knowledge base (chunked, embedded, stored in Qdrant)
- **Reminders** — Schedule per-customer messages that are sent automatically via WhatsApp
- **Broadcast** — Create recipient lists and schedule bulk WhatsApp message jobs
- **Calendar & Reports** — View orders by day/month and generate daily/weekly/monthly sales reports

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2
- An OpenAI API key (for GPT-4o-mini and text-embedding-3-small)
- A WhatsApp account to connect to WAHA

## Quick Start

### 1. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# ─── WAHA ────────────────────────────────────────────────────────────────────
WAHA_API_KEY=your_waha_api_key
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=your_dashboard_password

# ─── n8n ─────────────────────────────────────────────────────────────────────
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_n8n_password
N8N_ENCRYPTION_KEY=                    # generate: openssl rand -hex 32

# ─── MongoDB ──────────────────────────────────────────────────────────────────
MONGO_USERNAME=jawara
MONGO_PASSWORD=your_mongo_password

# ─── Backend API ──────────────────────────────────────────────────────────────
BACKEND_API_KEY=your_backend_api_key
```

> OpenAI API keys and other AI credentials are configured inside the n8n UI (Credentials), not in `.env`.

### 2. Start All Services

```bash
docker compose up -d
```

### 3. Connect WhatsApp

1. Open the WAHA dashboard at **http://localhost:3000/dashboard**
2. Log in with `WAHA_DASHBOARD_USERNAME` / `WAHA_DASHBOARD_PASSWORD`
3. Start a session and scan the QR code with your WhatsApp

### 4. Import n8n Workflows

1. Open n8n at **http://localhost:5678**
2. Log in with `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD`
3. Go to **Workflows → Import** and import each file from `n8n-workflows/`:
   - `phase1-doc-indexer.json`
   - `phase1-ai-responder.json`
   - `phase2-order-intake.json`
   - `phase3-reminders-broadcast.json`
4. Configure credentials in each workflow:
   - **OpenAI** — API key for GPT-4o-mini and embeddings
   - **Qdrant** — `http://qdrant:6333` (no API key needed inside Docker network)
   - **Backend** — `http://backend:4000`, header `x-api-key: <BACKEND_API_KEY>`
   - **WAHA** — `http://waha:3000`, header `X-Api-Key: <WAHA_API_KEY>`
5. Activate all four workflows

### 5. Index Your Business Documents (Optional but Recommended)

Upload a PDF or Word document to populate the AI's knowledge base:

```bash
curl -X POST http://localhost:5678/webhook/index-docs \
  -F "data=@docs/knowledge-base-example.pdf"
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| WAHA Dashboard | http://localhost:3000/dashboard | `WAHA_DASHBOARD_USERNAME` / `WAHA_DASHBOARD_PASSWORD` |
| n8n | http://localhost:5678 | `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` |
| Backend API | http://localhost:4000 | Header: `x-api-key: <BACKEND_API_KEY>` |
| Qdrant | http://localhost:6333 | None |
| MongoDB | localhost:27017 | `MONGO_USERNAME` / `MONGO_PASSWORD` |

## Backend API Reference

All endpoints (except `/health`) require the header `x-api-key: <BACKEND_API_KEY>`.

### Health

```
GET /health
```

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Create an order |
| `GET` | `/orders` | List orders (filter: `status`, `clientPhone`, `from`, `to`, `page`, `limit`) |
| `GET` | `/orders/{id}` | Get a single order |
| `PUT` | `/orders/{id}` | Update an order |
| `DELETE` | `/orders/{id}` | Soft-delete an order |

**Order statuses**: `pending` → `confirmed` → `completed` / `cancelled`

### Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/calendar?month=YYYY-MM` | Monthly order overview grouped by day |
| `GET` | `/calendar/day?date=YYYY-MM-DD` | Orders for a specific delivery date |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports?type=monthly` | Sales report (`type`: `daily`, `weekly`, `monthly`) |

Response includes: `totalOrders`, `totalRevenue`, `statusBreakdown`, `topItems`.

### Reminders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/reminders` | Schedule a reminder (`recipientPhone`, `message`, `scheduledAt`, optional `orderId`) |
| `GET` | `/reminders/pending` | Reminders due now (polled by n8n Phase 3) |
| `GET` | `/reminders` | List all reminders (filter: `sent`) |
| `PUT` | `/reminders/{id}` | Mark as sent |
| `DELETE` | `/reminders/{id}` | Delete a reminder |

### Broadcast Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/broadcast/lists` | Create a recipient list |
| `GET` | `/broadcast/lists` | List all lists |
| `GET` | `/broadcast/lists/{id}` | Get a single list |
| `PUT` | `/broadcast/lists/{id}` | Update list |
| `DELETE` | `/broadcast/lists/{id}` | Delete list |

### Broadcast Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/broadcast/jobs` | Schedule a broadcast (`listId`, `message`, `scheduledAt`) |
| `GET` | `/broadcast/jobs/pending` | Jobs due now (polled by n8n Phase 3) |
| `GET` | `/broadcast/history` | All jobs (filter: `status`) |
| `PUT` | `/broadcast/jobs/{id}` | Update job status / counts |

**Job statuses**: `pending` → `sending` → `completed` / `failed`

## n8n Workflows

### Phase 1 — AI Responder

- **Trigger**: Incoming WhatsApp message webhook from WAHA
- Filters out own messages (`fromMe`)
- Passes conversation to a LangChain AI Agent (GPT-4o-mini) with:
  - RAG tool backed by Qdrant (`business-docs` collection)
  - Conversation memory (10-message window per customer)
- Replies to customer via WAHA
- Responds in Bahasa Indonesia by default; switches to English if customer writes English

### Phase 1 — Document Indexer

- **Trigger**: `POST /webhook/index-docs` with a file upload
- Parses PDF or Word document, splits into 500-char chunks (50-char overlap)
- Embeds chunks with OpenAI `text-embedding-3-small`
- Stores vectors in Qdrant `business-docs` collection

### Phase 2 — Order Intake

- **Trigger**: `POST /webhook/extract-order` (called as a tool by the AI Agent)
- Uses GPT-4o-mini (`temperature=0`) to extract structured order fields from conversation text
- Creates the order via the backend `POST /orders` endpoint
- Returns order ID and confirmation message to the AI Agent

### Phase 3 — Reminders & Broadcast Scheduler

- **Trigger**: Every 5 minutes (cron)
- Runs two parallel pipelines:
  - **Reminders**: fetches `/reminders/pending`, sends each via WAHA, marks sent
  - **Broadcast**: fetches `/broadcast/jobs/pending`, sends to all recipients in the list via WAHA, updates job with sent/failed counts

## Data Models

### Order
```
clientPhone*, clientName, items[{ name, qty, price }],
totalAmount, orderDate, deliveryDate*, status, notes, deletedAt
```

### Reminder
```
recipientPhone*, message*, scheduledAt*, orderId?, sent, sentAt
```

### BroadcastList
```
name*, recipientPhones[]
```

### BroadcastJob
```
listId*, message*, scheduledAt*, status,
totalRecipients, sentCount, failedCount, completedAt
```

## Stopping and Resetting

```bash
# Stop all services
docker compose down

# Stop and remove all data volumes (destructive)
docker compose down -v
```

## Project Structure

```
.
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── models/
│       │   ├── Order.js
│       │   ├── Reminder.js
│       │   ├── BroadcastList.js
│       │   └── BroadcastJob.js
│       ├── plugins/
│       │   ├── auth.js          # x-api-key authentication
│       │   └── db.js            # MongoDB / Mongoose connection
│       ├── routes/
│       │   ├── orders.js
│       │   ├── calendar.js
│       │   ├── reports.js
│       │   ├── reminders.js
│       │   └── broadcast.js
│       └── services/
│           └── waha.js          # WAHA HTTP client
└── n8n-workflows/
    ├── phase1-ai-responder.json
    ├── phase1-doc-indexer.json
    ├── phase2-order-intake.json
    └── phase3-reminders-broadcast.json
```
