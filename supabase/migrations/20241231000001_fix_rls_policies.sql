-- Fix RLS policies to allow anon users to insert

-- Drop existing policies and recreate with proper permissions
DROP POLICY IF EXISTS "Allow authenticated insert on payment_links" ON payment_links;
DROP POLICY IF EXISTS "Allow authenticated update on payment_links" ON payment_links;
DROP POLICY IF EXISTS "Allow anon insert on payment_links" ON payment_links;
DROP POLICY IF EXISTS "Allow anon update on payment_links" ON payment_links;

-- Allow anon insert on payment_links
CREATE POLICY "Allow anon insert on payment_links" ON payment_links 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Allow anon update on payment_links  
CREATE POLICY "Allow anon update on payment_links" ON payment_links 
  FOR UPDATE 
  TO anon
  USING (true);

-- Fix users table policies
DROP POLICY IF EXISTS "Allow authenticated insert on users" ON users;
DROP POLICY IF EXISTS "Allow anon insert on users" ON users;
CREATE POLICY "Allow anon insert on users" ON users 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Fix transactions table policies
DROP POLICY IF EXISTS "Allow authenticated insert on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated update on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow anon insert on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow anon update on transactions" ON transactions;

CREATE POLICY "Allow anon insert on transactions" ON transactions 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on transactions" ON transactions 
  FOR UPDATE 
  TO anon
  USING (true);

-- Fix meta_addresses table policies
DROP POLICY IF EXISTS "Allow authenticated insert on meta_addresses" ON meta_addresses;
DROP POLICY IF EXISTS "Allow anon insert on meta_addresses" ON meta_addresses;
CREATE POLICY "Allow anon insert on meta_addresses" ON meta_addresses 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Fix payment_announcements table policies
DROP POLICY IF EXISTS "Allow authenticated insert on payment_announcements" ON payment_announcements;
DROP POLICY IF EXISTS "Allow anon insert on payment_announcements" ON payment_announcements;
CREATE POLICY "Allow anon insert on payment_announcements" ON payment_announcements 
  FOR INSERT 
  TO anon
  WITH CHECK (true);
