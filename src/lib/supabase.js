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
    })
  : null;

/**
 * Register or get user
 */
export async function registerUser(walletAddress) {
  if (!supabase) return null;
  
  try {
    // Check if user exists - use maybeSingle to avoid 406 error when no rows found
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existingUser) return existingUser;

    // Generate default username from wallet address
    const defaultUsername = walletAddress.slice(2, 8).toLowerCase();

    // Create new user with default username
    const { data, error } = await supabase
      .from('users')
      .insert({ 
        wallet_address: walletAddress,
        username: defaultUsername
      })
      .select()
      .single();

    if (error) throw error;
    
    // Also create a default payment link with the username
    try {
      await createPaymentLink({
        walletAddress: walletAddress,
        alias: defaultUsername,
        description: `Default payment link for ${defaultUsername}`
      });
      console.log('Default payment link created for:', defaultUsername);
    } catch (linkError) {
      // Ignore if payment link already exists
      if (!linkError.message?.includes('duplicate') && linkError.code !== '23505') {
        console.warn('Could not create default payment link:', linkError);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error registering user:', error);
    return null;
  }
}

/**
 * Update user username
 */
export async function updateUsername(walletAddress, newUsername) {
  if (!supabase) return null;
  
  try {
    const normalizedUsername = newUsername.toLowerCase().trim();
    
    // Check if username is available
    const available = await isAliasAvailable(normalizedUsername);
    if (!available) {
      throw new Error('Username already taken');
    }
    
    // Update user's username
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({ username: normalizedUsername })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (userError) throw userError;
    
    // Create new payment link with new username
    try {
      await createPaymentLink({
        walletAddress: walletAddress,
        alias: normalizedUsername,
        description: `Payment link for ${normalizedUsername}`
      });
    } catch (linkError) {
      // Ignore if payment link already exists
      if (!linkError.message?.includes('duplicate') && linkError.code !== '23505') {
        console.warn('Could not create payment link for new username:', linkError);
      }
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mantle_username_${walletAddress}`, normalizedUsername);
    }
    
    return user;
  } catch (error) {
    console.error('Error updating username:', error);
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
      .maybeSingle();

    if (error) throw error;
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


/**
 * Create payment link
 */
export async function createPaymentLink(linkData) {
  if (!supabase) return null;
  
  try {
    // Normalize alias to lowercase
    const normalizedAlias = linkData.alias.toLowerCase().trim();
    
    console.log('Creating payment link:', {
      wallet_address: linkData.walletAddress,
      alias: normalizedAlias,
      description: linkData.description
    });
    
    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        wallet_address: linkData.walletAddress,
        alias: normalizedAlias,
        description: linkData.description || null,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    console.log('Payment link created:', data);
    return data;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

/**
 * Get payment links for wallet address
 */
export async function getPaymentLinks(walletAddress) {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting payment links:', error);
    return [];
  }
}

/**
 * Get payment link by alias
 */
export async function getPaymentLinkByAlias(alias) {
  if (!supabase) return null;
  
  try {
    // Normalize alias to lowercase
    const normalizedAlias = alias.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('alias', normalizedAlias)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting payment link by alias:', error);
    return null;
  }
}

/**
 * Get payment totals by alias (sum of received payments)
 */
export async function getPaymentTotalsByAlias(username) {
  if (!supabase) return {};
  
  try {
    // Get all payment links for this user
    const { data: links, error: linksError } = await supabase
      .from('payment_links')
      .select('alias, wallet_address')
      .eq('is_active', true);

    if (linksError) throw linksError;
    if (!links || links.length === 0) return {};

    // Get transactions for each alias
    const totals = {};
    for (const link of links) {
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('recipient_address', link.wallet_address)
        .eq('status', 'confirmed');

      if (!txError && transactions) {
        const total = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        if (total > 0) {
          totals[link.alias] = total;
        }
      }
    }

    return totals;
  } catch (error) {
    console.error('Error getting payment totals:', error);
    return {};
  }
}

/**
 * Delete payment link
 */
export async function deletePaymentLink(linkId) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .update({ is_active: false })
      .eq('id', linkId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deleting payment link:', error);
    throw error;
  }
}

/**
 * Check if alias is available
 */
export async function isAliasAvailable(alias) {
  if (!supabase) return true;
  
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('id')
      .eq('alias', alias)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return !data; // Available if no data found
  } catch (error) {
    console.error('Error checking alias availability:', error);
    return true;
  }
}


/**
 * Get user balance (from transactions)
 * Balance = payments received - withdrawals made
 */
export async function getUserBalance(walletAddress) {
  if (!supabase) return 0;
  
  try {
    const userWallet = walletAddress.toLowerCase();
    
    console.log('Getting balance for wallet:', userWallet);
    
    // Get all confirmed payments where user is recipient
    const { data: payments, error: paymentError } = await supabase
      .from('transactions')
      .select('amount')
      .ilike('recipient_address', userWallet)
      .eq('status', 'confirmed')
      .or('transaction_type.eq.payment,transaction_type.is.null');

    if (paymentError) {
      console.error('Error fetching payments:', paymentError);
      throw paymentError;
    }
    
    // Get all confirmed withdrawals where user is sender
    const { data: withdrawals, error: withdrawError } = await supabase
      .from('transactions')
      .select('amount')
      .ilike('sender_address', userWallet)
      .eq('status', 'confirmed')
      .eq('transaction_type', 'withdrawal');

    if (withdrawError) {
      console.error('Error fetching withdrawals:', withdrawError);
      throw withdrawError;
    }
    
    console.log('Payments:', payments);
    console.log('Withdrawals:', withdrawals);
    
    // Sum payments
    const totalPayments = (payments || []).reduce((sum, tx) => {
      return sum + parseFloat(tx.amount || 0);
    }, 0);
    
    // Sum withdrawals
    const totalWithdrawals = (withdrawals || []).reduce((sum, tx) => {
      return sum + parseFloat(tx.amount || 0);
    }, 0);

    const balance = Math.max(0, totalPayments - totalWithdrawals);
    console.log('Balance:', totalPayments, '-', totalWithdrawals, '=', balance);
    
    return balance;
  } catch (error) {
    console.error('Error getting user balance:', error);
    return 0;
  }
}

/**
 * Withdraw funds (record withdrawal transaction)
 * userWalletAddress: The wallet address of the user making the withdrawal (for balance tracking)
 * toAddress: The destination address where funds are sent
 */
export async function withdrawFunds(withdrawData) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        sender_address: withdrawData.userWalletAddress, // User making withdrawal
        recipient_address: withdrawData.toAddress, // Destination
        amount: withdrawData.amount,
        network: 'mantle',
        mantle_transaction_hash: withdrawData.transactionHash,
        transaction_type: 'withdrawal', // Mark as withdrawal
        status: 'confirmed'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording withdrawal:', error);
    throw error;
  }
}

/**
 * Get user payments (transactions history)
 */
export async function getUserPayments(walletAddress) {
  if (!supabase) return [];
  
  try {
    const userWallet = walletAddress.toLowerCase();
    
    // Get all transactions where user is sender or recipient
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filter for user's transactions (case-insensitive)
    const userTransactions = (data || []).filter(tx => 
      tx.sender_address?.toLowerCase() === userWallet ||
      tx.recipient_address?.toLowerCase() === userWallet
    ).map(tx => ({
      ...tx,
      // Add helper fields for UI
      is_sent: tx.sender_address?.toLowerCase() === userWallet && tx.transaction_type !== 'withdrawal',
      is_withdrawal: tx.transaction_type === 'withdrawal',
      is_received: tx.recipient_address?.toLowerCase() === userWallet && tx.transaction_type !== 'withdrawal',
      tx_hash: tx.mantle_transaction_hash
    }));
    
    return userTransactions;
  } catch (error) {
    console.error('Error getting user payments:', error);
    return [];
  }
}

/**
 * Record payment
 */
export async function recordPayment(paymentData) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        sender_address: paymentData.senderAddress,
        recipient_address: paymentData.recipientAddress,
        stealth_address: paymentData.stealthAddress || null,
        amount: paymentData.amount,
        network: 'mantle',
        mantle_transaction_hash: paymentData.transactionHash,
        transaction_type: 'payment', // Mark as payment
        status: paymentData.status || 'confirmed'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}

/**
 * Get user by username (alias lookup)
 */
export async function getUserByUsername(username) {
  if (!supabase) return null;
  
  try {
    // Validate username input
    if (!username || typeof username !== 'string') {
      console.warn('Invalid username provided:', username);
      return null;
    }
    
    // Normalize username to lowercase
    const normalizedUsername = username.toLowerCase().trim();
    console.log('Looking up username/alias:', normalizedUsername);
    
    // First try to find payment link with this alias
    const { data: link, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('alias', normalizedUsername)
      .eq('is_active', true)
      .maybeSingle();

    console.log('Payment link lookup result:', { link, linkError });

    if (linkError) throw linkError;
    
    if (link) {
      console.log('Found payment link:', link);
      return {
        wallet_address: link.wallet_address,
        username: link.alias,
        ...link
      };
    }

    // Second: check users table by username
    const { data: userByUsername, error: usernameError } = await supabase
      .from('users')
      .select('*')
      .eq('username', normalizedUsername)
      .maybeSingle();

    console.log('User by username lookup result:', { userByUsername, usernameError });

    if (usernameError) throw usernameError;
    
    if (userByUsername) {
      return {
        ...userByUsername,
        username: userByUsername.username || normalizedUsername
      };
    }

    // Fallback: check users table by wallet address (for direct wallet lookups)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedUsername)
      .maybeSingle();

    console.log('User by wallet lookup result:', { user, userError });

    if (userError) throw userError;
    return user;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}
