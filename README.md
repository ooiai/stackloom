# StackLoom

Weave full‑stack apps from UI blocks with AI.

> Status: **early / experimental** – APIs, internals, and folder structure may change frequently.

---

## What is StackLoom?

StackLoom is an experimental tool to help you build full‑stack web applications from **UI blocks** and **natural‑language instructions**.

Instead of starting from a blank project and wiring everything manually, you:

1. Describe what you want (pages, components, flows, data),
2. Let StackLoom propose **UI blocks + backend glue**, and
3. Refine the code through **iteration** (both by prompt and by hand).

The goal is **not** to hide your code behind a black box. The generated output lives in your repo as regular code that you are expected to read, modify, and own.

---

## Key ideas

- **UI‑first, AI‑assisted**

  You think in terms of _screens_ and _blocks_ (hero, sidebar, dashboard, form section, CRUD table, etc.). StackLoom uses AI to scaffold the UI and related logic.

- **Full‑stack by design**

  It aims to connect frontend and backend: components, routes, handlers, and data model stubs. Not just mock UIs.

- **Incremental changes**

  You can run StackLoom multiple times as requirements evolve. It should try to keep changes localized and diff‑friendly instead of rewriting everything every time.

- **Code you control**

  All code is meant to be human‑readable and checked into version control. You are encouraged to review, refactor, and extend it.

---

## Repository structure

This repo is organized roughly as follows:

- `frontend/` – Frontend application
- `backend/` – Backend services / API handlers
- `docs/` – Additional documentation and design notes

Each folder can evolve independently. The exact framework / stack may differ per project; treat this README as a high‑level guide and consult sub‑READMEs or docs for details when they exist.

---

## Getting started

> The commands below are **templates**. Adjust them to match your actual stack, package manager, and scripts.

### Prerequisites

- Git
- Node.js (LTS) and either `npm`, `pnpm`, or `yarn`
- (Optional) Docker, if you plan to containerize services
- (Optional) LLM provider key (e.g., OpenAI‑compatible API key) if StackLoom relies on external models

### Install dependencies

From the repo root:

1. Install frontend dependencies:

   ```bash
   cd frontend
   # Use your preferred package manager
   npm install
   # or: pnpm install
   # or: yarn
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   # Example for Node / TypeScript backend
   npm install
   # or your backend stack's equivalent:
   #   pip install -r requirements.txt
   #   bun install
   #   etc.
   ```

3. Set up environment variables:

   Create an `.env` (or multiple env files per app) and add variables such as:

   ```bash
   STACKLOOM_ENV=development
   # Example if you use an external LLM:
   STACKLOOM_OPENAI_API_KEY=your_api_key_here
   ```

   Check your project’s docs or code for the exact set of required variables.

### Run the apps

From the repo root:

```bash
# Example pattern using a Makefile
make dev
```

or start each side separately:

```bash
# Terminal 1
cd frontend
npm run dev

# Terminal 2
cd backend
npm run dev
```

Then open the printed URL(s), such as:

- `http://localhost:3000` for the frontend
- `http://localhost:PORT` for the backend (port depends on your setup)

---

## Using StackLoom in practice

How you **invoke** StackLoom depends on your integration (CLI, UI, or API), but a typical workflow looks like this:

### 1. Describe your app

You provide a high‑level description like:

- “A landing page with hero, feature list, and pricing cards”
- “An authenticated dashboard with a left sidebar and a top navigation bar”
- “CRUD pages for Project and Task, with filtering and pagination”

This description might live in:

- a dedicated config file (e.g., `stackloom.config.*`),
- a prompt in a web UI,
- or a CLI command.

### 2. Generate blocks

StackLoom uses this description to propose and/or generate:

- UI components and pages,
- API endpoints / backend handlers,
- basic data model stubs,
- wiring code (routing, type definitions, shared utilities, etc.).

The generated artifacts are regular files under `frontend/` and `backend/`.

### 3. Refine and iterate

You iterate in two main ways:

- **Prompt‑level changes**  
  Change the description or constraints and regenerate or update parts of the app.

- **Code‑level changes**  
  Edit generated code like any other project. Over time, your hand‑written code can dominate; StackLoom becomes a helper instead of the source of truth.

A well‑behaved integration should:

- Avoid rewriting files unnecessarily, and
- Try to keep diffs small and reviewable.

### 4. Integrate real systems and ship

StackLoom is not a full platform; you are still responsible for:

- Authentication and authorization
- Database schema and migrations
- Observability (logging, metrics, tracing)
- Security, privacy, compliance
- Deployment (PaaS, containers, etc.)

Once the generated structure is in a good place, treat it like any other codebase: write tests, add monitoring, and deploy via your existing pipelines.

---

## Configuration

Because StackLoom is experimental and flexible, configuration details are project‑specific. Common configuration areas include:

- **Model & provider settings**
  - Which model/provider to use (e.g., `gpt‑4.1`, local LLM, etc.)
  - Parameters such as temperature, max tokens, and timeouts
  - Retries and rate‑limit behavior

- **Project structure**
  - Where to place:
    - UI blocks (components, pages)
    - Backend routes / handlers
    - Shared types, DTOs, utilities
  - Naming conventions and folder layout

- **Scaffolding rules**
  - File naming patterns (e.g., `*.page.tsx`, `*.route.ts`)
  - Whether to generate tests alongside features
  - Preferred libraries or frameworks

Check your config files (e.g., `stackloom.config.*`, `.env`, `package.json` scripts, etc.) or additional docs under `docs/` for the concrete configuration used in this repository.

---

## Development guidelines

To keep the project healthy and AI‑friendly:

- **Prefer explicit structure**
  - Clear folder boundaries (`frontend`, `backend`, `shared`, etc.)
  - Obvious entrypoints (e.g., `main.ts`, `app.tsx`)

- **Keep generated code reviewable**
  - Avoid massive one‑shot generations that produce thousands of lines without structure.
  - If StackLoom is used via CLI/automation, try to scope each run to a specific area (e.g., “dashboard page”, “user profile form”).

- **Log decisions**
  - Add comments or docs for non‑obvious architecture decisions.
  - When overriding generated behavior, leave a short note explaining why.

- **Tests are welcome**
  - Even basic smoke tests help catch regressions when regenerating or refactoring.

---

## Roadmap (illustrative)

This is an example roadmap for StackLoom‑style tooling:

- [ ] **Diff‑aware updates**  
       Apply minimal edits to existing files instead of replacing entire blocks.

- [ ] **Richer UI block library**  
       Pre‑built layouts, dashboards, data tables, complex forms, and patterns.

- [ ] **Deeper framework integrations**  
       e.g., Next.js, Remix, NestJS, FastAPI, and others, with first‑class routing/data primitives.

- [ ] **Multiple model backends**  
       Support for hosted APIs, on‑prem / self‑hosted inference, and local models.

- [ ] **Templates & examples**  
       Starter templates for typical apps: admin dashboards, SaaS boilerplates, internal tools.

---

## Contributing

Contributions are welcome while the project is still in early stages.

- Use issues for:
  - bug reports,
  - feature requests,
  - design questions.

- For pull requests:
  - Keep changes focused and scoped (one main concern per PR).
  - Add or update tests when behavior changes.
  - Update docs or comments where applicable.

- Code style:
  - Prefer clarity over cleverness.
  - Small, composable modules are easier for both humans and AI tools to work with.

---

## License

MIT License. See the `LICENSE` file at the root of this repository for details.

---
