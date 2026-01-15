-- Mantle Network Database Schema
-- Migration for Private Pay on Mantle Network

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

-- Allow authenticated insert/update
DROP POLICY IF EXISTS "Allow authenticated insert on users" ON users;
CREATE POLICY "Allow authenticated insert on users" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert on meta_addresses" ON meta_addresses;
CREATE POLICY "Allow authenticated insert on meta_addresses" ON meta_addresses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert on transactions" ON transactions;
CREATE POLICY "Allow authenticated insert on transactions" ON transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert on payment_announcements" ON payment_announcements;
CREATE POLICY "Allow authenticated insert on payment_announcements" ON payment_announcements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on transactions" ON transactions;
CREATE POLICY "Allow authenticated update on transactions" ON transactions FOR UPDATE USING (true);
