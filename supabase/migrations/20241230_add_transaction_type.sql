-- Add transaction_type column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) DEFAULT 'payment';

-- Update existing records (optional - set all existing as payments)
UPDATE transactions SET transaction_type = 'payment' WHERE transaction_type IS NULL;
