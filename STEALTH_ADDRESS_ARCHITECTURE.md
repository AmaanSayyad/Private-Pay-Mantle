# PRIVATEPAY: Stealth Address Architecture on Mantle Network

## Overview

PRIVATEPAY implements a **Stealth Address System** on Mantle Network that provides complete transaction privacy by breaking the on-chain linkage between senders and recipients. Unlike mixer-based solutions, each payment uses a **unique stealth address** that cannot be linked to the recipient's main wallet address.

## Core Architecture

### Key Components

1. **Stealth Addresses** - Unique, one-time addresses for each payment
2. **Meta Addresses** - Public keys (spendPub + viewingPub) that recipients share
3. **StealthAddressRegistry** - Smart contract that announces payments
4. **PaymentManager** - Smart contract that handles stealth address payments
5. **ECDH Cryptography** - Elliptic Curve Diffie-Hellman for address derivation

## How It Works

### 1. Setup Phase (Recipient)

```
Recipient generates:
├── Meta Address
│   ├── Spend Public Key (spendPub) - for deriving stealth private keys
│   └── Viewing Public Key (viewingPub) - for scanning payments
└── Stores Meta Address in StealthAddressRegistry
```

### 2. Payment Phase (Sender)

```
Sender wants to pay Recipient:
├── Gets Recipient's Meta Address (spendPub + viewingPub)
├── Generates Ephemeral Key Pair (ephemeralPriv, ephemeralPub)
├── Computes ECDH Shared Secret:
│   └── sharedSecret = ECDH(ephemeralPriv, viewingPub)
├── Derives Unique Stealth Address:
│   └── stealthAddress = derive(spendPub, sharedSecret)
└── Sends MNT directly to stealthAddress
```

### 3. Announcement Phase

```
After payment:
├── PaymentManager.announcePayment() emits event
└── StealthAddressRegistry emits PaymentAnnouncement event
    ├── recipient (main wallet address)
    ├── ephemeralPubKey
    ├── stealthAddress
    ├── viewHint (for efficient scanning)
    └── amount
```

### 4. Scanning Phase (Recipient)

```
Recipient scans for payments:
├── Queries PaymentAnnouncement events from StealthAddressRegistry
├── For each event:
│   ├── Computes sharedSecret = ECDH(viewingPriv, ephemeralPub)
│   ├── Derives expected stealth address
│   └── If matches event.stealthAddress → Payment belongs to recipient
└── Identifies all payments using viewing private key
```

### 5. Withdrawal Phase (Recipient)

```
Recipient withdraws funds:
├── Derives stealth private key:
│   └── stealthPriv = derive(spendPriv, ephemeralPub, viewingPriv)
├── Creates wallet from stealth private key
└── Transfers funds from stealth address to main wallet
```

## Privacy Guarantees

### ✅ What's Hidden

1. **Recipient Identity**: On-chain shows payment to stealth address, not recipient's main wallet
2. **Payment Linkage**: Each payment uses a different stealth address
3. **Transaction Graph**: Cannot link multiple payments to same recipient
4. **Amount Privacy**: Amounts are visible but not linkable to recipient

### ❌ What's Visible On-Chain

1. **Sender Address**: Sender's wallet address is visible
2. **Stealth Address**: Each unique stealth address is visible
3. **Payment Events**: PaymentAnnouncement events are public
4. **Transaction Amounts**: MNT amounts are visible

### 🔒 Privacy Mechanism

**The Key Insight**: On-chain analysis sees:
```
Sender 1 → Stealth Address 0xSA1... (unique, unlinkable)
Sender 2 → Stealth Address 0xSA2... (unique, unlinkable)
Sender 3 → Stealth Address 0xSA3... (unique, unlinkable)
...
```

**Cannot determine**:
- Which stealth addresses belong to the same recipient
- Recipient's main wallet address
- Payment patterns or relationships

## Smart Contracts

### StealthAddressRegistry
**Address**: `0x6F40A56250fbB57F5a17C815BE66A36804590669` (Mantle Sepolia)

**Functions**:
- `registerMetaAddress(bytes spendPub, bytes viewingPub)` - Register meta address
- `announcePayment(...)` - Announce payment to stealth address
- `getMetaAddress(address user, uint256 index)` - Get meta address

**Events**:
- `MetaAddressRegistered` - When meta address is registered
- `PaymentAnnouncement` - When payment is announced

### PaymentManager
**Address**: `0x95bc083e6911DeBc46b36cDCE8996fAEB28bf9A6` (Mantle Sepolia)

**Functions**:
- `sendPrivatePayment(...)` - Send payment to stealth address
- `getStealthBalance(address stealthAddress)` - Check stealth address balance
- `withdrawFromStealth(address to)` - Withdraw from stealth address

**Events**:
- `PrivatePaymentSent` - When payment is sent
- `StealthWithdrawal` - When funds are withdrawn

## Cryptographic Flow

### Stealth Address Generation

```
Input:
├── Recipient's Meta Address:
│   ├── spendPub (33 bytes compressed secp256k1)
│   └── viewingPub (33 bytes compressed secp256k1)
└── Sender's Ephemeral Key:
    └── ephemeralPriv (32 bytes)

Process:
1. sharedSecret = ECDH(ephemeralPriv, viewingPub)
2. combinedSecret = keccak256(sharedSecret || spendPub)
3. stealthPriv = combinedSecret
4. stealthAddress = address(stealthPriv)

Output:
└── Unique Stealth Address (0x...)
```

