# ItsU Backend 🐺

The high-performance game logic engine and API server for ItsU, built with [Express 5](https://expressjs.com) and [Bun](https://bun.sh).

## Key Components

- **Game Engine**: An in-memory state manager for real-time game sessions.
- **Matchmaker**: A background worker that coordinates player lobbies and starts games.
- **AI Bot Engine**: Integrates with Groq (LLaMA 3.1) and Gemini 2.5-flash to simulate human-like gameplay and chat.
- **Payout System**: Secure server-side validation for Solana and SKR token distributions.

## Getting Started

1. **Install Dependencies**:
```bash
bun install
```

2. **Environment Setup**:
Copy `.env.example` to `.env` and configure your `DATABASE_URL` and `GROQ_API_KEY`.

3. **Database Migration**:
```bash
bunx prisma migrate dev
```

4. **Run Server**:
```bash
bun start # or bun run index.ts
```
