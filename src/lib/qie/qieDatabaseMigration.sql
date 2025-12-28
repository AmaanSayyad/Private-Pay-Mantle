-- QIE Database Migration Script
-- Creates tables for storing QIE blockchain events and monitoring state

-- Table for storing QIE payment announcement events
CREATE TABLE IF NOT EXISTS qie_payment_events (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(42) NOT NULL, -- EVM address
    meta_address_index INTEGER NOT NULL,
    ephemeral_pub_key VARCHAR(66) NOT NULL, -- 33-byte hex string
    stealth_address VARCHAR(42) NOT NULL, -- EVM address
    view_hint INTEGER NOT NULL,
    k INTEGER NOT NULL,
    amount VARCHAR(78) NOT NULL, -- Wei amount as string (up to 2^256)
    timestamp TIMESTAMP NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL, -- EVM transaction hash
    block_number BIGINT NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for efficient querying
    INDEX idx_qie_payment_recipient (recipient),
    INDEX idx_qie_payment_stealth (stealth_address),
    INDEX idx_qie_payment_tx_hash (transaction_hash),
    INDEX idx_qie_payment_block (block_number),
    INDEX idx_qie_payment_timestamp (timestamp),
    
    -- Unique constraint to prevent duplicate events
    UNIQUE KEY unique_payment_event (transaction_hash, recipient, stealth_address)
);

-- Table for storing QIE meta address registration events
CREATE TABLE IF NOT EXISTS qie_meta_address_events (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL, -- EVM address
    meta_address_index INTEGER NOT NULL,
    spend_pub_key VARCHAR(66) NOT NULL, -- 33-byte hex string
    viewing_pub_key VARCHAR(66) NOT NULL, -- 33-byte hex string
    timestamp TIMESTAMP NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL, -- EVM transaction hash
    block_number BIGINT NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for efficient querying
    INDEX idx_qie_meta_user (user_address),
    INDEX idx_qie_meta_tx_hash (transaction_hash),
    INDEX idx_qie_meta_block (block_number),
    INDEX idx_qie_meta_timestamp (timestamp),
    
    -- Unique constraint to prevent duplicate events
    UNIQUE KEY unique_meta_event (transaction_hash, user_address, meta_address_index)
);

-- Table for storing QIE stealth withdrawal events
CREATE TABLE IF NOT EXISTS qie_withdrawal_events (
    id SERIAL PRIMARY KEY,
    stealth_address VARCHAR(42) NOT NULL, -- EVM address
    recipient VARCHAR(42) NOT NULL, -- EVM address
    amount VARCHAR(78) NOT NULL, -- Wei amount as string
    timestamp TIMESTAMP NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL, -- EVM transaction hash
    block_number BIGINT NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for efficient querying
    INDEX idx_qie_withdrawal_stealth (stealth_address),
    INDEX idx_qie_withdrawal_recipient (recipient),
    INDEX idx_qie_withdrawal_tx_hash (transaction_hash),
    INDEX idx_qie_withdrawal_block (block_number),
    INDEX idx_qie_withdrawal_timestamp (timestamp),
    
    -- Unique constraint to prevent duplicate events
    UNIQUE KEY unique_withdrawal_event (transaction_hash, stealth_address)
);

-- Table for storing event monitor state
CREATE TABLE IF NOT EXISTS qie_monitor_state (
    id SERIAL PRIMARY KEY,
    monitor_name VARCHAR(50) NOT NULL UNIQUE,
    last_processed_block BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Index for efficient querying
    INDEX idx_qie_monitor_name (monitor_name)
);

-- Insert initial monitor state
INSERT INTO qie_monitor_state (monitor_name, last_processed_block) 
VALUES ('payment_events', 0) 
ON DUPLICATE KEY UPDATE monitor_name = monitor_name;

