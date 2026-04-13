# Deployment Guide: Order Creation Security

## Pre-Deployment Checklist

- [ ] Review all changes in the PR
- [ ] Ensure you have access to Supabase dashboard
- [ ] Backup existing database (recommended)
- [ ] Verify current order creation is working before deployment

## Deployment Steps

### 1. Apply Database Migration

**Option A: Using Migration File (Recommended)**

1. Open Supabase Dashboard → SQL Editor
2. Open the file `migrations/add_session_id_to_orders.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run" to execute
6. Check for success messages (should see "Query successful")

**Option B: Using Consolidated Schema**

1. Open Supabase Dashboard → SQL Editor
2. Open the file `consolidated_schema.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run" to execute
6. Note: This will recreate all tables and policies (safe due to idempotent design)

### 2. Verify Database Changes

Run these verification queries in Supabase SQL Editor:

```sql
-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_items') 
AND column_name = 'session_id';
-- Expected: 2 rows (one for orders, one for order_items)

-- Verify index exists
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'orders' 
AND indexname = 'idx_orders_session_id';
-- Expected: 1 row

-- Verify RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items') 
AND cmd = 'INSERT'
ORDER BY tablename, policyname;
-- Expected: 2 rows (allow_order_insertion, allow_order_item_insertion)

-- Test validate_session_ownership function
SELECT validate_session_ownership('test-session-12345678901234567890');
-- Expected: false (no such session in carts)
```

### 3. Deploy Application Code

**Using Vercel (or similar):**

```bash
# Ensure all changes are committed
git status

# Push to your deployment branch
git push origin copilot/improve-order-creation-process

# Or merge to main and deploy
git checkout main
git merge copilot/improve-order-creation-process
git push origin main
```

**Manual deployment:**

```bash
# Install dependencies
npm ci

# Build the application
npm run build

# Start the application
npm start
```

### 4. Post-Deployment Verification

#### Test Authenticated User Flow

1. Open application in normal browser window
2. Sign up or log in with a test account
3. Add items to cart
4. Proceed to checkout
5. Complete the order
6. Verify order appears in orders page
7. Check database:
   ```sql
   SELECT id, user_id, session_id, full_name, total
   FROM orders
   ORDER BY created_at DESC
   LIMIT 1;
   -- Expected: user_id populated, session_id NULL
   ```

#### Test Guest User Flow

1. Open application in incognito/private window
2. Add items to cart
3. Open browser console and check:
   ```javascript
   localStorage.getItem('cart_session_id')
   // Should show a UUID
   ```
4. Proceed to checkout
5. Complete the order
6. Verify success message
7. Check database:
   ```sql
   SELECT id, user_id, session_id, full_name, total
   FROM orders
   ORDER BY created_at DESC
   LIMIT 1;
   -- Expected: user_id NULL, session_id populated
   
   -- Verify session exists in carts
   SELECT id, session_id, updated_at
   FROM carts
   WHERE session_id = '<session_id from order>';
   -- Expected: 1 row with recent updated_at
   ```

#### Test Security

1. Try creating an order with invalid session_id:
   ```javascript
   // In browser console (must be not logged in)
   localStorage.setItem('cart_session_id', 'invalid');
   // Try to checkout - should fail with permission error
   ```

2. Try creating an order with expired session:
   ```sql
   -- In Supabase SQL Editor
   -- Create a test cart with old timestamp
   INSERT INTO carts (session_id, updated_at)
   VALUES ('test-expired-session-123456789012', NOW() - INTERVAL '31 days');
   
   -- Try to create order with this session - should fail
   ```

### 5. Monitor for Issues

**First 24 Hours:**

1. Monitor application logs for errors
2. Check Supabase logs for RLS policy violations
3. Monitor order creation success rate
4. Check for any customer complaints about checkout

**Queries to Monitor:**

```sql
-- Check recent orders
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_orders,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as guest_orders
FROM orders
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check for any orders with NULL session_id and NULL user_id (shouldn't exist)
SELECT COUNT(*)
FROM orders
WHERE user_id IS NULL AND session_id IS NULL;
-- Expected: 0

-- Check for mismatched session_ids (shouldn't exist)
SELECT COUNT(*)
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.user_id IS NULL 
  AND o.session_id != oi.session_id;
-- Expected: 0
```

## Rollback Procedure

If issues are encountered:

### 1. Quick Rollback (Application Only)

```bash
# Revert to previous application version
git revert <commit-hash>
git push origin main
```

### 2. Database Rollback (If Necessary)

**Note:** This should only be done if there are critical issues with the migration.

```sql
BEGIN;

-- Remove session_id columns
ALTER TABLE order_items DROP COLUMN IF EXISTS session_id;
ALTER TABLE orders DROP COLUMN IF EXISTS session_id;

-- Drop new policies
DROP POLICY IF EXISTS "allow_order_insertion" ON orders;
DROP POLICY IF EXISTS "allow_order_item_insertion" ON order_items;

-- Restore old policies
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Restore old validate_session_ownership function
CREATE OR REPLACE FUNCTION validate_session_ownership(cart_session_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN cart_session_id IS NOT NULL AND LENGTH(cart_session_id) >= 32;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
```

## Troubleshooting

### Issue: Guest users getting permission denied

**Check:**
1. Is `cart_session_id` in localStorage?
   ```javascript
   localStorage.getItem('cart_session_id')
   ```
2. Does session exist in carts table?
   ```sql
   SELECT * FROM carts WHERE session_id = '<session_id>';
   ```
3. Is session recent (< 30 days)?

**Solution:**
- Clear localStorage and try again
- Check browser console for errors
- Verify RLS policies are applied correctly

### Issue: Authenticated users getting permission denied

**Check:**
1. Is user logged in?
   ```javascript
   // In browser console
   const supabase = createClient();
   const { data: { user } } = await supabase.auth.getUser();
   console.log(user);
   ```
2. Is access token valid?

**Solution:**
- Log out and log back in
- Check Supabase auth settings
- Verify RLS policies for authenticated users

### Issue: Order items not being created

**Check:**
1. Check order_items logs in Supabase
2. Verify session_id matches between order and order_items
3. Check if stock is available

**Solution:**
- Verify `session_id` is being passed correctly
- Check application logs for detailed error messages
- Verify RLS policy for order_items

## Support

If you encounter issues:

1. Check `ORDER_CREATION_SECURITY_IMPLEMENTATION.md` for detailed implementation details
2. Review Supabase logs for RLS policy violations
3. Check browser console for client-side errors
4. Review application server logs for server-side errors

## Monitoring Queries

Save these queries for ongoing monitoring:

```sql
-- Daily order statistics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as guest
FROM orders
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Session validation health check
SELECT 
  COUNT(DISTINCT o.session_id) as unique_sessions,
  COUNT(DISTINCT c.session_id) as valid_sessions_in_carts
FROM orders o
LEFT JOIN carts c ON o.session_id = c.session_id
WHERE o.user_id IS NULL 
  AND o.created_at > NOW() - INTERVAL '24 hours';
-- Expected: Both counts should be equal
```
