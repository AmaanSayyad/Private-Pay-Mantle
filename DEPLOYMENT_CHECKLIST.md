# Private-Pay Mantle - Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Setup ✅
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created from `.env.example`
- [ ] All required environment variables configured

### 2. Supabase Database Setup ✅
- [ ] Supabase project created
- [ ] Supabase URL and anon key added to `.env`
- [ ] Database migrations run (use `supabase/migrations/000_apply_all_migrations.sql`)
- [ ] Verify all tables exist:
  - [ ] `users`
  - [ ] `payment_links`
  - [ ] `transactions`
  - [ ] `payment_announcements`
  - [ ] `meta_addresses`
- [ ] RLS policies verified
- [ ] Test database connection in browser console

### 3. Smart Contract Deployment ✅
- [ ] Private key configured in `.env` (for deployment)
- [ ] Mantle Sepolia testnet RPC accessible
- [ ] Deploy StealthAddressRegistry contract:
  ```bash
  npx hardhat run scripts/deploy-mantle-contracts.ts --network mantle-sepolia
  ```
- [ ] Deploy PaymentManager contract
- [ ] Update `.env` with deployed contract addresses:
  - [ ] `VITE_MANTLE_STEALTH_REGISTRY_ADDRESS`
  - [ ] `VITE_MANTLE_PAYMENT_MANAGER_ADDRESS`
- [ ] Verify contracts on Mantlescan
- [ ] (Optional) Verify contract source code

### 4. Frontend Configuration ✅
- [ ] Treasury wallet address configured
- [ ] Website host configured
- [ ] All Mantle network settings correct
- [ ] Test wallet connection (MetaMask)
- [ ] Verify Mantle network is added to MetaMask

### 5. Testing ✅
- [ ] Application starts without errors (`npm run dev`)
- [ ] Wallet connects successfully
- [ ] Can create payment link
- [ ] Can view payment links
- [ ] Can send test payment
- [ ] Transaction appears in database
- [ ] Balance updates correctly
- [ ] Withdrawal functionality works

### 6. Hackathon Submission Preparation ✅
- [ ] README.md updated with Mantle references
- [ ] All QIE references replaced with Mantle
- [ ] Demo video prepared (3-5 minutes)
- [ ] GitHub repository public and accessible
- [ ] One-pager pitch document ready
- [ ] Team bios and contact info prepared
- [ ] Compliance declaration completed (if needed)

## Quick Start Commands

### Database Setup
```bash
# Option 1: Run consolidated migration
# Copy contents of supabase/migrations/000_apply_all_migrations.sql
# Paste into Supabase SQL Editor and run

# Option 2: Run individual migrations in order
# 1. 20241230_mantle_schema.sql
# 2. 20241230_add_transaction_type.sql
# 3. 20241231000000_add_payment_links.sql
# 4. 20241231000001_fix_rls_policies.sql
# 5. 20241231000002_add_username_to_users.sql
```

### Contract Deployment
```bash
# Set your private key
export PRIVATE_KEY=your_private_key_here

# Deploy to Mantle Sepolia
npx hardhat run scripts/deploy-mantle-contracts.ts --network mantle-sepolia

# Deploy to Mantle Mainnet (production)
npx hardhat run scripts/deploy-mantle-contracts.ts --network mantle-mainnet
```

### Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Verification Steps

### Database Verification
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should return:
-- meta_addresses
-- payment_announcements
-- payment_links
-- transactions
-- users
```

### Contract Verification
- Check contract addresses on Mantlescan:
  - Sepolia: https://sepolia.mantlescan.xyz
  - Mainnet: https://mantlescan.xyz

### Application Verification
1. Open http://localhost:5173
2. Connect MetaMask wallet
3. Switch to Mantle Sepolia Testnet
4. Check browser console for errors
5. Test creating a payment link
6. Verify data appears in Supabase dashboard

## Common Issues

### Supabase Connection Errors
- Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project is active (not paused)
- Verify RLS policies allow anon access

### Contract Deployment Errors
- Ensure you have MNT tokens in your wallet for gas
- Verify RPC URL is correct
- Check private key is set correctly

### Wallet Connection Issues
- Ensure MetaMask is installed
- Add Mantle Sepolia network to MetaMask
- Check network chain ID matches (5003 for Sepolia)

## Support

For issues or questions:
- Check `SUPABASE_SETUP.md` for database setup
- Review `README.md` for general information
- Check browser console for detailed error messages