-- Table for storing QIE transaction data (enhanced from existing payments table)
CREATE TABLE IF NOT EXISTS qie_transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE, -- EVM transaction hash
    from_address VARCHAR(42) NOT NULL, -- EVM address
    to_address VARCHAR(42), -- EVM address (can be null for contract creation)
    value VARCHAR(78) NOT NULL, -- Wei amount as string
    gas_limit VARCHAR(20) NOT NULL,
    gas_price VARCHAR(20),
    gas_used VARCHAR(20),
    effective_gas_price VARCHAR(20),
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    transaction_index INTEGER NOT NULL,
    status INTEGER NOT NULL, -- 1 for success, 0 for failure
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for efficient querying
    INDEX idx_qie_tx_hash (transaction_hash),
    INDEX idx_qie_tx_from (from_address),
    INDEX idx_qie_tx_to (to_address),
    INDEX idx_qie_tx_block (block_number),
    INDEX idx_qie_tx_timestamp (timestamp),
    INDEX idx_qie_tx_status (status)
);

-- Update existing users table to include QIE address and additional fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS qie_address VARCHAR(42);
ALTER TABLE users ADD COLUMN IF NOT EXISTS qie_meta_address_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_qie_activity TIMESTAMP;
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_qie_address (qie_address);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_qie_activity (last_qie_activity);

-- Update existing meta_addresses table to include QIE address and network info
ALTER TABLE meta_addresses ADD COLUMN IF NOT EXISTS qie_address VARCHAR(42);
ALTER TABLE meta_addresses ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'aptos';
ALTER TABLE meta_addresses ADD COLUMN IF NOT EXISTS qie_spend_pub_key VARCHAR(66);
ALTER TABLE meta_addresses ADD COLUMN IF NOT EXISTS qie_viewing_pub_key VARCHAR(66);
ALTER TABLE meta_addresses ADD INDEX IF NOT EXISTS idx_meta_qie_address (qie_address);
ALTER TABLE meta_addresses ADD INDEX IF NOT EXISTS idx_meta_network (network);

-- Update existing payments table to include QIE transaction data and gas info
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qie_transaction_hash VARCHAR(66);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qie_block_number BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gas_used VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gas_price VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS effective_gas_price VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gas_limit VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'aptos'; -- Distinguish between networks
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qie_stealth_address VARCHAR(42);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qie_amount_wei VARCHAR(78); -- Store QIE amounts in wei

-- Add indexes for new payment columns
ALTER TABLE payments ADD INDEX IF NOT EXISTS idx_payments_qie_tx (qie_transaction_hash);
ALTER TABLE payments ADD INDEX IF NOT EXISTS idx_payments_qie_block (qie_block_number);
ALTER TABLE payments ADD INDEX IF NOT EXISTS idx_payments_network (network);
ALTER TABLE payments ADD INDEX IF NOT EXISTS idx_payments_qie_stealth (qie_stealth_address);
ALTER TABLE payments ADD INDEX IF NOT EXISTS idx_payments_gas_used (gas_used);
ALTER TABLE payments ADD INDEX IF NOT EXISTS idx_payments_gas_price (gas_price);

-- Create QIE contracts configuration table
CREATE TABLE IF NOT EXISTS qie_contracts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    address VARCHAR(42) NOT NULL, -- EVM address
    abi JSON NOT NULL,
    deployed_at TIMESTAMP DEFAULT NOW(),
    chain_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_qie_contracts_name (name),
    INDEX idx_qie_contracts_address (address),
    INDEX idx_qie_contracts_chain (chain_id),
    
    -- Unique constraint
    UNIQUE KEY unique_contract (name, chain_id)
);

-- Create QIE network configuration table
CREATE TABLE IF NOT EXISTS qie_network_config (
    id SERIAL PRIMARY KEY,
    network_name VARCHAR(20) NOT NULL,
    chain_id INTEGER NOT NULL UNIQUE,
    rpc_url VARCHAR(255) NOT NULL,
    explorer_url VARCHAR(255) NOT NULL,
    native_currency_name VARCHAR(10) NOT NULL,
    native_currency_symbol VARCHAR(10) NOT NULL,
    native_currency_decimals INTEGER NOT NULL DEFAULT 18,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_qie_network_chain (chain_id),
    INDEX idx_qie_network_active (is_active)
);

