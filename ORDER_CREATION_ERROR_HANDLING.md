# Order Creation Error Handling - Implementation Guide

## Overview

This document explains the error handling improvements made to the order creation process to address RLS policy violations and provide better user feedback.

## Problem Statement

The application was experiencing issues with order creation due to:
1. Row-Level Security (RLS) policy violations (error code 42501)
2. Insufficient error handling in the frontend
3. Poor user feedback when database errors occurred
4. Missing error boundaries for React component failures

## Solution Components

### 1. Database RLS Policies (Already Fixed in sup.sql)

The RLS policies for orders and order_items tables correctly handle both authenticated and guest users:

```sql
-- Orders table INSERT policy
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (
    -- Case 1: Authenticated user creating their own order
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Case 2: Guest user creating an order (both auth.uid() and user_id are NULL)
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Order items table INSERT policy
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

**Key Points:**
- Uses explicit `IS NULL` checks instead of `= NULL` comparisons
- Handles both authenticated users (with auth.uid()) and guest users (without auth.uid())
- Consistent logic between orders and order_items tables

### 2. Backend Error Handling (`app/actions/orders.ts`)

Enhanced the `createOrderWithItems` server action with:

#### Authentication State Logging
```typescript
console.log('Order creation - Auth state:', {
  isAuthenticated: !!user,
  userId: user?.id || null,
  userEmail: user?.email || 'guest',
});
```

#### Specific Error Code Handling
```typescript
if (orderError?.code === '42501') {
  throw new Error(
    'Impossible de créer la commande en raison de restrictions de sécurité. ' +
    'Veuillez réessayer ou contacter le support si le problème persiste.'
  );
} else if (orderError?.code === '23505') {
  throw new Error('Cette commande existe déjà. Veuillez réessayer.');
} else if (orderError?.code === '23503') {
  throw new Error('Données de commande invalides. Veuillez vérifier votre panier et réessayer.');
}
```

#### Transaction Rollback
- If order items fail to create, the order is automatically deleted
- Prevents orphaned orders in the database
- Logs rollback failures for debugging

### 3. Frontend Error Handling

#### A. Error Boundary Component (`components/ErrorBoundary.tsx`)

Reusable class component that catches JavaScript errors in the component tree:

```typescript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

Features:
- Catches unhandled errors in child components
- Provides fallback UI with error details
- Allows users to retry or navigate away
- Logs errors to console for debugging

#### B. Checkout Page Error Boundary (`app/(public)/checkout/error.tsx`)

Next.js error boundary specific to the checkout route:
- Catches errors during page rendering
- Provides user-friendly error messages
- Offers retry and navigation options

#### C. Enhanced Checkout Form Error Handling

**Prominent Error Banner:**
```tsx
{errors.submit && (
  <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
    {/* Error icon and message */}
  </div>
)}
```

**Intelligent Error Detection:**
- Detects RLS violations and translates to user-friendly messages
- Identifies stock issues
- Recognizes network errors
- Scrolls to error message automatically

**Example Error Translation:**
```typescript
if (errorMessage.includes('42501') || errorMessage.includes('row-level security')) {
  errorMessage = 
    'Impossible de créer la commande en raison de restrictions de sécurité. ' +
    'Veuillez réessayer dans quelques instants ou contacter le support.';
}
```

### 4. User Experience Improvements

#### For Authenticated Users
- Order created and linked to their account
- Redirected to `/orders` page to view order history
- Cart automatically cleared after successful order

#### For Guest Users
- Order created without user account requirement
- Redirected to home page with success indicator (`/?order=success`)
- Local cart cleared after successful order
- Cannot view order history (by design, as they have no authentication)

## Error Codes Reference

| Code | Meaning | User Message |
|------|---------|--------------|
| 42501 | RLS policy violation | "Impossible de créer la commande en raison de restrictions de sécurité" |
| 23505 | Unique constraint violation | "Cette commande existe déjà" |
| 23503 | Foreign key violation | "Un ou plusieurs articles ne sont plus disponibles" |
| Network errors | Connection issues | "Problème de connexion. Veuillez vérifier votre connexion Internet" |

## Testing Scenarios

### Test 1: Authenticated User Order Creation
1. Log in as a user
2. Add items to cart
3. Proceed to checkout
4. Fill in delivery information
5. Submit order
6. **Expected:** Order created successfully, redirected to orders page

### Test 2: Guest User Order Creation
1. Do NOT log in
2. Add items to cart
3. Proceed to checkout
4. Fill in delivery information
5. Submit order
6. **Expected:** Order created successfully, redirected to home page

### Test 3: RLS Error Handling
1. Simulate an RLS violation (requires database manipulation)
2. Attempt to create order
3. **Expected:** User sees friendly error message, not technical database error

### Test 4: Network Error Handling
1. Disconnect network
2. Attempt to create order
3. **Expected:** User sees connection error message

### Test 5: Stock Validation
1. Order item with insufficient stock
2. Attempt to create order
3. **Expected:** User sees stock availability error

## Debugging Guide

### Check Authentication State
Look for console logs:
```
Order creation - Auth state: {
  isAuthenticated: true/false,
  userId: "uuid" or null,
  userEmail: "email" or "guest"
}
```

### Verify Database Policy
Run in Supabase SQL editor:
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('orders', 'order_items');
```

### Test RLS Directly
```sql
-- Test as authenticated user
SET request.jwt.claims TO '{"sub": "user-uuid-here"}';
INSERT INTO orders (...) VALUES (...);

-- Test as guest
SET request.jwt.claims TO '{}';
INSERT INTO orders (user_id, ...) VALUES (NULL, ...);
```

## Files Modified

1. `app/actions/orders.ts` - Enhanced error handling and logging
2. `app/(public)/checkout/page.tsx` - Improved error display and handling
3. `app/(public)/checkout/error.tsx` - New error boundary page
4. `components/ErrorBoundary.tsx` - New reusable error boundary component

## Key Takeaways

1. **RLS policies must explicitly handle NULL comparisons** - Use `IS NULL` not `= NULL`
2. **Provide user-friendly error messages** - Translate technical errors to French, actionable messages
3. **Log authentication state** - Helps debug RLS issues
4. **Implement error boundaries** - Graceful degradation for unexpected errors
5. **Rollback transactions on failure** - Maintain data consistency
6. **Support both authenticated and guest users** - Critical for e-commerce checkout

## Future Enhancements

If guest order tracking is needed:
1. Add `access_token` column to orders table
2. Generate unique token on order creation
3. Send token via email
4. Allow order lookup by token
5. Update RLS policies to allow token-based access

## References

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
