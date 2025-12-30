-- Add username column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Allow anon update on users
DROP POLICY IF EXISTS "Allow anon update on users" ON users;
CREATE POLICY "Allow anon update on users" ON users 
  FOR UPDATE 
  TO anon
  USING (true);
