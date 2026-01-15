# Mantle Smart Contracts

This directory contains the Solidity smart contracts for PrivatePay on Mantle Network, implementing stealth address functionality for private payments.

Built for [Mantle Global Hackathon 2025 - ZK & Privacy Track](https://www.hackquest.io/hackathons/Mantle-Global-Hackathon-2025).

## Overview

The smart contracts provide:
- **StealthAddressRegistry**: Registry for meta addresses and payment announcements
- **PaymentManager**: Manager for private payments using stealth addresses

## Installation

To install dependencies:

```bash
npm install
```

## Compilation

To compile contracts:

```bash
npx hardhat compile
```

## Deployment

To deploy to Mantle Sepolia testnet:

```bash
npx hardhat run scripts/deploy-mantle-contracts.ts --network mantle-sepolia
```

To deploy to Mantle mainnet:

```bash
npx hardhat run scripts/deploy-mantle-contracts.ts --network mantle-mainnet
```

## Testing

To run tests:

```bash
npx hardhat test
```

## Configuration

The contracts are configured for Mantle Network (Sepolia testnet and mainnet) in `hardhat.config.ts`. Update the network settings as needed for your deployment.

This project uses Hardhat for smart contract development and deployment on Mantle Network.
