-- ============================================================================
-- Private-Pay Mantle - Complete Database Migration
-- ============================================================================
-- This file applies all migrations in the correct order for Mantle Network
-- Run this file in Supabase SQL Editor to set up the complete database schema
-- ============================================================================

-- Migration 1: Core Schema (20241230_mantle_schema.sql)
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meta addresses table
CREATE TABLE IF NOT EXISTS meta_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  spend_pub_key VARCHAR(68) NOT NULL,
  viewing_pub_key VARCHAR(68) NOT NULL,
  index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, index)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_address VARCHAR(42) NOT NULL,
  recipient_address VARCHAR(42) NOT NULL,
  stealth_address VARCHAR(42),
  amount DECIMAL(36, 18) NOT NULL,
  network VARCHAR(20) DEFAULT 'mantle',
  mantle_transaction_hash VARCHAR(66) UNIQUE,
  mantle_block_number BIGINT,
  status VARCHAR(20) DEFAULT 'pending',
  gas_used BIGINT,
  gas_price BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment announcements table
CREATE TABLE IF NOT EXISTS payment_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_address VARCHAR(42) NOT NULL,
  meta_address_index INTEGER NOT NULL,
  ephemeral_pub_key VARCHAR(68) NOT NULL,
  stealth_address VARCHAR(42) NOT NULL,
  view_hint INTEGER NOT NULL,
  k INTEGER NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  mantle_transaction_hash VARCHAR(66),
  mantle_block_number BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_meta_addresses_user ON meta_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_address);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient_address);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(mantle_transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_announcements_recipient ON payment_announcements(recipient_address);
CREATE INDEX IF NOT EXISTS idx_announcements_stealth ON payment_announcements(stealth_address);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_announcements ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access on users" ON users;
CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on meta_addresses" ON meta_addresses;
CREATE POLICY "Allow public read access on meta_addresses" ON meta_addresses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on transactions" ON transactions;
CREATE POLICY "Allow public read access on transactions" ON transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on payment_announcements" ON payment_announcements;
CREATE POLICY "Allow public read access on payment_announcements" ON payment_announcements FOR SELECT USING (true);

-- Migration 2: Add transaction_type column (20241230_add_transaction_type.sql)
-- ============================================================================

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) DEFAULT 'payment';

-- Update existing records (optional - set all existing as payments)
UPDATE transactions SET transaction_type = 'payment' WHERE transaction_type IS NULL;

-- Migration 3: Payment Links table (20241231000000_add_payment_links.sql)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) NOT NULL,
  alias VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_links_wallet ON payment_links(wallet_address);
CREATE INDEX IF NOT EXISTS idx_payment_links_alias ON payment_links(alias);
CREATE INDEX IF NOT EXISTS idx_payment_links_active ON payment_links(is_active);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_payment_links_updated_at ON payment_links;
CREATE TRIGGER update_payment_links_updated_at
    BEFORE UPDATE ON payment_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on payment_links" ON payment_links;
CREATE POLICY "Allow public read access on payment_links" ON payment_links FOR SELECT USING (true);

-- Migration 4: Fix RLS policies (20241231000001_fix_rls_policies.sql)
-- ============================================================================

-- Drop existing policies and recreate with proper permissions
DROP POLICY IF EXISTS "Allow authenticated insert on payment_links" ON payment_links;
DROP POLICY IF EXISTS "Allow authenticated update on payment_links" ON payment_links;
DROP POLICY IF EXISTS "Allow authenticated insert on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated update on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated insert on meta_addresses" ON meta_addresses;
DROP POLICY IF EXISTS "Allow authenticated insert on payment_announcements" ON payment_announcements;

-- Allow anon insert on payment_links
DROP POLICY IF EXISTS "Allow anon insert on payment_links" ON payment_links;
CREATE POLICY "Allow anon insert on payment_links" ON payment_links 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Allow anon update on payment_links  
DROP POLICY IF EXISTS "Allow anon update on payment_links" ON payment_links;
CREATE POLICY "Allow anon update on payment_links" ON payment_links 
  FOR UPDATE 
  TO anon
  USING (true);

-- Fix users table policies
DROP POLICY IF EXISTS "Allow anon insert on users" ON users;
CREATE POLICY "Allow anon insert on users" ON users 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Fix transactions table policies
DROP POLICY IF EXISTS "Allow anon insert on transactions" ON transactions;
CREATE POLICY "Allow anon insert on transactions" ON transactions 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on transactions" ON transactions;
CREATE POLICY "Allow anon update on transactions" ON transactions 
  FOR UPDATE 
  TO anon
  USING (true);

-- Fix meta_addresses table policies
DROP POLICY IF EXISTS "Allow anon insert on meta_addresses" ON meta_addresses;
CREATE POLICY "Allow anon insert on meta_addresses" ON meta_addresses 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Fix payment_announcements table policies
DROP POLICY IF EXISTS "Allow anon insert on payment_announcements" ON payment_announcements;
CREATE POLICY "Allow anon insert on payment_announcements" ON payment_announcements 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Migration 5: Add username to users (20241231000002_add_username_to_users.sql)
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Allow anon update on users
DROP POLICY IF EXISTS "Allow anon update on users" ON users;
CREATE POLICY "Allow anon update on users" ON users 
  FOR UPDATE 
  TO anon
  USING (true);

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- All tables, indexes, triggers, and RLS policies have been created.
-- Your database is now ready for Private-Pay Mantle application.
-- ============================================================================
