# Supabase Setup Guide for Private-Pay Mantle

## Quick Setup for Mantle Hackathon

### Option 1: Create a New Supabase Project (Recommended)

1. **Go to [Supabase](https://supabase.com)** and sign in
2. **Create a new project:**
   - Click "New Project"
   - Name: `private-pay-mantle` (or any name you prefer)
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to you
   - Click "Create new project"

3. **Wait for project to be ready** (takes 1-2 minutes)

4. **Get your credentials:**
   - Go to Project Settings → API
   - Copy the **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - Copy the **anon/public key** (starts with `eyJhbGci...`)

5. **Update your `.env` file:**
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

6. **Run database migrations:**
   ```bash
   # If you have Supabase CLI installed:
   supabase db push
   
   # Or manually run the SQL files in supabase/migrations/ in order:
   # 1. 20241230_mantle_schema.sql
   # 2. 20241230_add_transaction_type.sql
   # 3. 20241231000000_add_payment_links.sql
   # 4. 20241231000001_fix_rls_policies.sql
   # 5. 20241231000002_add_username_to_users.sql
   ```

### Option 2: Use Local Supabase (For Development)

If you have Supabase CLI installed:

```bash
# Start local Supabase
supabase start

# This will give you local URLs:
# API URL: http://127.0.0.1:54321
# Anon key: (shown in output)

# Update .env:
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### Verify Setup

After updating `.env`, restart your dev server:

```bash
# Stop current server (Ctrl+C)
npm run dev
```

Check the browser console - you should no longer see `ERR_NAME_NOT_RESOLVED` errors.

## Database Schema

The project requires these tables:
- `users` - User accounts
- `payment_links` - Payment link aliases
- `transactions` - Transaction history
- `payment_announcements` - Stealth address announcements
- `meta_addresses` - Stealth address metadata

All migrations are in `supabase/migrations/` directory.
