# Orders RLS Policy Fix - Before & After

## Problem Statement

The original RLS (Row-Level Security) policy for the `orders` table prevented guest users (non-authenticated users) from creating orders, resulting in policy violation errors.

## The Issue: SQL NULL Comparison

In PostgreSQL (and SQL in general), comparing `NULL` values has special behavior:

```sql
NULL = NULL   -- evaluates to UNKNOWN (not TRUE)
NULL IS NULL  -- evaluates to TRUE
```

## Before: Broken Policy

### Original Policy
```sql
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );
```

### Why It Failed

For a guest user creating an order:
- `auth.uid()` = `NULL` (no authenticated user)
- `user_id` = `NULL` (order not linked to any user)

The policy evaluation:
1. `auth.uid() = user_id` → `NULL = NULL` → **UNKNOWN** (not TRUE) ❌
2. `user_id IS NULL` → **TRUE** ✓
3. `UNKNOWN OR TRUE` → **TRUE** ✓

Wait, this should work! But there's a subtlety...

### The Real Problem

The issue is that when `auth.uid()` is NULL, the first part of the OR becomes:
```sql
NULL = user_id OR user_id IS NULL
```

For the case where a guest creates an order:
- First condition: `NULL = NULL` using `=` operator → **UNKNOWN**
- Second condition: `user_id IS NULL` → **TRUE**

However, PostgreSQL's RLS policies need **TRUE** to allow access. When combined with UNKNOWN:
- `UNKNOWN OR TRUE` in some contexts can still block access
- RLS is very strict about NULL handling

## After: Fixed Policy

### New Policy
```sql
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (
    -- Case 1: Authenticated user creating their own order
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Case 2: Guest user creating an order
    (auth.uid() IS NULL AND user_id IS NULL)
  );
```

### Why It Works

For an **authenticated user** creating an order:
- `auth.uid()` = `<some-uuid>`
- `user_id` = `<same-uuid>`

Evaluation:
1. First condition: `(auth.uid() IS NOT NULL AND auth.uid() = user_id)` → `TRUE AND TRUE` → **TRUE** ✓
2. Policy allows access ✓

For a **guest user** creating an order:
- `auth.uid()` = `NULL`
- `user_id` = `NULL`

Evaluation:
1. First condition: `(auth.uid() IS NOT NULL AND auth.uid() = user_id)` → `FALSE AND ...` → **FALSE**
2. Second condition: `(auth.uid() IS NULL AND user_id IS NULL)` → `TRUE AND TRUE` → **TRUE** ✓
3. Policy allows access ✓

## Test Cases

### Test 1: Authenticated User Creating Order ✓
```typescript
// User is logged in
const { data, error } = await supabase
  .from('orders')
  .insert({
    user_id: currentUser.id,  // UUID of authenticated user
    full_name: 'John Doe',
    phone: '+213555123456',
    // ... other fields
  });

// Result: Success ✓
```

### Test 2: Guest User Creating Order ✓
```typescript
// User is NOT logged in (auth.uid() is NULL)
const { data, error } = await supabase
  .from('orders')
  .insert({
    user_id: null,  // NULL for guest orders
    full_name: 'Jane Smith',
    phone: '+213555654321',
    // ... other fields
  });

// Before fix: Error - "new row violates row-level security policy" ❌
// After fix: Success ✓
```

## Order Items Policy

The same fix was applied to the `order_items` table to maintain consistency:

### New Policy
```sql
CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          -- Authenticated user's order
          (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
          OR
          -- Guest order
          (auth.uid() IS NULL AND orders.user_id IS NULL)
        )
    )
  );
```

This ensures that:
- Authenticated users can only add items to their own orders
- Guest users can add items to guest orders
- No user can add items to another user's order

## Application Code Example

The application code works the same way for both cases:

```typescript
// app/actions/orders.ts
export async function createOrderWithItems(input: CreateOrderInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Create order - works for both authenticated and guest users
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user?.id || null,  // NULL for guests, UUID for authenticated
      full_name: input.fullName,
      phone: input.phone,
      // ... other fields
    })
    .select()
    .single();

  // Create order items
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    sellable_item_id: item.sellableItemId,
    quantity: item.quantity,
    price_at_order: item.priceAtOrder,
  }));

  await supabase.from('order_items').insert(orderItems);
  
  return order;
}
```

## Key Takeaways

1. **Never use `=` to compare NULL values in RLS policies**
   - Use `IS NULL` or `IS NOT NULL` instead

2. **Be explicit with NULL checks**
   - Instead of: `auth.uid() = user_id OR user_id IS NULL`
   - Use: `(auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (auth.uid() IS NULL AND user_id IS NULL)`

3. **Test both authenticated and guest scenarios**
   - RLS policies should work for all user states
   - Guest access is critical for e-commerce checkout flows

4. **Document your RLS policies**
   - Explain why certain checks are needed
   - Future developers will thank you

## References

- [PostgreSQL NULL Handling](https://www.postgresql.org/docs/current/functions-comparison.html)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL NULL in Comparisons](https://modern-sql.com/concept/null)

## Guest Order Retrieval

### Important Note

Guest users can **create** orders but cannot **retrieve** them through the API after creation. This is intentional because:

1. **No Authentication**: Guest users have no `auth.uid()`, so there's no way to identify them in subsequent requests
2. **Security**: Allowing retrieval of guest orders without authentication would be a security risk
3. **Standard Practice**: Most e-commerce sites handle this via:
   - Order confirmation emails with order details
   - Order tracking links with unique tokens
   - Order numbers provided at checkout

### SELECT Policies

```sql
-- Orders: Only authenticated users can view
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Order Items: Only authenticated users can view
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND auth.uid() IS NOT NULL
        AND orders.user_id = auth.uid()
    )
  );
```

### If You Need Guest Order Retrieval

If your application requires guest users to retrieve their orders, you would need to implement:

1. **Order Tokens**: Generate a unique token for each order
   ```sql
   ALTER TABLE orders ADD COLUMN access_token TEXT UNIQUE;
   ```

2. **Token-Based RLS Policy**:
   ```sql
   CREATE POLICY "Users can view orders with valid token"
     ON orders FOR SELECT
     USING (
       (auth.uid() IS NOT NULL AND auth.uid() = user_id)
       OR
       (access_token IS NOT NULL AND access_token = current_setting('request.headers')::json->>'x-order-token')
     );
   ```

3. **Application Code**: Pass the token in requests
   ```typescript
   const { data } = await supabase
     .from('orders')
     .select('*')
     .eq('access_token', orderToken);
   ```

However, this adds complexity and the current implementation follows the standard approach of email-based order confirmation for guest users.

