# NEXUS AI — Intelligent Document Assistant

A Retrieval-Augmented Generation (RAG) application designed to answer questions grounded in user-provided documents, with a focus on traceability, reliability, and testability.

## Overview

NEXUS AI is a document assistant that enables users to ingest documents and ask questions about their content. The application is designed to support grounded responses with source references, helping users verify where information comes from.

## Key Features

- Document ingestion for supported PDF, Markdown, and text files.
- Retrieval-Augmented Generation (RAG) workflow.
- Document-based question answering.
- Source references and citations in responses.
- Streaming chat interface.
- Server-side AI provider configuration.
- Automated tests for core retrieval and prompt logic.

## Technology Stack

- Next.js 15 — App Router
- TypeScript
- React
- Tailwind CSS
- Vitest
- AI provider integrations configured through server-side environment variables

## RAG Workflow

1. **Ingestion:** users submit supported documents.
2. **Chunking:** document content is divided into smaller passages.
3. **Embedding:** passages are converted into vector representations.
4. **Retrieval:** relevant passages are selected for a question.
5. **Generation:** the AI model generates a response using the retrieved context.
6. **Traceability:** source references help users inspect the supporting material.

## Quality Engineering

Quality is an important part of this project. The repository includes automated tests covering:

- Document chunking
- Retrieval logic
- Prompt construction

### Current Validation

- Automated tests: **13 passing**
- TypeScript type checking: completed without visible errors
- ESLint: completed without visible errors
- Production build: completed successfully

These checks validate the current test suite and build process. They do not, by themselves, guarantee that every provider integration or end-to-end workflow works in every environment.

## Getting Started

### Prerequisites

- Node.js compatible with the installed Next.js version
- npm
- An API key for a supported AI provider

### Installation

```bash
git clone https://github.com/stephanie-andressa/Nexus-ai.git
cd Nexus-ai/nexus-ai
npm install
```

### Environment Configuration

Create a local `.env.local` file based on the project's `.env.example` file.

Configure the provider and environment variables supported by the application. Keep all API keys server-side. **Never commit `.env.local` or real credentials to GitHub.**

### Run in Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run Tests and Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Project Goals

This project explores practical RAG engineering, document retrieval, AI integration, and software quality practices. It is part of a portfolio focused on building reliable and testable AI applications.

## Roadmap

- Improve end-to-end test coverage.
- Expand retrieval evaluation with representative questions and expected sources.
- Strengthen provider configuration and error handling.
- Add deployment documentation and a public demo when available.

## Author

**Stephanie Andressa**

AI Engineering | Quality Assurance | Test Automation

---


## 📸 NEXUS AI — Application Preview

![NEXUS AI Screenshot](./nexus-ai.png)

**Live Demo:** https://nexus-ai-seven-flax.vercel.app/
*This project is under active development. Features and provider compatibility should be verified against the current implementation.*
