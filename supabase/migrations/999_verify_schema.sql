-- ============================================================================
-- Private-Pay Mantle - Schema Verification Script
-- ============================================================================
-- Run this to verify all tables, columns, indexes, and policies are correct
-- ============================================================================

-- Check all required tables exist
DO $$
DECLARE
    missing_tables TEXT[];
    required_tables TEXT[] := ARRAY['users', 'payment_links', 'transactions', 'payment_announcements', 'meta_addresses'];
    tbl_name TEXT;
BEGIN
    FOREACH tbl_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT FROM information_schema.tables t
            WHERE t.table_schema = 'public' 
            AND t.table_name = tbl_name
        ) THEN
            missing_tables := array_append(missing_tables, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✓ All required tables exist';
    END IF;
END $$;

-- Check users table columns
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT array_agg(required.column_name) INTO missing_columns
    FROM (
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) existing
    RIGHT JOIN (
        SELECT unnest(ARRAY['id', 'wallet_address', 'username', 'created_at', 'updated_at']) AS column_name
    ) required ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;
    
    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION 'Missing columns in users table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✓ users table has all required columns';
    END IF;
END $$;

-- Check payment_links table columns
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT array_agg(required.column_name) INTO missing_columns
    FROM (
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'payment_links'
    ) existing
    RIGHT JOIN (
        SELECT unnest(ARRAY['id', 'wallet_address', 'alias', 'description', 'is_active', 'created_at', 'updated_at']) AS column_name
    ) required ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;
    
    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION 'Missing columns in payment_links table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✓ payment_links table has all required columns';
    END IF;
END $$;

-- Check transactions table columns
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT array_agg(required.column_name) INTO missing_columns
    FROM (
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) existing
    RIGHT JOIN (
        SELECT unnest(ARRAY['id', 'sender_address', 'recipient_address', 'stealth_address', 'amount', 'network', 'mantle_transaction_hash', 'mantle_block_number', 'status', 'transaction_type', 'gas_used', 'gas_price', 'created_at']) AS column_name
    ) required ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;
    
    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION 'Missing columns in transactions table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✓ transactions table has all required columns';
    END IF;
END $$;

-- Check indexes exist
DO $$
DECLARE
    missing_indexes TEXT[];
    required_indexes TEXT[] := ARRAY[
        'idx_users_wallet',
        'idx_users_username',
        'idx_payment_links_wallet',
        'idx_payment_links_alias',
        'idx_payment_links_active',
        'idx_transactions_sender',
        'idx_transactions_recipient',
        'idx_transactions_hash',
        'idx_transactions_status',
        'idx_meta_addresses_user',
        'idx_announcements_recipient',
        'idx_announcements_stealth'
    ];
    index_name TEXT;
BEGIN
    FOREACH index_name IN ARRAY required_indexes
    LOOP
        IF NOT EXISTS (
            SELECT FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname = index_name
        ) THEN
            missing_indexes := array_append(missing_indexes, index_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE WARNING 'Missing indexes: %', array_to_string(missing_indexes, ', ');
    ELSE
        RAISE NOTICE '✓ All required indexes exist';
    END IF;
END $$;

-- Check RLS is enabled
DO $$
DECLARE
    tables_without_rls TEXT[];
    required_tables TEXT[] := ARRAY['users', 'payment_links', 'transactions', 'payment_announcements', 'meta_addresses'];
    tbl_name TEXT;
BEGIN
    FOREACH tbl_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE t.schemaname = 'public' 
            AND t.tablename = tbl_name
            AND c.relrowsecurity = true
        ) THEN
            tables_without_rls := array_append(tables_without_rls, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE WARNING 'Tables without RLS enabled: %', array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE '✓ RLS is enabled on all tables';
    END IF;
END $$;

-- Check policies exist
DO $$
DECLARE
    missing_policies TEXT[];
    required_policies TEXT[] := ARRAY[
        'Allow public read access on users',
        'Allow anon insert on users',
        'Allow anon update on users',
        'Allow public read access on payment_links',
        'Allow anon insert on payment_links',
        'Allow anon update on payment_links',
        'Allow public read access on transactions',
        'Allow anon insert on transactions',
        'Allow anon update on transactions',
        'Allow public read access on meta_addresses',
        'Allow anon insert on meta_addresses',
        'Allow public read access on payment_announcements',
        'Allow anon insert on payment_announcements'
    ];
    policy_name TEXT;
BEGIN
    FOREACH policy_name IN ARRAY required_policies
    LOOP
        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE schemaname = 'public' 
            AND policyname = policy_name
        ) THEN
            missing_policies := array_append(missing_policies, policy_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_policies, 1) > 0 THEN
        RAISE WARNING 'Missing policies: %', array_to_string(missing_policies, ', ');
    ELSE
        RAISE NOTICE '✓ All required policies exist';
    END IF;
END $$;

-- Final summary
SELECT 
    'Schema Verification Complete!' AS status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_tables,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') AS total_indexes,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS total_policies;
