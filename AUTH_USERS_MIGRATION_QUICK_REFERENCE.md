# Auth.users Migration - Quick Reference

## What Changed?

### Before Migration
- Custom `users` table stored user data
- Orders referenced custom `users` table
- Signup inserted data into custom `users` table
- Account updates modified custom `users` table

### After Migration
- **auth.users** is the single source of truth
- Orders reference **auth.users** 
- Signup stores data in **auth.users metadata**
- Account updates modify **auth.users metadata**
- Custom `users` table marked as **DEPRECATED** (kept for reference)

## Key Points

### ✅ Guest Checkout Still Works
```sql
-- Guest orders have user_id = NULL
INSERT INTO orders (user_id, session_id, full_name, ...)
VALUES (NULL, 'guest_session_123', 'John Doe', ...);
```

### ✅ Authenticated Orders Use auth.uid()
```sql
-- Authenticated orders use auth.uid()
INSERT INTO orders (user_id, session_id, full_name, ...)
VALUES (auth.uid(), NULL, 'Jane Smith', ...);
```

### ✅ User Data in auth.users Metadata
```typescript
// Signup stores name in metadata
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { name }
  }
});

// Update merges with existing metadata
await supabase.auth.updateUser({
  data: { ...user.user_metadata, name: newName }
});
```

## Modified Files

### Database Schema
- `supabase.sql` - All foreign keys now reference auth.users

### Application Code
- `app/actions/auth.ts` - Removed users table insert
- `app/actions/account.ts` - Uses auth.users metadata
- `app/actions/admin.ts` - Removed users table join

### Documentation
- `AUTH_USERS_MIGRATION_SUMMARY.md` - Complete migration details

## Foreign Key Changes

| Table | Column | Before | After |
|-------|--------|--------|-------|
| orders | user_id | `REFERENCES users(id)` | `REFERENCES auth.users(id)` |
| admins | user_id | `REFERENCES users(id)` | `REFERENCES auth.users(id)` |
| carts | user_id | `REFERENCES users(id)` | `REFERENCES auth.users(id)` |
| analytics_events | user_id | `REFERENCES users(id)` | `REFERENCES auth.users(id)` |
| product_reviews | user_id | `REFERENCES users(id)` | `REFERENCES auth.users(id)` |
| wishlists | user_id | `REFERENCES users(id)` | `REFERENCES auth.users(id)` |
| order_status_history | changed_by | `REFERENCES users(id)` | `REFERENCES auth.users(id)` |

## RLS Policies

### Orders Table
```sql
-- Authenticated users can view their own orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create orders
-- Guests can create orders with NULL user_id
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );
```

### Order Items Table
```sql
-- Users can view their own order items
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Users can create order items for their orders (authenticated or guest)
CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );
```

## Testing Checklist

### Authenticated User Flow
- [ ] User can sign up
- [ ] User can log in
- [ ] User can update profile (name, phone)
- [ ] User can add items to cart
- [ ] User can checkout and create order
- [ ] User can view their orders
- [ ] User's order has their user_id from auth.users

### Guest User Flow
- [ ] Guest can add items to cart
- [ ] Guest can checkout without login
- [ ] Guest order has NULL user_id
- [ ] Guest order has session_id
- [ ] Guest cannot view any orders (no access)

### Admin Flow
- [ ] Admin can view all orders
- [ ] Admin can update order status
- [ ] Admin can see analytics
- [ ] Admin sees correct user count from orders

## Common Issues & Solutions

### Issue: "Foreign key constraint violation"
**Solution**: Ensure user exists in auth.users before creating related records

### Issue: "RLS policy prevents insert/select"
**Solution**: Check that auth.uid() matches user_id or user_id is NULL for guests

### Issue: "User profile data not saving"
**Solution**: Use auth.updateUser() with data object, not from('users').update()

### Issue: "Cannot query users table"
**Solution**: Query auth.users via supabase.auth.getUser(), not from('users')

## Deployment Steps

1. ✅ **Backup database** before deployment
2. ✅ **Deploy SQL changes** (supabase.sql)
3. ✅ **Deploy application code** changes
4. ✅ **Test guest checkout** immediately
5. ✅ **Test authenticated orders** immediately
6. ✅ **Monitor error logs** for any issues
7. ✅ **Verify admin dashboard** works correctly

## Rollback Plan

If issues occur:
1. Revert code changes via Git
2. Restore database from backup
3. Re-apply old schema if needed

## Support

For questions or issues:
- See `AUTH_USERS_MIGRATION_SUMMARY.md` for detailed information
- Check RLS policies in supabase.sql
- Review application code in app/actions/*.ts
