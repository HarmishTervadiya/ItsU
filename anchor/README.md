# ItsU Anchor ⚓

The Solana on-chain logic for ItsU, built with the [Anchor Framework](https://www.anchor-lang.com).

## Current Status

**Status: Next Phase (Staking 2.0)**

Currently, all game staking and payouts are handled securely via server-side validation using `solana/web3.js`. This directory contains the initial work for moving to a fully decentralized, permissionless escrow system.

## Planned Features

- **Escrow Accounts**: Game pots will be held by a pda-controlled vault during matches.
- **Permissionless Wins**: Winners will be able to claim their distribution directly from the smart contract.
- **On-Chain Verification**: Game results and distributions will be cryptographically provable.

## Getting Started

1. **Install Anchor CLI**:
Follow the instructions at [anchor-lang.com](https://www.anchor-lang.com/docs/installation).

2. **Install Dependencies**:
```bash
bun install
```

3. **Build Programs**:
```bash
anchor build
```
