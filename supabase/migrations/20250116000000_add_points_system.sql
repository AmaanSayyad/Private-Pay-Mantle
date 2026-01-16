-- Points System Migration
-- Adds comprehensive points/rewards system to PRIVATEPAY

-- User points table (tracks total points per user)
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  total_points INTEGER DEFAULT 0 NOT NULL,
  lifetime_points INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point transactions table (tracks all point earning/spending events)
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) NOT NULL,
  points INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  description TEXT,
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  related_payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points configuration table (defines point values for different actions)
CREATE TABLE IF NOT EXISTS points_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) UNIQUE NOT NULL,
  points_value INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default points configuration
INSERT INTO points_config (action_type, points_value, description) VALUES
  ('payment_sent', 10, 'Points earned for sending a payment'),
  ('payment_received', 15, 'Points earned for receiving a payment'),
  ('payment_link_created', 5, 'Points earned for creating a payment link'),
  ('first_payment', 50, 'Bonus points for first payment'),
  ('first_received', 50, 'Bonus points for first payment received'),
  ('daily_login', 2, 'Points for daily login'),
  ('transaction_streak', 5, 'Points for transaction streak'),
  ('referral_signup', 100, 'Points for referring a new user'),
  ('milestone_100', 200, 'Milestone: 100 transactions'),
  ('milestone_500', 500, 'Milestone: 500 transactions'),
  ('milestone_1000', 1000, 'Milestone: 1000 transactions')
ON CONFLICT (action_type) DO NOTHING;

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_points_wallet ON user_points(wallet_address);
CREATE INDEX IF NOT EXISTS idx_point_transactions_wallet ON point_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_config_active ON points_config(is_active) WHERE is_active = true;

-- Function to calculate user level based on lifetime points
CREATE OR REPLACE FUNCTION calculate_user_level(lifetime_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(lifetime_points / 100) + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award points to a user
CREATE OR REPLACE FUNCTION award_points(
  p_wallet_address VARCHAR(42),
  p_action_type VARCHAR(50),
  p_description TEXT DEFAULT NULL,
  p_related_transaction_id UUID DEFAULT NULL,
  p_related_payment_link_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_points_value INTEGER;
  v_current_points INTEGER;
  v_lifetime_points INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get points value for this action
  SELECT points_value INTO v_points_value
  FROM points_config
  WHERE action_type = p_action_type AND is_active = true;
  
  -- If no points configured, return 0
  IF v_points_value IS NULL OR v_points_value = 0 THEN
    RETURN 0;
  END IF;
  
  -- Get or create user_points record
  INSERT INTO user_points (wallet_address, total_points, lifetime_points)
  VALUES (p_wallet_address, v_points_value, v_points_value)
  ON CONFLICT (wallet_address) DO UPDATE
  SET 
    total_points = user_points.total_points + v_points_value,
    lifetime_points = user_points.lifetime_points + v_points_value,
    updated_at = NOW()
  RETURNING total_points, lifetime_points INTO v_current_points, v_lifetime_points;
  
  -- Calculate new level
  v_new_level := calculate_user_level(v_lifetime_points);
  
  -- Update level if changed
  UPDATE user_points
  SET level = v_new_level
  WHERE wallet_address = p_wallet_address AND level < v_new_level;
  
  -- Record point transaction
  INSERT INTO point_transactions (
    wallet_address,
    points,
    transaction_type,
    description,
    related_transaction_id,
    related_payment_link_id,
    metadata
  ) VALUES (
    p_wallet_address,
    v_points_value,
    p_action_type,
    COALESCE(p_description, (SELECT description FROM points_config WHERE action_type = p_action_type)),
    p_related_transaction_id,
    p_related_payment_link_id,
    p_metadata
  );
  
  RETURN v_points_value;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for points system
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access to user_points (for leaderboards)
DROP POLICY IF EXISTS "Allow public read access on user_points" ON user_points;
CREATE POLICY "Allow public read access on user_points"
  ON user_points FOR SELECT
  USING (true);

-- Allow users to insert their own user_points record
DROP POLICY IF EXISTS "Allow users to insert own user_points" ON user_points;
CREATE POLICY "Allow users to insert own user_points"
  ON user_points FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own user_points record
DROP POLICY IF EXISTS "Allow users to update own user_points" ON user_points;
CREATE POLICY "Allow users to update own user_points"
  ON user_points FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow users to read their own point transactions
DROP POLICY IF EXISTS "Allow users to read own point transactions" ON point_transactions;
CREATE POLICY "Allow users to read own point transactions"
  ON point_transactions FOR SELECT
  USING (true);

-- Allow public read access to points_config
DROP POLICY IF EXISTS "Allow public read access on points_config" ON points_config;
CREATE POLICY "Allow public read access on points_config"
  ON points_config FOR SELECT
  USING (is_active = true);

-- Allow anon insert on point_transactions (via function)
DROP POLICY IF EXISTS "Allow anon insert on point_transactions" ON point_transactions;
CREATE POLICY "Allow anon insert on point_transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (true);
