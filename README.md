# NEXUS AI — Intelligent Document Assistant

A **Retrieval-Augmented Generation (RAG)** web app. Upload PDFs, Markdown or text, ask questions in natural language, and get answers grounded **only** in your documents, with clickable citations that point to the exact passage and page.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · OpenAI API**.

---

## Features

- **Dashboard**: library metrics (documents, chunks, words, size), a live view of the RAG pipeline configuration, recent documents and a quick-ask box.
- **Assistant**: streaming chat. Each answer shows its sources (document, page, chunk, similarity score). Citations like `[1]` are interactive and open the original passage.
- **Library**: drag-and-drop upload (PDF/TXT/MD), paste raw text, filter documents, and a chunk viewer with in-document search.
- **Honest failure modes**: if nothing relevant is retrieved, the app says so and **does not call the LLM**. A missing API key, provider errors, rate limits, unreadable or scanned PDFs, and unsupported files each get a clear state in the UI. Nothing is simulated.
- Responsive on desktop and mobile (sidebar on desktop, bottom tab bar on phones), with keyboard accessibility and `prefers-reduced-motion` support.

## How the RAG pipeline works

```
 Browser                                   Next.js server (API routes)            OpenAI
 ───────                                   ───────────────────────────            ──────
 file / text ── POST /api/ingest ───────▶  1. extract text (unpdf, per page)
                                           2. normalize + chunk (1000 chars,
                                              200 overlap, sentence-aware)
                                           3. embed chunks ─────────────────────▶ /embeddings
 IndexedDB  ◀── chunks + vectors ───────── (nothing is stored on the server)

 question  ── POST /api/embed ──────────▶  embed query ─────────────────────────▶ /embeddings
 4. cosine similarity over local vectors
    top-k = 6, min score = 0.25
 5. POST /api/chat (question + sources) ─▶ grounded prompt ─────────────────────▶ /chat/completions
 streamed answer with [n] citations ◀────── text stream                          (stream)
```

| Stage | Implementation | File |
| --- | --- | --- |
| Extraction | `unpdf` (PDF.js, serverless-friendly), page by page so citations carry page numbers. UTF-8 decoding for TXT/MD. | `src/lib/server/extract.ts` |
| Chunking | Sentence-aware greedy packing with character overlap. Each page is chunked independently. | `src/lib/rag/chunker.ts` |
| Embeddings | `text-embedding-3-small`, 512 dimensions, batched. | `src/lib/server/openai.ts` |
| Vector store | IndexedDB behind a `VectorStore` interface, so you can swap it for pgvector, Pinecone, etc. | `src/lib/client/db.ts` |
| Retrieval | Exact cosine similarity, top-k with a relevance threshold. Skips vectors whose dimensions don't match the query. | `src/lib/rag/retrieve.ts` |
| Generation | `gpt-4o-mini`, temperature 0.1. The system prompt enforces source-only answers, mandatory `[n]` citations, a refusal when the answer isn't in the sources, and treating source text as untrusted (prompt-injection guard). | `src/lib/rag/prompt.ts` |

### Design decisions

- **Stateless server + browser-side index.** It deploys to any serverless host with no database. Each visitor of a public demo only sees their own documents. Exact search in the browser stays fast up to tens of thousands of chunks. For multi-user or very large corpora, implement `VectorStore` on top of a server-side vector DB.
- **Retrieval runs before generation, and is a hard gate.** No relevant chunks means no LLM call, so the model cannot answer from its own prior knowledge.
- **Citations are verified on the client.** Only numbers that map to a retrieved source become clickable. Sources that were retrieved but not cited are hidden once the answer finishes.

## Security

- `OPENAI_API_KEY` is read only in server modules (`import "server-only"`). It is never prefixed with `NEXT_PUBLIC_` and never sent to the browser. `/api/health` reports only whether a key is set.
- Input validation and limits: 4 MB per file, 300k characters per pasted text, 600 chunks per document, 2k characters per question, and capped sources and history per request.
- Best-effort per-IP rate limiting on AI endpoints (`RATE_LIMIT_PER_MINUTE`). For strict limits on a public deployment, back it with Redis/Upstash, and set a spending limit in your OpenAI dashboard.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`). Model output is rendered with a small, safe Markdown renderer that never uses raw HTML.

## Getting started

**Requirements:** Node.js 18.18+ (20+ recommended) and an [OpenAI API key](https://platform.openai.com/api-keys).

```bash
npm install
cp .env.example .env.local      # then set OPENAI_API_KEY in .env.local
npm run dev                     # http://localhost:3000
```

### Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | yes | — | Server-side key used for embeddings and chat. |
| `OPENAI_BASE_URL` | no | `https://api.openai.com/v1` | Any OpenAI-compatible endpoint that supports `/embeddings` and `/chat/completions`. |
| `CHAT_MODEL` | no | `gpt-4o-mini` | Generation model. |
| `EMBEDDING_MODEL` | no | `text-embedding-3-small` | Embedding model. |
| `EMBEDDING_DIMENSIONS` | no | `512` | Vector size requested from the embedding model. |
| `RATE_LIMIT_PER_MINUTE` | no | `30` | Requests per minute per IP on AI endpoints. |

> If you change the embedding model or dimensions, re-upload your documents. Vectors from different models can't be compared, and the library flags affected documents.

### Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # serve the production build
npm test           # unit tests (Vitest): chunking, retrieval, prompt & citations
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

## Deployment

### Vercel (recommended)

1. Push this folder to a GitHub repository.
2. In [Vercel](https://vercel.com/new), import the repository. The framework is detected automatically.
3. Under **Settings → Environment Variables**, add `OPENAI_API_KEY` (and any optional variables).
4. Deploy. No database or storage setup is needed.

> Vercel limits request bodies to about 4.5 MB, which is why the upload limit is 4 MB.

### Any Node host (Render, Railway, Fly.io, a VPS)

```bash
npm ci && npm run build
OPENAI_API_KEY=sk-... npm start   # listens on $PORT or 3000
```

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── ingest/route.ts   # extract → chunk → embed
│   │   ├── embed/route.ts    # query embedding
│   │   ├── chat/route.ts     # grounded, streamed generation
│   │   └── health/route.ts   # configuration status (never exposes secrets)
│   ├── chat/ · documents/ · page.tsx (dashboard) · layout.tsx · globals.css
├── components/
│   ├── chat/                 # chat view, messages, citations, sources, composer
│   ├── documents/            # upload zone, paste form, queue, cards, chunk viewer
│   ├── dashboard/            # stat cards, pipeline, recent documents, quick ask
│   ├── layout/               # app shell, navigation, status, banners
│   ├── providers/            # library (documents, uploads, health) & chat state
│   └── ui/                   # button, card, badge, alerts, empty states
└── lib/
    ├── rag/                  # pure, tested RAG logic shared by client and server
    ├── server/               # server-only: config, OpenAI client, extraction, rate limit
    └── client/               # IndexedDB vector store, API client, formatters
tests/                        # Vitest unit tests
```

## Limitations and roadmap

- Scanned PDFs (images only) need OCR, which isn't included. The app detects them and explains why they can't be indexed.
- The library lives in the current browser. Clearing site data removes it.
- Possible next steps: hybrid search (BM25 + vectors), re-ranking, DOCX support, a server-side vector DB with authentication, and evaluation sets for retrieval quality.