-- Insert QIE testnet configuration with correct chain ID from environment
INSERT INTO qie_network_config (
    network_name, chain_id, rpc_url, explorer_url,
    native_currency_name, native_currency_symbol, native_currency_decimals, is_active
) VALUES (
    'QIE Testnet', 35441, 'https://rpc1testnet.qie.digital/', 'https://testnet.qie.digital',
    'QIE', 'QIE', 18, true
) ON DUPLICATE KEY UPDATE 
    network_name = VALUES(network_name),
    rpc_url = VALUES(rpc_url),
    explorer_url = VALUES(explorer_url),
    is_active = VALUES(is_active);

-- Insert QIE contract configurations
INSERT INTO qie_contracts (name, address, abi, chain_id) VALUES 
('StealthAddressRegistry', '0x084e08c8011ed2b519ac844836c49efa944c5921', '[]', 35441),
('PaymentManager', '0x0ab4d2d7642d2ac00206042b87bfc82a6f96737b', '[]', 35441)
ON DUPLICATE KEY UPDATE 
    address = VALUES(address),
    is_active = VALUES(is_active);

-- Create table for tracking QIE wallet connections and sessions
CREATE TABLE IF NOT EXISTS qie_wallet_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    qie_address VARCHAR(42) NOT NULL,
    wallet_type VARCHAR(20) NOT NULL DEFAULT 'metamask', -- metamask, walletconnect, etc.
    connected_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    session_data JSON,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_qie_wallet_user (user_id),
    INDEX idx_qie_wallet_address (qie_address),
    INDEX idx_qie_wallet_active (is_active),
    INDEX idx_qie_wallet_activity (last_activity),
    
    -- Foreign key constraint (if users table exists)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create table for QIE gas price tracking (for optimization)
CREATE TABLE IF NOT EXISTS qie_gas_tracker (
    id SERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL,
    gas_price VARCHAR(20) NOT NULL,
    base_fee VARCHAR(20),
    priority_fee VARCHAR(20),
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_qie_gas_block (block_number),
    INDEX idx_qie_gas_timestamp (timestamp),
    INDEX idx_qie_gas_price (gas_price)
);

-- User Migration Tracking Tables
-- These tables track the migration of users from Aptos to QIE network

-- Table for tracking user migrations
CREATE TABLE IF NOT EXISTS user_migrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    aptos_address VARCHAR(66) NOT NULL, -- Aptos address format
    qie_address VARCHAR(42) NOT NULL, -- EVM address format
    migration_status VARCHAR(20) NOT NULL DEFAULT 'not_started',
    migration_data JSON, -- Detailed migration step results
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for efficient querying
    INDEX idx_user_migrations_user (user_id),
    INDEX idx_user_migrations_aptos (aptos_address),
    INDEX idx_user_migrations_qie (qie_address),
    INDEX idx_user_migrations_status (migration_status),
    INDEX idx_user_migrations_started (started_at),
    INDEX idx_user_migrations_completed (completed_at),
    
    -- Unique constraint to prevent duplicate migrations
    UNIQUE KEY unique_user_migration (aptos_address, qie_address),
    
    -- Foreign key constraint (if users table exists)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table for tracking meta address migrations
CREATE TABLE IF NOT EXISTS meta_address_migrations (
    id SERIAL PRIMARY KEY,
    user_migration_id INTEGER NOT NULL,
    original_meta_address_id INTEGER,
    aptos_spend_key VARCHAR(66),
    aptos_viewing_key VARCHAR(66),
    qie_spend_key VARCHAR(66) NOT NULL,
    qie_viewing_key VARCHAR(66) NOT NULL,
    migration_timestamp TIMESTAMP DEFAULT NOW(),
    privacy_preserved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_meta_migration_user (user_migration_id),
    INDEX idx_meta_migration_original (original_meta_address_id),
    INDEX idx_meta_migration_qie_spend (qie_spend_key),
    INDEX idx_meta_migration_qie_viewing (qie_viewing_key),
    INDEX idx_meta_migration_timestamp (migration_timestamp),
    
    -- Foreign key constraint
    FOREIGN KEY (user_migration_id) REFERENCES user_migrations(id) ON DELETE CASCADE
);

