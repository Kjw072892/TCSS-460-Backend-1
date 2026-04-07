# TCSS 460 — Backend 1

Express + TypeScript example API for TCSS 460. Covers Weeks 1-2: routing, input handling, middleware, API testing, and the proxy pattern.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and add your OpenWeatherMap API key
cp .env.example .env

# Start development server (hot-reload)
npm run dev
```

Server runs at `http://localhost:3000`. API docs at `http://localhost:3000/api-docs`.

## Prerequisites

- **Node.js 22+** (LTS)
- **OpenWeatherMap API key** (free tier) — needed for the proxy routes

### Getting an OpenWeatherMap API Key

1. Create a free account at [openweathermap.org](https://home.openweathermap.org/users/sign_up)
2. After signing in, go to [API Keys](https://home.openweathermap.org/api_keys)
3. Copy your default key (or generate a new one)
4. Open the `.env` file in the project root and paste your key:
   ```
   WEATHER_API_KEY=your_key_here
   ```
5. New keys can take up to 10 minutes to activate

The `.env` file is gitignored — your key stays local and is never committed.

## Scripts

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start dev server with hot-reload |
| `npm run build`        | Compile TypeScript to `dist/`    |
| `npm start`            | Run compiled output              |
| `npm test`             | Run test suite                   |
| `npm run test:watch`   | Run tests in watch mode          |
| `npm run lint`         | Lint check                       |
| `npm run format`       | Format code with Prettier        |
| `npm run format:check` | Check formatting (CI)            |

## Project Structure

```
src/
├── index.ts                 # Server startup (imports app, calls listen)
├── app.ts                   # Express app creation and configuration
├── routes/
│   ├── index.ts             # Mounts /v1, /v2, and /proxy
│   ├── v1/                  # Week 1 — no middleware
│   │   ├── hello.ts         # All HTTP methods on one route
│   │   └── input.ts         # Query strings, route params, body, headers
│   ├── v2/                  # Week 2 — same controllers + middleware
│   │   ├── hello.ts         # Route-level logging middleware added
│   │   └── input.ts         # Validation middleware added
│   └── protected/           # Proxy routes (JWT middleware added Week 5)
│       └── proxy.ts         # OpenWeatherMap proxy
├── controllers/
│   ├── hello.ts             # Hello route handlers
│   ├── input.ts             # Input route handlers
│   └── proxy.ts             # Proxy route handlers
└── middleware/
    ├── logger.ts            # Request logging (app-level)
    └── validation.ts        # Input validation (route-level)
```

## Routes

### v1 — Basic Routing (Week 1)

No middleware. Routes call controllers directly.

| Method                    | Path                               | Purpose                       |
| ------------------------- | ---------------------------------- | ----------------------------- |
| GET/POST/PUT/PATCH/DELETE | `/v1/hello`                        | HTTP methods and CRUD mapping |
| GET                       | `/v1/input/search?q=term&limit=10` | Query string input            |
| GET                       | `/v1/input/users/:id`              | Route parameter input         |
| POST                      | `/v1/input/users`                  | JSON body input               |
| GET                       | `/v1/input/headers`                | Custom header input           |

### v2 — With Middleware (Week 2)

Same controllers as v1, with validation middleware added. Compare side-by-side.

| Method                    | Path                      | Middleware                           |
| ------------------------- | ------------------------- | ------------------------------------ |
| GET/POST/PUT/PATCH/DELETE | `/v2/hello`               | Route-level logging                  |
| GET                       | `/v2/input/search?q=term` | Validates `q` is present             |
| GET                       | `/v2/input/users/:id`     | Validates `id` is a positive integer |
| POST                      | `/v2/input/users`         | Validates `name` and `email` in body |
| GET                       | `/v2/input/headers`       | No additional validation             |

### Proxy — API Key Hiding

OpenWeatherMap proxy. The API key lives in `.env` on the server — the client never sees it.

| Method | Path                           | Response                           |
| ------ | ------------------------------ | ---------------------------------- |
| GET    | `/proxy/weather?city=Seattle`  | Raw OpenWeatherMap response        |
| GET    | `/proxy/weather/:city`         | Same, city as route param          |
| GET    | `/proxy/summary?city=Seattle`  | Transformed summary (curated data) |
| GET    | `/proxy/summary/:city`         | Same, city as route param          |
| GET    | `/proxy/forecast?city=Seattle` | Raw 5-day forecast                 |

## Architecture Decisions

**app.ts / index.ts split** — `app.ts` creates and exports the Express app. `index.ts` imports it and calls `listen()`. This separation enables Supertest to import the app without starting a real server.

**Router → Controller** — Routes define endpoints and wire middleware. Controllers hold handler logic. This is the standard Express separation of concerns.

**v1 / v2 versioning** — Demonstrates API versioning while teaching middleware progression. v1 has no middleware (Week 1). v2 adds validation middleware to the same controllers (Week 2). Students see the before/after side-by-side.

**public / protected** — Proxy routes live under `protected/`. In Week 5, a single line of JWT middleware at the router level will protect all proxy routes.

**Hand-written OpenAPI spec** — `openapi.yaml` is written manually so students learn the format directly. The spec is served with **Scalar** (an actively maintained Express middleware) at `/api-docs`. Auto-generation tools are introduced later in the group project.

## Testing

Tests use **Jest + Supertest**. They import `app` from `src/app.ts` (no server start needed).

```bash
npm test              # run all tests
npm run test:watch    # watch mode
```

Proxy tests mock `global.fetch` to avoid hitting the real OpenWeatherMap API. This means tests pass without a real API key — they use a fake key and fake responses. To manually test the proxy routes against the real API, you need a valid `WEATHER_API_KEY` in your `.env` file and a running dev server (`npm run dev`).

## CI

GitHub Actions runs lint + tests on every PR to `main`. See `.github/workflows/ci.yml`.

## Tech Stack

| Tool                          | Version |
| ----------------------------- | ------- |
| Express                       | 5.2     |
| TypeScript                    | 5.9     |
| Node.js                       | 22 LTS  |
| Jest + ts-jest                | 29      |
| Supertest                     | 7.2     |
| @scalar/express-api-reference | 0.9     |
| tsx                           | 4.21    |
