# ItsU 🐺

A social deduction mobile game powered by AI-driven bots. Players are assigned secret roles — **Citizen** or **Wolf** — and must use clues, chat, and voting to survive each round. AI bots powered by [Groq](https://groq.com) fill empty player slots and behave like real humans.

---

## 📖 Table of Contents

- [Project Purpose](#-project-purpose)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Workspace Structure](#-workspace-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone & Install](#clone--install)
  - [Environment Variables](#environment-variables)
  - [Running the Project](#running-the-project)
- [Forking Guide](#-forking-guide)
- [Scripts Reference](#-scripts-reference)

---

## Project Purpose

**ItsU** is a real-time, role-based social deduction game for mobile. Each game session assigns a secret item to Citizens and a hint to the Wolves. Players must chat strategically, deduce who knows the item (Citizen) and who only knows the hint (Wolf), then vote to eliminate the Wolves before they eliminate all Citizens.

Key highlights:

- **AI Bots** powered by Groq's LLaMA model chat, vote, and make kill decisions autonomously.
- **Matchmaking** automatically fills lobbies and starts games.
- **Solana Integration** via the `anchor` package for on-chain staking features.
- **Monorepo** structure managed by Turborepo and Bun workspaces for fast, parallel builds.

---

## Architecture Overview

```
ItsU (monorepo)
├── backend/    — Express REST API + game state engine + AI bot workers
├── mobile/     — React Native (Expo) mobile app
├── shared/     — Shared TypeScript types and utilities used across packages
└── anchor/     — Solana on-chain program integration
```

The backend handles all game logic in-memory via a `GameStore`, coordinates matchmaking via a `MatchMaker` worker, and delegates AI decisions (chat, vote, kill) to the `BotEngine` which calls Groq's API.

---

## Tech Stack

| Layer      | Technology                                                                             |
| ---------- | -------------------------------------------------------------------------------------- |
| Monorepo   | [Turborepo](https://turbo.build) + [Bun](https://bun.sh) workspaces                    |
| Backend    | [Express 5](https://expressjs.com) + [Bun runtime](https://bun.sh)                     |
| AI Bots    | [Groq SDK](https://groq.com) (LLaMA 3.1 8B Instant)                                    |
| Database   | PostgreSQL via [Prisma ORM](https://www.prisma.io)                                     |
| Auth       | JWT (access + refresh tokens)                                                          |
| Mobile     | [React Native](https://reactnative.dev) + [Expo](https://expo.dev) (SDK 54)            |
| Styling    | [NativeWind](https://www.nativewind.dev) (Tailwind CSS for RN)                         |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based routing)                      |
| Blockchain | [Solana Web3.js](https://solana-labs.github.io/solana-web3.js) + Mobile Wallet Adapter |
| Logging    | [Pino](https://getpino.io)                                                             |
| Language   | TypeScript throughout                                                                  |

---

## Workspace Structure

### `backend/`

REST API server built with Express 5 and Bun.

| Path                        | Description                                       |
| --------------------------- | ------------------------------------------------- |
| `src/app.ts`                | Express app setup, middleware, and route mounting |
| `src/index.ts`              | Server entry point                                |
| `src/config.ts`             | Environment variable loading                      |
| `src/routes/`               | Auth, user, games, and transactions routers       |
| `src/controllers/`          | Route handler logic                               |
| `src/middlewares/`          | Auth middleware and error handling                |
| `src/state/gameStore.ts`    | In-memory game state manager                      |
| `src/workers/matchmaker.ts` | Lobby matchmaking worker                          |
| `src/workers/botEngine.ts`  | AI bot decision engine (chat / vote / kill)       |
| `src/utils/`                | Logger, helpers, and utilities                    |

### `mobile/`

React Native app using Expo Router for file-based navigation.

| Path              | Description                   |
| ----------------- | ----------------------------- |
| `app/`            | Expo Router pages and layouts |
| `src/api/`        | API client (Axios)            |
| `src/components/` | Reusable UI components        |
| `src/hooks/`      | Custom React hooks            |
| `src/utils/`      | Client-side utilities         |
| `constants/`      | App-wide constants            |

### `shared/`

Shared TypeScript types (e.g. `GameState`, player roles) consumed by both `backend` and `mobile`.

### `anchor/`

Solana program integration entry point.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- **[Bun](https://bun.sh)** ≥ 1.0.0
- **[Node.js](https://nodejs.org)** ≥ 18
- **[Git](https://git-scm.com)**
- **Android Studio** (for Android emulator) or a physical Android device
- A **PostgreSQL** database (local or hosted, e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com))
- A **[Groq API Key](https://console.groq.com)** (free tier available)

---

### Clone & Install

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ItsU.git
cd ItsU

# 2. Install all workspace dependencies
bun install
```

---

### Environment Variables

#### Backend (`backend/.env`)

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable             | Description                              |
| -------------------- | ---------------------------------------- |
| `PORT`               | Port the server listens on (e.g. `3000`) |
| `NODE_ENV`           | `development` or `production`            |
| `JWT_ACCESS_SECRET`  | Secret for signing JWT access tokens     |
| `JWT_REFRESH_SECRET` | Secret for signing JWT refresh tokens    |
| `DATABASE_URL`       | PostgreSQL connection string for Prisma  |
| `GROQ_API_KEY`       | Your Groq API key for AI bot generation  |

#### Mobile (`mobile/.env`)

```bash
cp mobile/.env.example mobile/.env
```

| Variable                 | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `EXPO_PUBLIC_SERVER_URL` | Full URL of your running backend (e.g. `http://192.168.1.x:3000`) |

> **Tip:** When running the mobile app on a physical device, use your machine's local network IP instead of `localhost`.

---

### Running the Project

#### Start everything (recommended)

```bash
bun dev
```

This runs all workspace packages in parallel via Turborepo.

#### Start only the backend

```bash
bun server
# or
cd backend && bun start
```

#### Start only the mobile app

```bash
# Launch Expo Dev Server
cd mobile && bun start

# Run on Android (requires emulator or device)
cd mobile && bun android

# Run on iOS (macOS only)
cd mobile && bun ios
```

#### Database setup (Prisma)

```bash
cd backend

# Apply migrations
bunx prisma migrate dev

# Generate Prisma client
bunx prisma generate
```

---

## Forking Guide

Follow these steps to fork ItsU and run your own instance:

### 1. Fork the Repository

Click the **Fork** button on the GitHub repository page to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/ItsU.git
cd ItsU
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Configure Environment Variables

Set up `.env` files for both `backend` and `mobile` as described in the [Environment Variables](#environment-variables) section above.

### 5. Set Up the Database

Provision a PostgreSQL database, paste the connection string into `backend/.env`, and run migrations:

```bash
cd backend
bunx prisma migrate dev
bunx prisma generate
```

### 6. Get a Groq API Key

Sign up at [console.groq.com](https://console.groq.com), create a free API key, and set it as `GROQ_API_KEY` in `backend/.env`. This is required for the AI bot engine to function.

### 7. Run the Project

```bash
# From the root
bun dev

# OR start individually
bun server         # backend only
cd mobile && bun android  # mobile only
```

### 8. Keep Your Fork Updated

```bash
# Add the upstream remote (one-time)
git remote add upstream https://github.com/ORIGINAL_OWNER/ItsU.git

# Pull latest changes from upstream
git fetch upstream
git merge upstream/main
```

---

## Scripts Reference

All scripts below can be run from the **root** of the monorepo:

| Script      | Command          | Description                                        |
| ----------- | ---------------- | -------------------------------------------------- |
| Dev (all)   | `bun dev`        | Run all workspaces in dev/watch mode via Turborepo |
| Build (all) | `bun build`      | Build all workspaces                               |
| Lint        | `bun lint`       | Lint all workspaces                                |
| Type Check  | `bun type-check` | TypeScript type-check all workspaces               |
| Backend     | `bun server`     | Start the backend server with hot-reload           |
| Mobile      | `bun app`        | Build and run the mobile app on Android            |

---

## License

This project is open-source. See [LICENSE](./LICENSE) for details.
