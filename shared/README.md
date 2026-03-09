# ItsU Shared 

Shared TypeScript types, interfaces, and utility functions used by both the [mobile](../mobile) and [backend](../backend) workspaces.

## Purpose

Maintaining a single source of truth for the project's data structures ensures type safety and consistency across the entire stack. This workspace contains:

- **Game State Types**: `GameState`, `Player`, `Role`, and `Room` definitions.
- **API Request/Response Types**: Typed contracts for all REST endpoints.
- **Constants**: Shared game rules (e.g., player limits, timer durations).
- **Utilities**: Common validation logic and formatting helpers.

## Usage

This package is designed to be imported as a workspace dependency:

```json
"dependencies": {
  "@itsu/shared": "workspace:*"
}
```

## Getting Started

1. **Install Dependencies**:
```bash
bun install
```

2. **Build/Type-Check**:
```bash
bun type-check
```
