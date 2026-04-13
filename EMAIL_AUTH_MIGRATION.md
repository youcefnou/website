# Email-Only Authentication Migration Guide

## Overview

This document describes the changes made to implement email-only user authentication while preserving all existing features and maintaining separate admin authentication.

## Summary of Changes

### 1. Database Migration (`sup.sql`)

Created a comprehensive, idempotent SQL migration file that:

- Makes `users.phone` nullable (removes NOT NULL constraint)
- Drops UNIQUE constraint on `users.phone`
- Drops CHECK constraint on `users.phone` format validation
- Ensures `users.email` has UNIQUE constraint
- Adds index on `users.email` for performance

**Preserved:**
- All RLS policies on all tables
- All triggers (stock decrement, cart merge, updated_at, status history)
- All analytics views (revenue_per_product, best_selling_products, funnel_view, etc.)
- All enums (order_status, role, analytics_event_type)
- 58 Algerian wilayas seed data in delivery_wilayas table
- Orders table phone validation (remains NOT NULL with CHECK constraint)
- Admin authentication (separate admins table)

### 2. Application Code Changes

#### Files Modified:

1. **`app/(auth)/signup/page.tsx`**
   - Removed `phone` state variable
   - Removed phone input field from signup form
   - Removed phone parameter from `signUp()` call
   - Kept all French validation messages intact
   
2. **`app/actions/auth.ts`**
   - Updated `signup()` function to remove `phone` parameter
   - Removed phone from Supabase `auth.signUp()` metadata
   - Removed phone from users table insert operation
   - Users now created with only `id` and `name`

3. **`db/types.ts`**
   - Updated `users.Row.phone` to `string | null` (nullable)
   - Updated `users.Insert.phone` to optional (`phone?: string | null`)
   - Updated `users.Update.phone` to optional (`phone?: string | null`)

#### Files Verified (Unchanged):

1. **`lib/auth/index.ts`**
   - `SignUpData` interface already has phone as optional
   - `signUp()` function correctly handles optional phone in metadata
   - No changes needed

2. **`app/(auth)/login/page.tsx`**
   - Already email-only authentication
   - No changes needed

3. **`app/(public)/checkout/page.tsx`**
   - Phone field still required for delivery contact
   - No changes made

4. **`app/actions/orders.ts`**
   - Phone still required in order creation
   - No changes made

5. **`lib/validations/checkout.ts`**
   - Phone validation still strict (Algerian format)
   - No changes made

6. **`lib/auth/admin.ts`**
   - Admin authentication unchanged
   - Still uses separate admins table
   - No changes made

7. **`middleware.ts`**
   - Admin route protection unchanged
   - Still checks admins table for authorization
   - No changes made

## How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. Log in to your [Supabase project dashboard](https://app.supabase.com/)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `sup.sql` from this repository
5. Paste into the SQL Editor
6. Click **Run** to execute the migration
7. Review the NOTICE messages in the Results panel to confirm all changes
8. (Optional) Run the verification queries at the bottom of `sup.sql` to confirm success

### Option 2: Via Supabase CLI

```bash
# Ensure you have Supabase CLI installed
# Install: npm install -g supabase

# Method A: Direct push (if you have the database URL)
supabase db push --db-url "postgresql://[user]:[password]@[host]:[port]/[database]" < sup.sql

# Method B: Create a migration file
supabase migration new email_only_auth
# Copy the contents of sup.sql into the new migration file
# Then push migrations
supabase db push
```

### Option 3: Via psql (PostgreSQL CLI)

```bash
# Connect to your database
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Run the migration file
\i sup.sql

# Or pipe it directly
psql "postgresql://[user]:[password]@[host]:[port]/[database]" < sup.sql
```

## Verification Steps

After applying the migration, verify the changes:

### 1. Database Verification

Run these queries in Supabase SQL Editor or psql:

```sql
-- 1. Verify users.phone is nullable
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'phone';
-- Expected: is_nullable = 'YES'

-- 2. Verify no UNIQUE constraint on users.phone
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.users'::regclass AND attname = 'phone')];
-- Expected: Empty result (no constraints)

-- 3. Verify UNIQUE constraint exists on users.email
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.users'::regclass AND attname = 'email')];
-- Expected: One row with UNIQUE constraint

-- 4. Verify index on users.email
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_email';
-- Expected: One row with index definition

-- 5. Verify orders.phone still has NOT NULL and CHECK constraints
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'phone';
-- Expected: is_nullable = 'NO'

SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND pg_get_constraintdef(oid) LIKE '%phone%';
-- Expected: CHECK constraint with phone regex

-- 6. Verify all RLS policies still exist
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';
-- Expected: Same number as before migration

-- 7. Verify all triggers still exist
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Expected: Same number as before migration

-- 8. Verify all views still exist
SELECT COUNT(*) as view_count
FROM information_schema.views
WHERE table_schema = 'public';
-- Expected: All analytics views present

-- 9. Verify 58 wilayas exist
SELECT COUNT(*) as wilaya_count FROM delivery_wilayas;
-- Expected: 58
```

### 2. Application Verification

Test these user flows:

