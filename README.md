# Research-Backed Health Product Marketplace

A Next.js App Router marketplace where every product is connected to research articles, AI summaries, verified benefit claims, and transparent scoring.

## Quick Start

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
2. Install dependencies with `npm install`.
3. Generate Prisma and run migrations:

```bash
npm run prisma:migrate -- --name init
npm run prisma:seed
```

4. Start the app:

```bash
npm run dev
```

## Local AI Curation

The research curation layer can run through Ollama on your own machine:

```bash
ollama pull deepseek-r1:8b
ollama serve
```

Set these values in `.env.local`:

```bash
AI_PROVIDER="local"
LOCAL_AI_BASE_URL="http://localhost:11434"
LOCAL_AI_MODEL="deepseek-r1:8b"
LOCAL_AI_KEEP_ALIVE="30m"
LOCAL_AI_NUM_CTX="4096"
LOCAL_AI_NUM_GPU="999"
LOCAL_AI_NUM_BATCH="512"
LOCAL_AI_NUM_PREDICT="4096"
LOCAL_AI_PAPER_NUM_PREDICT="2048"
LOCAL_AI_CANDIDATE_LIMIT="8"
```

For an NVIDIA GPU, check that Ollama is actually using VRAM:

```powershell
Invoke-RestMethod http://localhost:11434/api/ps | ConvertTo-Json -Depth 5
nvidia-smi
```

`size_vram` should be greater than `0`. If it stays `0`, Ollama is running on CPU and needs to be restarted or reinstalled with NVIDIA/CUDA GPU support before the app can make it fast.

Later, switch to a hosted model by setting `AI_PROVIDER="openai"` and adding `OPENAI_API_KEY`.

## What Is Included

- Prisma schema for products, articles, product-research links, verified benefits, AI summaries, scores, jobs, and NextAuth tables.
- Admin-only affiliate ingestion endpoint at `POST /api/admin/ingest`.
- Async in-process research job queue with retry/backoff-protected PubMed/PMC, Crossref, OpenAlex, Semantic Scholar, Amazon scraper, Ollama, and OpenAI calls.
- Benefit Score and Product Fit Score algorithms.
- A complete mock product fallback for immediate UI testing.
- Product detail, marketplace home, mission, how-it-works, FAQ, and admin pages.

The application is an engineering starter, not medical advice. Real claims should be reviewed by qualified clinical and regulatory experts before publication.

