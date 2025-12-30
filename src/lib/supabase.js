import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing - database features will be disabled');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'public' },
      auth: { persistSession: false },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    })
  : null;

/**
 * Register or get user
 */
export async function registerUser(walletAddress) {
  if (!supabase) return null;
  
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) return existingUser;

    const { data, error } = await supabase
      .from('users')
      .insert([{ wallet_address: walletAddress }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Save meta address
 */
export async function saveMetaAddress(userId, spendPubKey, viewingPubKey, index) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('meta_addresses')
      .insert([{
        user_id: userId,
        spend_pub_key: spendPubKey,
        viewing_pub_key: viewingPubKey,
        index
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving meta address:', error);
    throw error;
  }
}

/**
 * Get meta addresses for user
 */
export async function getMetaAddresses(userId) {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('meta_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting meta addresses:', error);
    return [];
  }
}

/**
 * Record transaction (always marks as Mantle network)
 */
export async function recordTransaction(transactionData) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        sender_address: transactionData.senderAddress,
        recipient_address: transactionData.recipientAddress,
        stealth_address: transactionData.stealthAddress,
        amount: transactionData.amount,
        network: 'mantle',
        mantle_transaction_hash: transactionData.transactionHash,
        mantle_block_number: transactionData.blockNumber,
        status: transactionData.status || 'pending',
        gas_used: transactionData.gasUsed,
        gas_price: transactionData.gasPrice
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording transaction:', error);
    throw error;
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(transactionHash, status, additionalData = {}) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status, ...additionalData })
      .eq('mantle_transaction_hash', transactionHash)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

/**
 * Get transactions for address
 */
export async function getTransactions(address) {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`sender_address.eq.${address},recipient_address.eq.${address}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

/**
 * Record payment announcement
 */
export async function recordPaymentAnnouncement(announcementData) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('payment_announcements')
      .insert([{
        recipient_address: announcementData.recipientAddress,
        meta_address_index: announcementData.metaAddressIndex,
        ephemeral_pub_key: announcementData.ephemeralPubKey,
        stealth_address: announcementData.stealthAddress,
        view_hint: announcementData.viewHint,
        k: announcementData.k,
        amount: announcementData.amount,
        mantle_transaction_hash: announcementData.transactionHash,
        mantle_block_number: announcementData.blockNumber
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording payment announcement:', error);
    throw error;
  }
}

/**
 * Get payment announcements for recipient
 */
export async function getPaymentAnnouncements(recipientAddress) {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('payment_announcements')
      .select('*')
      .eq('recipient_address', recipientAddress)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting payment announcements:', error);
    return [];
  }
}

export default supabase;
