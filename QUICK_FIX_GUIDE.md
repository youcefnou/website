# Quick Start: Apply Supabase RLS Fix

## TL;DR
Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Copy the entire content of:
migrations/fix_supabase_rls_insert_comprehensive.sql
```

## Problem
Guest users getting "new row violates row-level security policy" when creating orders.

## Solution
The migration fixes NULL comparison issues in RLS policies.

## Steps

### 1. Backup (Recommended)
```sql
-- Export current policies for backup
SELECT * FROM pg_policies 
WHERE tablename IN ('orders', 'order_items');
```

### 2. Apply Fix
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy content from `migrations/fix_supabase_rls_insert_comprehensive.sql`
4. Click "Run"

### 3. Verify
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items') 
  AND cmd = 'INSERT';
```

Should see:
- `Authenticated users can insert orders` (orders)
- `Guests can insert orders` (orders)
- `Allow inserts into order_items` (order_items)

### 4. Test
- Test guest checkout (not logged in)
- Test authenticated checkout (logged in)
- Both should work without errors

## Troubleshooting

### Still getting RLS errors?
1. Check if policies were created:
```sql
SELECT * FROM pg_policies WHERE tablename = 'orders';
```

2. Enable debug policy temporarily:
```sql
CREATE POLICY "DEBUG allow all inserts"
  ON orders FOR INSERT
  WITH CHECK (true);
```

3. Test again to confirm it's an RLS issue

4. **IMPORTANT:** Remove debug policy after testing:
```sql
DROP POLICY "DEBUG allow all inserts" ON orders;
```

## Need Help?
See full documentation:
- `SUPABASE_RLS_FIX_IMPLEMENTATION.md` - Complete implementation guide
- `migrations/README.md` - Detailed migration instructions
- `RLS_POLICY_FIX_EXPLAINED.md` - Technical explanation

## No Code Changes Needed
The TypeScript code already handles `user_id` correctly. Only database policies need updating.