### Stealth Private Key Derivation (Recipient)

```
Input:
├── Recipient's Keys:
│   ├── spendPriv (32 bytes)
│   └── viewingPriv (32 bytes)
└── Payment Event:
    └── ephemeralPub (33 bytes)

Process:
1. sharedSecret = ECDH(viewingPriv, ephemeralPub)
2. spendPub = getPublicKey(spendPriv)
3. combinedSecret = keccak256(sharedSecret || spendPub)
4. stealthPriv = combinedSecret

Output:
└── Stealth Private Key (can sign transactions)
```

## On-Chain Transaction Flow

### Example: Sender 1 pays Recipient

**On-Chain View**:
```
Block 12345:
├── Transaction 1:
│   ├── From: 0xABC... (Sender 1)
│   ├── To: 0xSA1... (Stealth Address - unique)
│   ├── Value: 1.5 MNT
│   └── Event: PaymentAnnouncement
│       ├── recipient: 0xXYZ... (Recipient's main wallet)
│       ├── stealthAddress: 0xSA1...
│       └── ephemeralPubKey: 0x02...
```

**Privacy Analysis**:
- ✅ Cannot link `0xSA1...` to `0xXYZ...` without viewing key
- ✅ Cannot determine if `0xSA1...` belongs to any known wallet
- ✅ Cannot link multiple stealth addresses together
- ❌ Can see `0xABC...` sent to `0xSA1...`

## Infinite Transactions Pattern

### The Privacy Amplification

When many users send payments:

```
On-Chain View:
├── Sender 1 → Stealth 0xSA1... (unique)
├── Sender 2 → Stealth 0xSA2... (unique)
├── Sender 3 → Stealth 0xSA3... (unique)
├── Sender 4 → Stealth 0xSA4... (unique)
├── Sender 5 → Stealth 0xSA5... (unique)
└── ... (infinite unique stealth addresses)

Analysis:
└── Cannot determine:
    ├── Which stealth addresses belong to same recipient
    ├── Recipient's main wallet address
    └── Payment relationships
```

**Result**: Even if Sender 1 sends to Recipient, on-chain analysis sees:
- Sender 1 → Unique Stealth Address (not Recipient's wallet)
- No way to link stealth address to Recipient without viewing key
- Among infinite other unique stealth addresses

## Implementation Details

### Frontend Components

1. **Payment.jsx** - Payment form and transaction handling
2. **stealth-crypto.js** - Cryptographic utilities (ECDH, address derivation)
3. **mantleBlockchainService.js** - Smart contract interactions
4. **mantleTransactionService.js** - MNT transfer handling

### Database Schema

- **users** - User wallet addresses and usernames
- **meta_addresses** - Stored meta addresses (spendPub + viewingPub)
- **transactions** - Payment records (sender, recipient, stealth address)
- **payment_links** - Payment link aliases

### Key Files

- `evm/contracts/StealthAddressRegistry.sol` - Registry contract
- `evm/contracts/PaymentManager.sol` - Payment manager contract
- `src/utils/stealth-crypto.js` - Cryptographic functions
- `src/lib/mantle/mantleBlockchainService.js` - Blockchain service

## Comparison: Stealth Addresses vs Mixers

| Feature | Stealth Addresses (PRIVATEPAY) | Mixers |
|---------|-------------------------------|--------|
| **Privacy Model** | Unique address per payment | Pool-based mixing |
| **On-Chain Pattern** | Sender → Unique Stealth Address | Sender → Pool → Recipient |
| **Linkage** | No link to recipient wallet | Temporal decoupling |
| **Gas Cost** | Direct transfer (low) | Pool deposit + withdrawal |
| **Scalability** | Unlimited unique addresses | Limited by pool size |
| **Trust** | Trustless (cryptographic) | Trust in pool operator |

## Security Considerations

### ✅ Secure

- **ECDH**: Industry-standard key exchange
- **secp256k1**: Same curve as Bitcoin/Ethereum
- **Unique Addresses**: Each payment uses different address
- **Viewing Keys**: Only recipient can identify payments

### ⚠️ Considerations

- **Viewing Key Security**: If viewing key is compromised, privacy is lost
- **Ephemeral Key**: Must be random and never reused
- **Event Scanning**: Recipient must scan events to find payments
- **Gas Costs**: Each withdrawal requires gas

## Future Enhancements

1. **View Hints**: Optimize event scanning with view hints
2. **Batch Withdrawals**: Withdraw from multiple stealth addresses
3. **Payment Links**: Username-based payment links (already implemented)
4. **Mobile App**: Native mobile app for payment scanning
5. **ZK Proofs**: Zero-knowledge proofs for enhanced privacy

## Mantle Network Benefits

- **Low Gas Costs**: Enables frequent stealth address creation
- **Fast Transactions**: Quick payment confirmations
- **EVM Compatible**: Standard Ethereum tooling
- **Scalable**: Handles high transaction volume

---

**Built for Mantle Global Hackathon 2025 - ZK & Privacy Track**

**Contract Addresses (Mantle Sepolia)**:
- StealthAddressRegistry: `0x6F40A56250fbB57F5a17C815BE66A36804590669`
- PaymentManager: `0x95bc083e6911DeBc46b36cDCE8996fAEB28bf9A6`
