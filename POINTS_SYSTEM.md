# PRIVATEPAY Points & Rewards System

## Overview

PRIVATEPAY includes a comprehensive points and rewards system that gamifies the user experience and incentivizes engagement with the platform. Users earn points for various actions and can track their progress through levels and leaderboards.

## Features

### 🎯 Point Earning Actions

Users can earn points through:

1. **Payment Sent** - 10 points per payment
2. **Payment Received** - 15 points per payment
3. **Payment Link Created** - 5 points per link
4. **First Payment** - 50 bonus points (one-time)
5. **First Payment Received** - 50 bonus points (one-time)
6. **Daily Login** - 2 points (future feature)
7. **Transaction Streak** - 5 points (future feature)
8. **Referral Signup** - 100 points (future feature)
9. **Milestones** - Bonus points at 100, 500, 1000 transactions

### 📊 Level System

Users progress through levels based on lifetime points:
- **Level 1**: 0-99 points
- **Level 2**: 100-199 points
- **Level 3**: 200-299 points
- And so on... (Level = floor(lifetime_points / 100) + 1)

### 🏆 Leaderboards

Users can view top performers ranked by lifetime points, encouraging healthy competition and engagement.

## Database Schema

### Tables

1. **user_points** - Tracks total and lifetime points per user
   - `wallet_address` (unique)
   - `total_points` - Current available points
   - `lifetime_points` - All-time accumulated points
   - `level` - Current user level

2. **point_transactions** - History of all point events
   - `wallet_address`
   - `points` - Points earned/spent
   - `transaction_type` - Action type
   - `description` - Human-readable description
   - `related_transaction_id` - Link to payment transaction
   - `related_payment_link_id` - Link to payment link
   - `metadata` - Additional JSON data

3. **points_config** - Configurable point values
   - `action_type` - Type of action
   - `points_value` - Points awarded
   - `description` - Action description
   - `is_active` - Enable/disable action

### Database Functions

- **`award_points()`** - Awards points to a user and records transaction
- **`calculate_user_level()`** - Calculates level from lifetime points

## Implementation

### Frontend Components

1. **PointsCard** (`Dashboard.jsx`) - Displays points summary on dashboard
2. **PointsPage** - Full points history and leaderboard page
3. **Points Store** (`points-store.js`) - Zustand store for state management

### Backend Functions (`supabase.js`)

- `getUserPoints(walletAddress)` - Get user's points data
- `awardPoints(walletAddress, actionType, options)` - Award points
- `getPointsHistory(walletAddress, limit)` - Get points transaction history
- `getPointsLeaderboard(limit)` - Get top users by points
- `getPointsConfig()` - Get points configuration

### Integration Points

Points are automatically awarded when:
- ✅ Payment is sent (`recordPayment`)
- ✅ Payment is received (`recordPayment`)
- ✅ Payment link is created (`createPaymentLink`)
- ✅ First payment bonus (automatic check)
- ✅ First received bonus (automatic check)

## Usage

### Awarding Points

```javascript
import { awardPoints } from '../lib/supabase.js';

// Award points for a custom action
await awardPoints(walletAddress, 'payment_sent', {
  description: 'Payment sent: 1.5 MNT',
  relatedTransactionId: transactionId,
  metadata: { amount: 1.5 }
});
```

### Displaying Points

```javascript
import { usePointsStore } from '../store/points-store.js';

const { points, loadPoints } = usePointsStore();

useEffect(() => {
  if (account) {
    loadPoints(account);
  }
}, [account]);

// Display points
<p>Total: {points.totalPoints}</p>
<p>Level: {points.level}</p>
```

## Points Configuration

Points values can be configured in the `points_config` table:

```sql
UPDATE points_config 
SET points_value = 20 
WHERE action_type = 'payment_sent';
```

## Future Enhancements

1. **Points Redemption** - Exchange points for rewards
2. **Referral System** - Earn points for referring users
3. **Daily Challenges** - Bonus points for completing challenges
4. **Achievement Badges** - Visual badges for milestones
5. **Points Marketplace** - Spend points on exclusive features
6. **Seasonal Events** - Limited-time point multipliers
7. **Team Competitions** - Group-based point competitions

## Migration

To set up the points system, run:

```sql
-- Run in Supabase SQL Editor
\i supabase/migrations/20250116000000_add_points_system.sql
```

Or include it in the consolidated migration file.

## Privacy Considerations

- Points are linked to wallet addresses (not usernames)
- Leaderboards show wallet addresses (can be anonymized)
- Point transactions are private by default
- Users can opt-out of leaderboards (future feature)

---

**Built for Mantle Global Hackathon 2025 - ZK & Privacy Track**