#### User Authentication:
- [ ] New user can sign up with email + password only (no phone required)
- [ ] User can log in with email + password
- [ ] User can log in with OTP (email-based)
- [ ] Guest cart merges correctly on login
- [ ] User cart persists across sessions

#### Order/Checkout Flow:
- [ ] Checkout form still collects phone for delivery
- [ ] Phone validation works (Algerian format)
- [ ] Orders are created successfully with phone
- [ ] User can view their orders

#### Admin Flow:
- [ ] Admin login requires being in admins table
- [ ] Non-admin users cannot access /admin routes
- [ ] Admin panel displays analytics correctly
- [ ] Admin can update order status
- [ ] Admin can upload images (Cloudinary)

#### Public Features:
- [ ] Products display with "Vente en gros" badge
- [ ] Categories filter works
- [ ] Product variants display correctly
- [ ] French labels throughout UI
- [ ] Home page dynamic content loads

## Feature Compliance Checklist

All 13 originally requested features remain intact:

- ✅ Public site with product listing
- ✅ Cart/checkout with COD payment
- ✅ Product variants support
- ✅ Guest cart and user cart with merge on login
- ✅ Orders system
- ✅ Admin panel with RLS + middleware protection (admins table separate from users)
- ✅ Cloudinary uploads for images
- ✅ Analytics with Supabase views (revenue_per_product, revenue_per_category, etc.)
- ✅ 58 Algerian wilayas seed data (delivery_wilayas table)
- ✅ French-first UI with proper RTL support
- ✅ "Vente en gros" badge on product cards
- ✅ Dynamic home content (home_content table)
- ✅ No hardcoded copy in UI
- ✅ CI workflow (.github/workflows/ci.yml)

## Build & Test Results

### TypeScript Type Check
```bash
npx tsc --noEmit
```
✅ **PASSED** - No type errors

### ESLint
```bash
npm run lint
```
✅ **PASSED** - No ESLint warnings or errors

### Production Build
```bash
npm run build
```
✅ **PASSED** - Build completed successfully
- All pages compiled correctly
- Middleware compiled successfully
- No critical warnings

## Important Notes

### What Changed
- **User signup** now only requires email, password, and name
- **Users table** phone field is now optional (can be null)
- Phone numbers can be added to user profiles later if needed
- **Backward compatible**: Existing users with phone numbers are not affected

### What Stayed the Same
- **Orders** still require phone for delivery contact
- **Checkout form** still validates phone number (Algerian format)
- **Admin authentication** completely unchanged (separate admins table)
- **All RLS policies, triggers, and views** remain intact
- **Cart functionality** unchanged (guest/user cart merge)
- **Analytics** fully functional
- **Cloudinary uploads** working
- **Home content** and store settings intact

### Security Considerations
- Email uniqueness is enforced at database level
- RLS policies protect all sensitive data
- Admin routes protected by middleware + RLS
- Phone validation in checkout prevents invalid delivery contacts
- No breaking changes to existing user data

## Rollback Plan

If you need to rollback the migration:

```sql
-- WARNING: This will prevent users without phone from logging in
BEGIN;

-- 1. Add back NOT NULL constraint (only if all users have phone)
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- 2. Add back UNIQUE constraint
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);

-- 3. Add back CHECK constraint
ALTER TABLE users ADD CONSTRAINT users_phone_check 
  CHECK (phone ~ '^\+?[0-9]{10,15}$');

-- 4. Drop index on email (if you want to remove it)
DROP INDEX IF EXISTS idx_users_email;

-- 5. Drop UNIQUE constraint on email (if you want to remove it)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

COMMIT;
```

**Note**: Only rollback if absolutely necessary. Ensure all existing users have valid phone numbers before adding NOT NULL constraint.

## Support

If you encounter any issues:

1. Check the NOTICE messages from the migration execution
2. Run the verification queries above
3. Check application logs for errors
4. Review Supabase logs for RLS policy violations
5. Test each user flow manually

## Files Changed in This Migration

### New Files:
- `sup.sql` - Database migration file
- `EMAIL_AUTH_MIGRATION.md` - This documentation

### Modified Files:
- `app/(auth)/signup/page.tsx` - Removed phone field
- `app/actions/auth.ts` - Removed phone from signup
- `db/types.ts` - Made phone optional/nullable

### Total Changes:
- 3 TypeScript files modified
- 1 SQL migration file created
- 1 documentation file created
- 0 breaking changes
- All features preserved

## Next Steps

After successful migration:

1. ✅ Deploy the updated application code
2. ✅ Test user signup with email-only
3. ✅ Test checkout flow (phone still required)
4. ✅ Test admin access (should be unchanged)
5. ✅ Monitor for any authentication issues
6. ✅ Update any external documentation
7. ✅ Inform users about the simplified signup process

## Conclusion

This migration successfully implements email-only user authentication while:
- Preserving all 13 original features
- Maintaining separate admin authentication
- Keeping phone collection for delivery purposes
- Ensuring backward compatibility
- Following best practices for database migrations
- Maintaining French-first UI
- Passing all build and lint checks

The codebase is now ready for deployment with simplified user authentication.
