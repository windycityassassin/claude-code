# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Anthropic Claude (via Replit AI Integrations)

## Applications

### AI Agent Hub (`artifacts/agent-hub`)

A web app with two AI chat agents for an AI-powered automated testing product (TestPilot AI):

- **Marketing Agent**: A knowledgeable sales representative that helps prospects understand the product, pricing, and features.
- **Customer Support Agent**: A 24/7 technical support specialist that helps existing users troubleshoot and configure the platform.

Pages:
- `/` — Command Center dashboard with live stats (total conversations, message counts per agent)
- `/marketing` — Marketing AI chat interface
- `/support` — Customer Support AI chat interface
- `/conversations` — Full conversation history with filtering and detail view

Both agents use Claude Sonnet via Replit AI Integrations (no API key required — billed to credits).

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── agent-hub/          # React + Vite frontend (AI Agent Hub)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-anthropic-ai/  # Anthropic AI client + batch utilities
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Database Schema

- **conversations**: id, title, agentType ("marketing" | "support"), createdAt
- **messages**: id, conversationId (FK → conversations), role ("user" | "assistant"), content, createdAt

## API Routes

- `GET /api/healthz` — Health check
- `GET /api/anthropic/conversations` — List conversations (filterable by agentType query param)
- `POST /api/anthropic/conversations` — Create conversation
- `GET /api/anthropic/conversations/:id` — Get conversation with messages
- `DELETE /api/anthropic/conversations/:id` — Delete conversation
- `GET /api/anthropic/conversations/:id/messages` — List messages
- `POST /api/anthropic/conversations/:id/messages` — Send message (SSE streaming response)
- `GET /api/agents/stats` — Aggregate stats (total conversations/messages per agent type)
- `GET /api/agents/recent-conversations` — 10 most recent conversations

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Development

- API server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/agent-hub run dev`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
- DB push: `pnpm --filter @workspace/db run push`
