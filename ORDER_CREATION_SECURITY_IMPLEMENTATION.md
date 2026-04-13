# Order Creation Security Implementation

## Overview
This document outlines the implementation of secure order creation for both authenticated users and guest users, as specified in the problem statement.

## Changes Implemented

### 1. Database Schema Changes

#### Tables Modified

**`orders` table:**
- Added `session_id TEXT` column to support guest orders
- Added index `idx_orders_session_id` for performance

**`order_items` table:**
- Added `session_id TEXT` column to support guest order items

#### Function Updates

**`validate_session_ownership(session_id TEXT)`:**
- **Purpose:** Validates that a session_id exists in the carts table and was recently updated
- **Security:** 
  - Returns FALSE if session_id is NULL or less than 32 characters
  - Checks if session exists in `carts` table
  - Validates session was updated within last 30 days
- **Type:** SECURITY DEFINER (runs with elevated privileges)
- **Permissions:** Execute granted to `anon` and `authenticated` roles

```sql
CREATE OR REPLACE FUNCTION validate_session_ownership(session_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF session_id IS NULL OR LENGTH(session_id) < 32 THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM carts
    WHERE carts.session_id = validate_session_ownership.session_id
      AND carts.updated_at > NOW() - INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Row Level Security (RLS) Policies

**Orders Table - INSERT Policy (`allow_order_insertion`):**
```sql
CREATE POLICY "allow_order_insertion" ON orders
FOR INSERT
WITH CHECK (
  -- Authenticated user creating their own order
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Guest user creating an order with valid session
  (auth.uid() IS NULL AND user_id IS NULL AND validate_session_ownership(session_id))
);
```

**Order Items Table - INSERT Policy (`allow_order_item_insertion`):**
```sql
CREATE POLICY "allow_order_item_insertion" ON order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.id = order_items.order_id
      AND (
        -- Order belongs to authenticated user
        (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
        OR
        -- Order is a guest order with matching session
        (
          auth.uid() IS NULL 
          AND orders.user_id IS NULL 
          AND orders.session_id = order_items.session_id  -- Ensures session_id matches
          AND validate_session_ownership(order_items.session_id)
        )
      )
  )
);
```

**Key Security Enhancement:** The order_items policy now verifies that `orders.session_id = order_items.session_id`, preventing malicious actors from inserting order items with different session IDs than the parent order.

### 2. Application Code Changes

#### TypeScript Type Updates

**`db/types.ts`:**
- Updated `orders` table types to include `session_id: string | null`
- Updated `order_items` table types to include `session_id: string | null`

**`app/actions/orders.ts`:**
- Updated `CreateOrderInput` interface to include optional `sessionId?: string`

#### Order Creation Logic

**`app/actions/orders.ts` - `createOrderWithItems()`:**
- Modified to accept `sessionId` in input
- Sets `session_id` in orders table for guest users (when user is not authenticated)
- Sets `session_id` in order_items for guest users
- Added logging for session_id in debug statements

```typescript
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    user_id: user?.id || null,
    session_id: !user ? input.sessionId || null : null, // Only set for guests
    // ... other fields
  })
  .select()
  .single();
```

**`app/(public)/checkout/page.tsx`:**
- Updated order creation call to include `sessionId` from localStorage for guest users
- Session ID is retrieved using `localStorage.getItem('cart_session_id')`
- Extracted session ID to a variable to avoid duplication and inconsistency

```typescript
// Get session ID for guest users
const sessionId = !isLoggedIn ? localStorage.getItem('cart_session_id') || undefined : undefined;

