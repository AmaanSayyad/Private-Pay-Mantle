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
    
    // Award points for creating payment link
    if (linkData.walletAddress) {
      try {
        await awardPoints(linkData.walletAddress, 'payment_link_created', {
          relatedPaymentLinkId: data.id,
          description: `Payment link created: ${normalizedAlias}`
        });
      } catch (pointsError) {
        console.warn('Error awarding points for payment link:', pointsError);
      }
    }
    
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
    
    // Award points for payment sent
    if (paymentData.senderAddress) {
      try {
        // Check if this is first payment
        const { count } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('sender_address', paymentData.senderAddress)
          .eq('transaction_type', 'payment');
        
        await awardPoints(paymentData.senderAddress, 'payment_sent', {
          relatedTransactionId: data.id,
          description: `Payment sent: ${paymentData.amount} MNT`
        });
        
        // First payment bonus
        if (count === 1) {
          await awardPoints(paymentData.senderAddress, 'first_payment', {
            relatedTransactionId: data.id,
            description: 'First payment bonus!'
          });
        }
      } catch (pointsError) {
        console.warn('Error awarding points for payment sent:', pointsError);
      }
    }
    
    // Award points for payment received
    if (paymentData.recipientAddress) {
      try {
        // Check if this is first received payment
        const { count } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_address', paymentData.recipientAddress)
          .eq('transaction_type', 'payment');
        
        await awardPoints(paymentData.recipientAddress, 'payment_received', {
          relatedTransactionId: data.id,
          description: `Payment received: ${paymentData.amount} MNT`
        });
        
        // First received bonus
        if (count === 1) {
          await awardPoints(paymentData.recipientAddress, 'first_received', {
            relatedTransactionId: data.id,
            description: 'First payment received bonus!'
          });
        }
      } catch (pointsError) {
        console.warn('Error awarding points for payment received:', pointsError);
      }
    }
    
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

// ============================================================================
// POINTS SYSTEM FUNCTIONS
// ============================================================================

/**
 * Get user points
 */
export async function getUserPoints(walletAddress) {
  if (!supabase) return { totalPoints: 0, lifetimePoints: 0, level: 1 };
  
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      // Create initial points record
      const { data: newData, error: insertError } = await supabase
        .from('user_points')
        .insert([{
          wallet_address: walletAddress.toLowerCase(),
          total_points: 0,
          lifetime_points: 0,
          level: 1
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      return {
        totalPoints: newData.total_points || 0,
        lifetimePoints: newData.lifetime_points || 0,
        level: newData.level || 1
      };
    }
    
    return {
      totalPoints: data.total_points || 0,
      lifetimePoints: data.lifetime_points || 0,
      level: data.level || 1
    };
  } catch (error) {
    console.error('Error getting user points:', error);
    return { totalPoints: 0, lifetimePoints: 0, level: 1 };
  }
}

/**
 * Award points to a user (calls database function)
 */
export async function awardPoints(walletAddress, actionType, options = {}) {
  if (!supabase) return 0;
  
  try {
    const { data, error } = await supabase.rpc('award_points', {
      p_wallet_address: walletAddress.toLowerCase(),
      p_action_type: actionType,
      p_description: options.description || null,
      p_related_transaction_id: options.relatedTransactionId || null,
      p_related_payment_link_id: options.relatedPaymentLinkId || null,
      p_metadata: options.metadata || null
    });
    
    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error awarding points:', error);
    return 0;
  }
}

/**
 * Get points history for a user
 */
export async function getPointsHistory(walletAddress, limit = 50) {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting points history:', error);
    return [];
  }
}

/**
 * Get points leaderboard
 */
export async function getPointsLeaderboard(limit = 100) {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('wallet_address, total_points, lifetime_points, level')
      .order('lifetime_points', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Get points configuration
 */
export async function getPointsConfig() {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('points_config')
      .select('*')
      .eq('is_active', true)
      .order('points_value', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting points config:', error);
    return [];
  }
}

// ============================================================================
// PAYMENT ANALYTICS FUNCTIONS (Privacy-Preserving)
// ============================================================================

/**
 * Get aggregated payment analytics for a user (privacy-preserving)
 * Returns only aggregated data - no individual transaction details
 */
export async function getPaymentAnalytics(walletAddress) {
  if (!supabase) return null;
  
  try {
    const userWallet = walletAddress.toLowerCase();
    
    // Get all confirmed payments received by this user
    const { data: receivedPayments, error: receivedError } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .ilike('recipient_address', userWallet)
      .eq('status', 'confirmed')
      .or('transaction_type.eq.payment,transaction_type.is.null')
      .order('created_at', { ascending: true });
    
    if (receivedError) throw receivedError;
    
    const payments = receivedPayments || [];
    
    if (payments.length === 0) {
      return {
        totalReceived: 0,
        totalPayments: 0,
        averagePaymentSize: 0,
        largestPayment: 0,
        smallestPayment: 0,
        paymentFrequency: {
          daily: [],
          weekly: [],
          monthly: []
        },
        recentActivity: []
      };
    }
    
    // Calculate aggregates
    const amounts = payments.map(p => parseFloat(p.amount || 0));
    const totalReceived = amounts.reduce((sum, amt) => sum + amt, 0);
    const totalPayments = payments.length;
    const averagePaymentSize = totalReceived / totalPayments;
    const largestPayment = Math.max(...amounts);
    const smallestPayment = Math.min(...amounts);
    
    // Group by day (last 30 days)
    const dailyData = {};
    const weeklyData = {};
    const monthlyData = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.created_at);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = getWeekKey(date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const amount = parseFloat(payment.amount || 0);
      
      // Daily aggregation
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { date: dayKey, count: 0, total: 0 };
      }
      dailyData[dayKey].count += 1;
      dailyData[dayKey].total += amount;
      
      // Weekly aggregation
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, count: 0, total: 0 };
      }
      weeklyData[weekKey].count += 1;
      weeklyData[weekKey].total += amount;
      
      // Monthly aggregation
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, count: 0, total: 0 };
      }
      monthlyData[monthKey].count += 1;
      monthlyData[monthKey].total += amount;
    });
    
    // Convert to arrays and sort
    const dailyArray = Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 days
    
    const weeklyArray = Object.values(weeklyData)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12); // Last 12 weeks
    
    const monthlyArray = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
    
    // Recent activity (last 7 days aggregated)
    const recentDays = dailyArray.slice(-7);
    
    return {
      totalReceived,
      totalPayments,
      averagePaymentSize,
      largestPayment,
      smallestPayment,
      paymentFrequency: {
        daily: dailyArray,
        weekly: weeklyArray,
        monthly: monthlyArray
      },
      recentActivity: recentDays
    };
  } catch (error) {
    console.error('Error getting payment analytics:', error);
    return null;
  }
}

/**
 * Helper function to get week key (YYYY-WW format)
 */
function getWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
