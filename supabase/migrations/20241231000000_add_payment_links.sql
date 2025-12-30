-- Payment Links table for Mantle Network
-- Stores user-created payment link aliases

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

CREATE POLICY "Allow public read access on payment_links" ON payment_links FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on payment_links" ON payment_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on payment_links" ON payment_links FOR UPDATE USING (true);
