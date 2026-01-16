-- Fix Points System RLS Policies
-- This migration fixes the Row Level Security policies for the points system
-- to allow users to insert and update their own points records

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to insert own user_points" ON user_points;
DROP POLICY IF EXISTS "Allow users to update own user_points" ON user_points;

-- Allow users to insert their own user_points record
CREATE POLICY "Allow users to insert own user_points"
  ON user_points FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own user_points record
CREATE POLICY "Allow users to update own user_points"
  ON user_points FOR UPDATE
  USING (true)
  WITH CHECK (true);
