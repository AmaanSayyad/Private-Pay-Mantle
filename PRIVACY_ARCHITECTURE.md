# Privacy Architecture: Treasury Dark Pool Mixer

## Overview

This architecture diagram illustrates how **PRIVATEPAY** achieves complete transaction privacy on Mantle Network by breaking the on-chain linkage between senders and receivers.

## Key Components

### 1. **Treasury Dark Pool Mixer** (Central Component)
- **Location**: Central circle in the diagram
- **Function**: Acts as a privacy-preserving intermediary
- **Implementation**: StealthAddressRegistry smart contract on Mantle
- **Purpose**: Obfuscates the direct relationship between senders and receivers

### 2. **Sender Wallets** (Left Side)
- Multiple wallets (Wallet 1, 2, 3, ... ∞)
- All send transactions **TO** the Treasury Mixer
- Represents infinite senders making deposits

### 3. **Receiver Wallets** (Right Side)
- Multiple wallets (Wallet 4, 5, 6, ... ∞)
- All receive transactions **FROM** the Treasury Mixer
- Represents infinite receivers making withdrawals

## Privacy Mechanism

### The Problem
Traditional blockchain transactions create a direct on-chain link:
```
Wallet 1 ──────→ Wallet 4  ❌ (Linkable on-chain)
```

### The Solution
With the Treasury Dark Pool Mixer:
```
Wallet 1 ──→ [Mixer] ──→ Wallet 4
Wallet 2 ──→ [Mixer] ──→ Wallet 5
Wallet 3 ──→ [Mixer] ──→ Wallet 6
... (infinite transactions)
```

**On-chain view shows:**
- Infinite deposits: `Wallet 1 → Mixer`, `Wallet 2 → Mixer`, `Wallet 3 → Mixer`, ...
- Infinite withdrawals: `Mixer → Wallet 4`, `Mixer → Wallet 5`, `Mixer → Wallet 6`, ...
- **NO DIRECT LINK** between Wallet 1 and Wallet 4

## How It Works

1. **Deposit Phase**: Wallet 1 sends funds to the Treasury Mixer
2. **Mixing Phase**: Funds are pooled with all other deposits
3. **Withdrawal Phase**: Wallet 4 withdraws from the pool
4. **Result**: On-chain analysis cannot determine Wallet 1 sent to Wallet 4

## Privacy Guarantees

✅ **No On-Chain Linkage**: Direct sender-receiver relationship is broken
✅ **Infinite Transactions**: High volume makes correlation impossible
✅ **Stealth Addresses**: Each transaction uses unique stealth addresses
✅ **Temporal Decoupling**: Deposits and withdrawals happen independently

## Technical Implementation

### Smart Contracts (Mantle Network)
- **StealthAddressRegistry**: `0x6F40A56250fbB57F5a17C815BE66A36804590669`
- **PaymentManager**: `0x95bc083e6911DeBc46b36cDCE8996fAEB28bf9A6`

### Cryptographic Techniques
- **ECDH (Elliptic Curve Diffie-Hellman)**: For stealth address generation
- **BIP 0352 / EIP 5564**: Standard stealth address protocol
- **secp256k1**: Elliptic curve cryptography

## Use Cases

1. **Private Payments**: Send funds without revealing recipient
2. **Payment Links**: Share payment links without exposing wallet address
3. **Corporate Treasury**: Hide internal fund movements
4. **Privacy-First Transactions**: Complete anonymity on public blockchain

## On-Chain Analysis Resistance

Even with sophisticated blockchain analysis:
- ❌ Cannot link Wallet 1 → Wallet 4
- ❌ Cannot determine transaction amounts
- ❌ Cannot identify payment patterns
- ✅ Only sees: Many deposits → Mixer → Many withdrawals

## Diagram Elements

- **Blue Rectangles**: Sender wallets (input)
- **Yellow Circle**: Treasury Dark Pool Mixer (privacy layer)
- **Red Rectangles**: Receiver wallets (output)
- **Arrows**: Transaction flow (deposits and withdrawals)
- **∞ Symbols**: Represent infinite transactions

## Mantle Network Benefits

- **Low Gas Costs**: Enables high-volume mixing
- **EVM Compatible**: Standard Ethereum tooling
- **Fast Transactions**: Quick deposit/withdrawal cycles
- **Scalable**: Handles infinite transaction volume

---

**Built for Mantle Global Hackathon 2025 - ZK & Privacy Track**
