# Quick Start - Supabase Setup

## Step 1: Run the Complete Migration

**IMPORTANT:** Run the consolidated migration FIRST before running the verification script.

1. In Supabase SQL Editor, open or create a new query
2. Copy the entire contents of `supabase/migrations/000_apply_all_migrations.sql`
3. Paste it into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for it to complete successfully

This will create all tables, columns, indexes, and policies in the correct order.

## Step 2: Verify the Schema

After the migration completes successfully:

1. Open `supabase/migrations/999_verify_schema.sql` in the SQL Editor
2. Click **Run**
3. You should see success messages like:
   - ✓ All required tables exist
   - ✓ users table has all required columns
   - ✓ payment_links table has all required columns
   - ✓ transactions table has all required columns
   - ✓ All required indexes exist
   - ✓ RLS is enabled on all tables
   - ✓ All required policies exist
   - Schema Verification Complete!

## Migration Order

If you prefer to run migrations individually, run them in this order:

1. `20241230_mantle_schema.sql` - Core schema
2. `20241230_add_transaction_type.sql` - Add transaction_type column
3. `20241231000000_add_payment_links.sql` - Payment links table
4. `20241231000001_fix_rls_policies.sql` - Fix RLS policies
5. `20241231000002_add_username_to_users.sql` - Add username column

**OR** just run `000_apply_all_migrations.sql` which includes all of them in the correct order.

## Troubleshooting

### Error: "Missing columns in transactions table: transaction_type"
**Solution:** You haven't run the migration yet. Run `000_apply_all_migrations.sql` first.

### Error: "relation already exists"
**Solution:** Some tables already exist. The migration uses `IF NOT EXISTS` so it's safe to run again. Just continue.

### Error: "policy already exists"
**Solution:** Some policies already exist. The migration uses `IF NOT EXISTS` or `DROP POLICY IF EXISTS` so it's safe to run again.

## After Migration

Once migrations are complete:
1. Update your `.env` file with Supabase credentials
2. Restart your dev server: `npm run dev`
3. Test the application
