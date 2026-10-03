# Chat PDF — RAG Backend Service

A Node.js microservice that lets users upload PDF documents and ask questions about their content. It uses Retrieval-Augmented Generation (RAG): text is extracted and chunked from the PDF, embedded with Google's Gemini embedding model, stored in Qdrant (a vector database), and retrieved at query time to ground the LLM's answers.

This service is designed to run as an **internal backend** — it does not expose a public user-facing API. All routes are protected by a shared secret key, and user identity is passed in via request headers, meaning it is expected to sit behind another service (e.g. an API gateway or a main application backend).

---

## How It Works

### Upload Flow

1. A PDF file is sent to `POST /api/internal/document/upload`.
2. The middleware validates the file (PDF only, max 10 MB), holding it in memory (no disk writes).
3. `pdf-parse` extracts the raw text from the PDF buffer.
4. The text is split into chunks by double newlines (`\n\n`) and empty chunks are filtered out.
5. Each chunk is embedded one-by-one using **Gemini Embedding 2** (`gemini-embedding-2`) — producing 3072-dimensional vectors.
6. All chunks, their vectors, and metadata (`userId`, `documentId`, `fileName`, `chunkIndex`) are upserted into a single Qdrant collection named `rag_documents`.
7. The API returns the generated `documentId` (a UUID) and original filename to the caller.

### Query Flow

1. A question is sent to `POST /api/internal/document/chat` with `query` and `documentId` in the request body.
2. The query text is embedded using the same Gemini embedding model.
3. Qdrant is queried for the top 5 most similar chunks, filtered by both `userId` and `documentId` (so users can only retrieve their own documents).
4. The top 3 results are extracted, their text joined as context, and passed to **Gemini Flash** (`gemini-3.6-flash`) along with the original question.
5. The system prompt instructs the model to answer directly using only the provided context, without referencing the retrieval mechanism.
6. The generated answer is returned to the caller.

---

## Architecture

```
Caller (internal service)
        │
        │  x-internal-key  +  x-user-id headers
        ▼
┌─────────────────────────────────┐
│         Express Server          │
│         (port 8000)             │
│                                 │
│  POST /api/internal/document/upload  ──► internalAuth ──► multer ──► uploadController
│  POST /api/internal/document/chat    ──► internalAuth ──► chatController
└─────────────────────────────────┘
         │                   │
         ▼                   ▼
  Gemini Embedding 2    Gemini Flash
  (text → 3072-dim      (context + query
   vectors)              → answer)
         │
         ▼
  Qdrant (localhost:6333)
  Collection: rag_documents
  Distance: Cosine
  Vector size: 3072
```

---

## Project Structure

```
chat-pdf/
├── server.js                        # Entry point — initializes Qdrant collection, mounts routes
├── data.js                          # Static sample documents/queries used during development
├── test-qdrant.js                   # Script to verify Qdrant connectivity
│
├── controllers/
│   ├── upload.controller.js         # PDF extraction, chunking, embedding, and storage logic
│   └── chat.controller.js           # Query embedding, vector search, and LLM generation
│
├── services/
│   ├── gemini.service.js            # Gemini API client — embeddings() and generateResponse()
│   ├── qdrant.service.js            # Shared Qdrant client instance
│   ├── qdrant.collection.js         # Collection setup (creates if not exists on startup)
│   └── qdrant.documents.js          # storeChunks() and searchChunks() operations
│
├── middlewares/
│   ├── internalAuth.middleware.js   # Validates x-internal-key header; extracts x-user-id
│   └── upload.middleware.js         # Multer config — memory storage, PDF filter, 10 MB limit
│
├── utils/
│   └── embeddingHelper.js           # Sequential loop to embed an array of text chunks
│
├── .env                             # GEMINI_API_KEY, INTERNAL_SERVICE_KEY
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| LLM & Embeddings | Google Gemini (`@google/genai`) |
| Embedding Model | `gemini-embedding-2` (3072 dimensions) |
| Generation Model | `gemini-3.6-flash` |
| Vector Database | Qdrant (`@qdrant/js-client-rest`) |
| PDF Parsing | `pdf-parse` |
| File Upload | Multer (memory storage) |
| Config | `dotenv` |

---

## API Reference

Both routes require two headers on every request:

| Header | Description |
|---|---|
| `x-internal-key` | Shared secret key matching `INTERNAL_SERVICE_KEY` in `.env` |
| `x-user-id` | The ID of the user making the request (passed from the caller) |

### `POST /api/internal/document/upload`

Upload a PDF and process it into the vector store.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | A PDF file, max 10 MB |

**Response `200`:**
```json
{
  "message": "PDF processed successfully",
  "document": {
    "documentId": "uuid-v4",
    "fileName": "original-filename.pdf"
  }
}
```

---

### `POST /api/internal/document/chat`

Ask a question about an uploaded document.

**Request:** `application/json`

```json
{
  "documentId": "uuid-v4-from-upload",
  "query": "What are the key findings in section 3?"
}
```

**Response `200`:**
```json
{
  "message": "Query processed successfully",
  "data": "The key findings in section 3 are..."
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A running Qdrant instance on `localhost:6333` (see [Qdrant docs](https://qdrant.tech/documentation/quick-start/) or run via Docker below)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Running Qdrant with Docker

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd chat-pdf

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
# Then fill in your values
```

### Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
INTERNAL_SERVICE_KEY=your_shared_secret_key_here
PORT=8000   # optional, defaults to 8000
```

### Start the Server

```bash
node server.js
```

On startup, the server will automatically create the `rag_documents` Qdrant collection if it doesn't already exist.

### Test Qdrant Connectivity

```bash
node test-qdrant.js
```

---

## Design Notes

- **No disk writes:** Uploaded PDFs are processed entirely in memory using Multer's memory storage.
- **Per-user, per-document isolation:** Qdrant search filters on both `userId` and `documentId`, so a user can only retrieve chunks from their own documents.
- **Sequential embedding:** Chunks are embedded one at a time in a loop rather than in batch. This keeps the code simple but will be slow for large documents with many chunks.
- **Internal service pattern:** Routes are mounted under `/api/internal` and require a shared secret header. This service is not meant to be called directly from a browser or mobile client.
- **Cosine similarity:** Qdrant is configured with cosine distance, which is appropriate for normalized text embedding vectors.
- **Chunking strategy:** Text is split on double newlines (`\n\n`), which is a simple paragraph-level split. No overlap between chunks is applied.

---

## What's Not Included (Yet)

- No authentication system of its own — relies entirely on the `x-internal-key` / `x-user-id` trust model
- No persistent storage for document metadata (only Qdrant payload fields)
- No batched embedding (chunks are processed one at a time)
- No chunk overlap or sliding window chunking
- No streaming responses from the LLM
- No test suite (a connectivity check script exists for Qdrant only)

