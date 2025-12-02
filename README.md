# AI Support Hub — Server

AI Support Hub is an AI-powered customer support backend (similar to Intercom, Zendesk, or Freshdesk).

- Customers ask questions via a chat widget on your website
- An AI assistant searches your company's Knowledge Base and answers when possible
- If the AI can't resolve an issue, a Ticket is created so agents can follow up
- Everything (messages, tickets, analytics) is tracked per Workspace

This repository contains the server API and business logic for creating workspaces, managing users and agents, authoring knowledge, handling chat queries, and tracking tickets and analytics.

**Quick highlights**
- Language: TypeScript (bun)
- Web framework: `hono`
- ORM: `prisma`
- AI integration: Google Gemini (`@google/generative-ai`)

**Core features**
- User Management: register, login, email verification, password reset, profiles
- Workspace: multi-tenant workspaces, roles (Owner, Admin, Agent), API keys
- Knowledge Base: articles/FAQs used by AI to answer customers
- Tickets: created for complex issues, stores messages and metadata
- Chat/AI: query endpoint for widget integration (uses `X-API-Key`)
- Analytics: dashboard metrics (AI resolution rate, response times, satisfaction)

**Real-world flow (summary)**
1. Admin creates workspace, adds knowledge and generates an API key
2. Customer hits the chat widget on the website and sends a message
3. Server runs AI search against the Knowledge Base
	- If AI can answer: reply returned to customer
	- Otherwise: a Ticket is created and agents are notified

--

**Contents**
- Features & Architecture
- Setup & Quickstart
- Environment variables (`.env.example`)
- API reference (route names & auth)
- Widget integration snippet

**Why this approach matters**
With a knowledge-driven AI layer you reduce ticket volume and let agents focus on complex issues. In many cases the AI answers a majority of common questions instantly.

**Installation & Quickstart**
- **Clone**: `git clone <repo-url>`
- **Install deps**: `bun install`
- **Generate Prisma client**: `bun run prisma generate` or `npm run db:generate`
- **Apply DB schema (dev)**: `bun run prisma migrate dev` or `npm run db:migrate`
- **Run in development**: `bun run --hot src/index.ts` or `bun run dev` (see `package.json` scripts)

**Environment**
- Copy `.env.example` → `.env` and fill values (DB url, SMTP, GEMINI_API_KEY, JWT secrets).
- The server expects the following important variables (see `.env.example`): `DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_*`, `APP_URL`, `FRONTEND_URL`.

**Database / Migrations**
- Prisma schema is in `prisma/schema.prisma`.
- Common commands:
	- `bun run prisma generate` — generate client
	- `bun run prisma migrate dev` — apply migrations (dev)
	- `bun run prisma db push` — push schema without migration

**API Reference (routes)**
All endpoints are rooted under the server base URL (example `http://localhost:3000`). Use `Authorization: Bearer <token>` for authenticated user routes. Public widget endpoints require `X-API-Key: <key>`.

- **Auth** (`/auth`)
	- `POST /auth/register` — Register user
	- `POST /auth/login` — Login and return JWT
	- `POST /auth/verify-email` — Verify user's email
	- `POST /auth/forgot-password` — Request password reset
	- `POST /auth/reset-password` — Reset password
	- `GET /auth/me` — Get current user (requires `Authorization`)

- **Workspace** (`/workspaces`)
	- `POST /workspaces` — Create workspace (auth)
	- `GET /workspaces` — List workspaces (auth)
	- `GET /workspaces/:workspaceId` — Get workspace
	- `PATCH /workspaces/:workspaceId` — Update workspace
	- `DELETE /workspaces/:workspaceId` — Delete workspace
	- `POST /workspaces/:workspaceId/api-keys` — Generate API key for widget/integration

- **Knowledge** (`/knowledge`)
	- `POST /knowledge/:workspaceId` — Create article (auth)
	- `GET /knowledge/:workspaceId` — List articles
	- `GET /knowledge/:workspaceId/:id` — Get article
	- `PATCH /knowledge/:workspaceId/:id` — Update article
	- `DELETE /knowledge/:workspaceId/:id` — Delete article

- **Chat / AI (widget)** (`/chat`) — Protected by `X-API-Key`
	- `POST /chat/query` — Submit customer query; returns AI/assistant reply or ticket creation
	- `POST /chat/search` — Search knowledge base (helper endpoint)

- **Tickets** (`/tickets`)
	- `POST /tickets` — Public ticket creation (uses `X-API-Key`)
	- `GET /tickets/:workspaceId` — List tickets (auth)
	- `GET /tickets/:workspaceId/:ticketId` — Get ticket (auth)
	- `PATCH /tickets/:workspaceId/:ticketId` — Update ticket (auth)
	- `POST /tickets/:workspaceId/:ticketId/messages` — Add message to ticket (auth)

- **Analytics** (`/analytics`) (auth)
	- `GET /analytics/:workspaceId/dashboard` — Dashboard metrics
	- `GET /analytics/:workspaceId/range` — Metrics by date range
	- `GET /analytics/:workspaceId/tickets` — Ticket stats
	- `GET /analytics/:workspaceId/agents` — Agent performance
	- `POST /analytics/:workspaceId/record` — Record daily metrics

**Headers & Auth**
- User routes: `Authorization: Bearer <access_token>`
- Widget/public API (chat & ticket creation): `X-API-Key: <api_key>` (see `workspace` API key generation)

**Widget integration (simple example)**
Client-side example that posts a chat query to the server using the workspace API key:

```js
// Example: send a query from a website widget
async function sendQuery(apiUrl, apiKey, payload) {
	const res = await fetch(`${apiUrl}/chat/query`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-API-Key': apiKey,
		},
		body: JSON.stringify(payload),
	});
	return res.json();
}

// payload example: { sessionId: 'visitor-123', message: 'How long is shipping?' }
```

**Developer notes & suggestions**
- The AI uses the Knowledge Base as the primary source of truth. Add clear, concise FAQ-style articles for best results.
- Use `GEMINI_API_KEY` for Google generative AI access; tune prompts in `src/services/gemini.service.ts`.

**Next steps / How you can help**
- Add UI widget for real-time messaging
- Improve analytics (CSAT, agent leaderboard)
- Add tests and CI for API stability

---