await createOrderWithItems({
  // ... other fields
  sessionId,
});
```

### 3. Migration File

**`migrations/add_session_id_to_orders.sql`:**
- Comprehensive migration script that:
  - Adds `session_id` column to `orders` table (idempotent)
  - Adds `session_id` column to `order_items` table (idempotent)
  - Creates index on `orders.session_id`
  - Updates `validate_session_ownership()` function
  - Drops and recreates RLS policies for orders and order_items
  - Includes verification queries as comments

### 4. Consolidated Schema Updates

**`consolidated_schema.sql`:**
- Updated table definitions to include session_id columns
- Updated indexes section to include session_id index
- Updated validate_session_ownership function
- Updated RLS policies
- Added migration note in Section 9

## Security Features

### 1. Session Validation
- Sessions must be at least 32 characters long (UUID format)
- Sessions must exist in the `carts` table
- Sessions must have been updated within the last 30 days
- Validation happens server-side through SECURITY DEFINER function

### 2. Authentication Handling
- **Authenticated Users:**
  - `user_id` is set to `auth.uid()` (evaluated by Supabase)
  - `session_id` is set to NULL
  - Supabase access token is automatically included by the SSR client

- **Guest Users:**
  - `user_id` is set to NULL
  - `session_id` is passed from the client's localStorage
  - Session is validated against the `carts` table before order creation

### 3. RLS Policy Enforcement
- Orders can only be inserted if:
  - User is authenticated AND matches the user_id, OR
  - User is not authenticated AND session is valid
- Order items can only be inserted if they belong to a valid order
- **Session ID Matching:** For guest orders, the `session_id` in order_items must match the `session_id` in the parent order, preventing cross-session data insertion attacks

### 4. Data Isolation
- Authenticated users can only see their own orders
- Guest users cannot view orders after creation (no user_id to query)
- Admin users can view all orders (separate admin RLS policies)

## How It Works

### Authenticated User Flow
1. User logs in (access token stored in cookies via Supabase SSR)
2. User adds items to cart (cart has `user_id`)
3. User proceeds to checkout
4. Order is created with `user_id = auth.uid()`, `session_id = NULL`
5. Order items are created with `session_id = NULL`
6. RLS policy checks: `auth.uid() IS NOT NULL AND auth.uid() = user_id` ✅
7. Order created successfully

### Guest User Flow
1. Guest visits site (no authentication)
2. Session ID is generated and stored in localStorage (`cart_session_id`)
3. Guest adds items to cart (cart has `session_id`)
4. Guest proceeds to checkout
5. Order is created with `user_id = NULL`, `session_id = <from localStorage>`
6. Order items are created with matching `session_id`
7. RLS policy checks:
   - `auth.uid() IS NULL` ✅
   - `user_id IS NULL` ✅
   - `validate_session_ownership(session_id)` checks:
     - Session exists in carts table ✅
     - Session updated within 30 days ✅
8. Order created successfully

## Testing Recommendations

### Manual Testing

1. **Authenticated User Order:**
   - Log in to the application
   - Add items to cart
   - Complete checkout
   - Verify order appears in orders page
   - Check database: `user_id` should be set, `session_id` should be NULL

2. **Guest User Order:**
   - Open application in incognito/private mode
   - Add items to cart
   - Complete checkout
   - Check database: `user_id` should be NULL, `session_id` should match localStorage value
   - Verify session exists in `carts` table

3. **Security Tests:**
   - Attempt to create order with invalid session_id (should fail)
   - Attempt to create order with session_id not in carts table (should fail)
   - Attempt to create order with old session (>30 days, should fail)

### Database Verification Queries

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_items') 
AND column_name = 'session_id';

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items') 
AND cmd = 'INSERT';

-- Test validate_session_ownership function
SELECT validate_session_ownership('test-session-id-12345678901234567890');

-- Check recent orders
SELECT id, user_id, session_id, full_name, total, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

## Files Modified

1. `consolidated_schema.sql` - Updated schema with session_id support
2. `migrations/add_session_id_to_orders.sql` - New migration file
3. `db/types.ts` - Updated TypeScript types
4. `app/actions/orders.ts` - Updated order creation logic
5. `app/(public)/checkout/page.tsx` - Updated checkout to pass session_id

## Deployment Steps

1. **Apply Migration:**
   - Run `migrations/add_session_id_to_orders.sql` in Supabase SQL Editor
   - Or apply the updated `consolidated_schema.sql`

2. **Deploy Application:**
   - Deploy the updated application code
   - No environment variable changes required

3. **Verify:**
   - Run verification queries
   - Test both authenticated and guest checkout flows

## Notes

- Session expiration is set to 30 days - adjust in `validate_session_ownership()` if needed
- The `session_id` is generated using `crypto.randomUUID()` in the browser (36 characters)
- Supabase automatically handles auth token inclusion in server actions
- The implementation is backward compatible - existing orders without session_id are unaffected