-- Table for tracking payment link migrations
CREATE TABLE IF NOT EXISTS payment_link_migrations (
    id SERIAL PRIMARY KEY,
    user_migration_id INTEGER NOT NULL,
    original_payment_link_id INTEGER NOT NULL,
    alias VARCHAR(100) NOT NULL,
    aptos_wallet_address VARCHAR(66),
    qie_wallet_address VARCHAR(42) NOT NULL,
    original_meta_data JSON,
    qie_meta_data JSON NOT NULL,
    qie_stealth_data JSON NOT NULL,
    qie_qr_data JSON NOT NULL,
    migration_timestamp TIMESTAMP DEFAULT NOW(),
    link_updated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_payment_migration_user (user_migration_id),
    INDEX idx_payment_migration_original (original_payment_link_id),
    INDEX idx_payment_migration_alias (alias),
    INDEX idx_payment_migration_qie_address (qie_wallet_address),
    INDEX idx_payment_migration_timestamp (migration_timestamp),
    
    -- Foreign key constraint
    FOREIGN KEY (user_migration_id) REFERENCES user_migrations(id) ON DELETE CASCADE,
    FOREIGN KEY (original_payment_link_id) REFERENCES payment_links(id) ON DELETE CASCADE
);

-- Table for tracking cross-network privacy preservation
CREATE TABLE IF NOT EXISTS privacy_preservation_log (
    id SERIAL PRIMARY KEY,
    user_migration_id INTEGER NOT NULL,
    privacy_check_type VARCHAR(50) NOT NULL, -- 'meta_address_unlinkability', 'stealth_address_isolation', etc.
    aptos_data_hash VARCHAR(64), -- Hash of Aptos data for verification
    qie_data_hash VARCHAR(64), -- Hash of QIE data for verification
    unlinkability_preserved BOOLEAN NOT NULL,
    check_timestamp TIMESTAMP DEFAULT NOW(),
    check_details JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_privacy_log_user (user_migration_id),
    INDEX idx_privacy_log_type (privacy_check_type),
    INDEX idx_privacy_log_preserved (unlinkability_preserved),
    INDEX idx_privacy_log_timestamp (check_timestamp),
    
    -- Foreign key constraint
    FOREIGN KEY (user_migration_id) REFERENCES user_migrations(id) ON DELETE CASCADE
);

-- Add migration tracking columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) DEFAULT 'not_migrated';
ALTER TABLE users ADD COLUMN IF NOT EXISTS migration_started_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS migration_completed_at TIMESTAMP;
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_migration_status (migration_status);

ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) DEFAULT 'not_migrated';
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS original_aptos_address VARCHAR(66);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP;
ALTER TABLE payment_links ADD INDEX IF NOT EXISTS idx_payment_links_migration (migration_status);
ALTER TABLE payment_links ADD INDEX IF NOT EXISTS idx_payment_links_aptos (original_aptos_address);

-- Create view for migration summary
CREATE OR REPLACE VIEW migration_summary AS
SELECT 
    um.id as migration_id,
    um.aptos_address,
    um.qie_address,
    um.migration_status,
    um.started_at,
    um.completed_at,
    u.username,
    u.created_at as user_created_at,
    COUNT(mam.id) as meta_addresses_migrated,
    COUNT(plm.id) as payment_links_migrated,
    COUNT(ppl.id) as privacy_checks_passed
FROM user_migrations um
LEFT JOIN users u ON um.user_id = u.id
LEFT JOIN meta_address_migrations mam ON um.id = mam.user_migration_id
LEFT JOIN payment_link_migrations plm ON um.id = plm.user_migration_id
LEFT JOIN privacy_preservation_log ppl ON um.id = ppl.user_migration_id AND ppl.unlinkability_preserved = TRUE
GROUP BY um.id, um.aptos_address, um.qie_address, um.migration_status, um.started_at, um.completed_at, u.username, u.created_at;

-- Insert initial migration status for existing users
UPDATE users SET migration_status = 'pending' WHERE qie_address IS NULL AND wallet_address IS NOT NULL;
UPDATE users SET migration_status = 'completed' WHERE qie_address IS NOT NULL AND wallet_address IS NOT NULL;