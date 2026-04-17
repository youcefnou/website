# sup.sql - Consolidated Database Schema

## Overview

The `sup.sql` file is a comprehensive, idempotent SQL script that contains the complete database schema for the e-commerce platform. It consolidates all necessary database objects, migrations, and configurations into a single file.

## What's Included

### 1. Schema Definitions
- **Enums**: `order_status`, `role`, `analytics_event_type`
- **Tables**: All 16 application tables including:
  - `users`, `admins`, `categories`, `products`, `product_variants`, `sellable_items`
  - `carts`, `cart_items`, `orders`, `order_items`
  - `delivery_wilayas`, `analytics_events`, `product_reviews`, `wishlists`
  - `order_status_history`, `home_content`, `store_settings`
- **Indexes**: All necessary indexes for performance optimization
- **Constraints**: Foreign keys, unique constraints, check constraints

### 2. Fixed RLS Policies

The file includes **critical fixes** for Row-Level Security (RLS) policies, particularly for the `orders` and `order_items` tables:

#### Orders Policy Fix
```sql
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (
    -- Case 1: Authenticated user creating their own order
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Case 2: Guest user creating an order (both auth.uid() and user_id are NULL)
    (auth.uid() IS NULL AND user_id IS NULL)
  );
```

**Why this fix is needed:**
- The previous policy used `(auth.uid() = user_id OR user_id IS NULL)`
- This fails for guest users because `NULL = NULL` evaluates to `UNKNOWN` in SQL, not `TRUE`
- The new policy explicitly checks for NULL values to handle guest orders correctly

#### Order Items Policy Fix
The `order_items` policy is aligned with the `orders` policy to ensure consistency:
```sql
CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
          OR
          (auth.uid() IS NULL AND orders.user_id IS NULL)
        )
    )
  );
```

### 3. Triggers and Functions
- **Updated_at triggers**: Automatically update timestamps on all tables
- **Stock management**: Decrement/restore stock on order status changes
- **Order history**: Log all order status changes
- **Variant validation**: Ensure variants belong to their parent product
- **Helper functions**: Cart merging, admin checks, session validation

### 4. Grants for Application Roles
Proper permissions for `anon` and `authenticated` roles:
- **SELECT**: All tables (public read access)
- **INSERT/UPDATE/DELETE**: Restricted to appropriate tables (users, carts, orders, etc.)
- **EXECUTE**: Helper functions available to both roles

### 5. Initial Data
- 58 Algerian wilayas with delivery pricing
- Default store settings
- Default home content
- Placeholder images for products

## How to Apply

### Via Supabase Dashboard
1. Log in to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `sup.sql`
5. Click **Run** to execute
6. Review the NOTICE messages to confirm all changes

### Via Supabase CLI
```bash
# Option 1: Direct execution
supabase db push --db-url "your-database-url" < sup.sql

# Option 2: Create a migration
supabase migration new consolidated_schema
# Copy contents of sup.sql into the new migration file
supabase db push
```

## Idempotency

This file is designed to be **idempotent** - safe to run multiple times:
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `CREATE INDEX IF NOT EXISTS`
- Uses `DROP POLICY IF EXISTS` before creating policies
- Uses `DO $$ ... END $$` blocks for conditional operations
- Uses `ON CONFLICT DO NOTHING` for initial data

## Key Features

### Email-Based Authentication
- Users can authenticate with email (phone is optional)
- Phone is still required for orders (delivery contact)
- Users table properly handles nullable phone field

### Guest Order Support
- Guest users can create orders without authentication
- Orders created by guests have `user_id = NULL`
- RLS policies explicitly handle both authenticated and guest scenarios

### Stock Management
- Automatic stock decrement when order is confirmed
- Automatic stock restoration when order is canceled
- Stock validation prevents overselling

### Audit Trail
- All order status changes are logged in `order_status_history`
- Timestamps automatically maintained on all tables

## Verification

After applying the SQL file, you can verify it worked correctly:

```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify wilayas data
SELECT COUNT(*) FROM delivery_wilayas;  -- Should return 58

-- Verify orders RLS policy for guest users
SELECT policyname, pg_get_expr(qual, 'orders'::regclass) as using_expr,
       pg_get_expr(with_check, 'orders'::regclass) as with_check_expr
FROM pg_policies
WHERE tablename = 'orders' AND cmd = 'INSERT';
```

## Troubleshooting

### Issue: RLS Policy Violation on Order Creation
**Error**: `new row violates row-level security policy for table "orders"`

**Solution**: 
- Ensure you're running the latest version of `sup.sql`
- The fix explicitly handles NULL comparisons for guest users
- Verify the policy with the query above

### Issue: Permission Denied
**Error**: `permission denied for table orders`

**Solution**:
- Ensure grants are applied correctly
- Check that you're using the `anon` or `authenticated` role
- Verify with: `SELECT * FROM information_schema.role_table_grants WHERE grantee IN ('anon', 'authenticated');`

## Maintenance

### Adding New Tables
When adding new tables to the schema:
1. Add the CREATE TABLE statement with `IF NOT EXISTS`
2. Add appropriate indexes with `IF NOT EXISTS`
3. Add RLS policies (drop existing first)
4. Add necessary grants for anon/authenticated roles
5. Keep the file idempotent

### Updating RLS Policies
When updating RLS policies:
1. Add `DROP POLICY IF EXISTS` before the CREATE
2. Test thoroughly with both authenticated and guest users
3. Document the reason for the change

## Related Files

- `supabase.sql`: Original base schema (reference only)
- `migrations/fix_orders_rls_policy.sql`: Original RLS fix (now consolidated here)
- `migrations/`: Legacy migration files (for reference)

## Support

For issues or questions about this SQL file:
1. Check the verification queries above
2. Review the RLS policies section
3. Ensure you're using Supabase with proper authentication configuration
4. Check application code to ensure it's passing correct parameters

## Version

This consolidated schema includes all migrations and fixes as of January 2026.
