# ItsU Mobile 🐺

A beautiful, high-performance social deduction game for mobile, built with [React Native](https://reactnative.dev) and [Expo](https://expo.dev).

## Architecture

- **Navigation**: File-based routing via `expo-router`.
- **Styling**: Modern, utility-first CSS with `nativewind` (Tailwind for React Native).
- **State Management**: Lightweight and fast stores using `zustand`.
- **Solana Integration**: Mobile Wallet Adapter (MWA) for on-chain staking.

## Features

- **Matchmaking UI**: Real-time lobby management and game entry.
- **Staking Support**: Secure wallet transactions for SOL and SKR.
- **Dynamic Assets**: High-quality, processed icons and animations for an immersive experience.

## Getting Started

1. **Install Dependencies**:
```bash
bun install
```

2. **Environment Setup**:
Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SERVER_URL` to your backend instance.

3. **Run App**:
```bash
bun start # Launch Expo Dev Server
bun android # Run on Android
bun ios # Run on iOS (macOS only)
```

## Documentation

For more specific details on our stylized components and complex UI transitions, see [docs/UI_Components.md](./docs/UI_Components.md).
