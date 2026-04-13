# Database Migrations: Orders RLS Policy Fixes

This directory contains migration files to fix Row-Level Security (RLS) policy issues for the `orders` and `order_items` tables.

## Available Migration Files

### 1. `fix_supabase_rls_insert_comprehensive.sql` (RECOMMENDED)
**Status:** Latest comprehensive fix  
**Purpose:** Complete fix for Supabase RLS INSERT failures addressing all identified causes

This migration includes:
- Drops all existing defective policies
- Creates separate policies for authenticated and guest users
- Proper NULL handling for both orders and order_items
- Optional debug policy (commented out by default)
- Comprehensive verification queries

### 2. `fix_orders_rls_policy.sql` (DEPRECATED)
**Status:** Superseded by comprehensive fix  
**Purpose:** Original fix for orders RLS policy  
**Deprecation Notice:** This migration will be removed in August 2026 (12 months from initial release)

⚠️ **Do not use this migration for new deployments**. Use `fix_supabase_rls_insert_comprehensive.sql` instead.

This migration is kept for historical reference only. If you previously applied this migration, you should apply the comprehensive fix to ensure both orders and order_items policies are correctly updated.

### 3. `add_session_id_to_orders.sql`
**Status:** Session validation variant  
**Purpose:** Adds session_id support with validation through carts table

Note: This migration requires session validation which may be too restrictive for some use cases.

## The Problem

The Row-Level Security (RLS) policy for the `orders` and `order_items` tables was preventing guest users from creating orders. The original policies had conditions like:

```sql
WITH CHECK (auth.uid() = user_id OR user_id IS NULL)
```

This fails for guest users because:
- `auth.uid()` is `NULL` for unauthenticated users
- `user_id` is also `NULL` for guest orders
- The condition `NULL = NULL` evaluates to `UNKNOWN` (not `TRUE`) in SQL
- Therefore, guest orders were being rejected

## The Solution

The updated policies explicitly handle both authenticated and guest users:

```sql
-- For authenticated users
CREATE POLICY "Authenticated users can insert orders"
ON orders FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- For guest users  
CREATE POLICY "Guests can insert orders"
ON orders FOR INSERT
WITH CHECK (
  auth.uid() IS NULL
  AND user_id IS NULL
);
```

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `migrations/fix_supabase_rls_insert_comprehensive.sql`
3. Paste and run the SQL
4. Review the verification query results

### Option 2: Using Supabase CLI
```bash
supabase db push migrations/fix_supabase_rls_insert_comprehensive.sql
```

### Option 3: Manual SQL Execution
Connect to your PostgreSQL database and run:
```bash
psql -h <host> -U <user> -d <database> -f migrations/fix_supabase_rls_insert_comprehensive.sql
```

## Verification

After applying the migration, run the verification query included in the migration file:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) as using_expr,
  pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass) as with_check_expr
FROM pg_policies
WHERE tablename IN ('orders', 'order_items') 
  AND cmd = 'INSERT'
ORDER BY tablename, policyname;
```

Expected results:
- `Authenticated users can insert orders` - for authenticated user orders
- `Guests can insert orders` - for guest orders
- `Allow inserts into order_items` - for order items (both types)

## Testing

After applying the migration, test both scenarios:

### Test 1: Guest Order
1. Open the application in incognito/private mode (not logged in)
2. Add items to cart
3. Go to checkout
4. Fill in all required information
5. Submit the order
6. **Expected:** Order created successfully without RLS policy violations

### Test 2: Authenticated User Order
1. Log in to the application
2. Add items to cart
3. Go to checkout
4. Fill in all required information
5. Submit the order
6. **Expected:** Order created successfully and visible in user's orders

### Test 3: Verify RLS Protection
Try to create an order with mismatched user_id (should fail):
```sql
-- This should fail for authenticated users
INSERT INTO orders (user_id, full_name, phone, wilaya_id, commune, address, delivery_price, subtotal, total)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test', '+213555123456', 16, 'Test', 'Test', 500, 1000, 1500);
```

## Debugging

If orders still fail after migration, uncomment the debug policy in the migration file:

```sql
CREATE POLICY "DEBUG allow all inserts"
  ON orders FOR INSERT
  WITH CHECK (true);
```

**Important:** Remove this debug policy once you've identified the issue!

## Related Files
- `supabase.sql` - Updated main schema file with correct RLS policies
- `app/actions/orders.ts` - Order creation logic (already handles user_id correctly)
- `app/(public)/checkout/page.tsx` - Checkout page using this functionality
- `RLS_POLICY_FIX_EXPLAINED.md` - Detailed explanation of the NULL comparison issue
