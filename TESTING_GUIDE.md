# Testing Guide for Currency Display and Order Creation Fixes

## Overview
This guide provides step-by-step instructions to test the fixes applied in this PR.

## Prerequisites
- Database migration applied: `migrations/fix_orders_rls_policy.sql`
- Application deployed with latest changes
- Test accounts ready (one authenticated user, one for guest testing)

---

## Test 1: Currency Display

### Objective
Verify that all currency amounts display consistently in Latin letters (DA or DZD), not Arabic script.

### Test Steps

#### 1.1 Product Page
1. Navigate to any product page (e.g., `/product/[id]`)
2. Check the price display
3. **Expected**: Price shown as "X.XX DA" or "X.XX DZD" in Latin letters

#### 1.2 Cart Page
1. Add items to cart
2. Navigate to `/cart`
3. Check prices for individual items and subtotal
4. **Expected**: All prices shown in Latin letters (DA/DZD)

#### 1.3 Mobile Cart Drawer
1. On mobile view, click cart icon
2. Check prices in the drawer
3. **Expected**: All prices shown as "X DA" or "X.XX DA" in Latin letters

#### 1.4 Checkout Page
1. Proceed to checkout
2. Check prices in order summary
3. **Expected**: Subtotal, delivery, and total shown in Latin letters

#### 1.5 Admin Dashboard
1. Log in as admin
2. Navigate to `/admin`
3. Check total revenue display
4. **Expected**: Revenue shown as "X.XX DA" in Latin letters

#### 1.6 Admin Analytics
1. On admin dashboard, scroll to analytics section
2. Check revenue charts and tables
3. **Expected**: All revenue amounts shown in Latin letters

### Success Criteria
✅ No instances of Arabic currency symbols (د.ج)
✅ All amounts consistently use "DA" or "DZD"
✅ Numbers formatted correctly with 2 decimal places

---

## Test 2: Cart Variant Display

### Objective
Verify that product variants are grouped correctly in the cart.

### Test Steps

#### 2.1 Add Multiple Variants
1. Find a product with variants (e.g., phone cases with different models)
2. Add at least 3 different variants to cart
3. Navigate to `/cart`

#### 2.2 Verify Grouping
1. Check how variants are displayed
2. **Expected**:
   - Variants grouped under one product entry
   - Single product image shown for the group
   - Each variant listed with clean label (e.g., "Oppo A16" not "UUID-123...")
   - Quantity controls for each variant

### Success Criteria
✅ Variants grouped under product name
✅ Clean variant labels (no UUIDs in display)
✅ Main product image displayed
✅ Individual quantity controls work

---

## Test 3: Checkout Summary Grouped Variants

### Objective
Verify that checkout summary groups variants and shows consolidated count.

### Test Steps

#### 3.1 Checkout with Multiple Variants
1. Add multiple variants of same product to cart
2. Proceed to checkout
3. Check order summary section

#### 3.2 Verify Summary Display
**Expected**:
- Product name with variant count: "Product Name (3 variants)"
- Individual variant details shown with quantities
- Clean variant labels (e.g., "iPhone 13" not "SKU: abc123...")

### Success Criteria
✅ Variants grouped with count display
✅ Individual variants listed underneath
✅ Clean variant labels
✅ Correct price calculations

---

## Test 4: Order Creation - Guest User

### Objective
Verify that guest users can successfully create orders.

### Test Steps

#### 4.1 Create Guest Order
1. Open browser in incognito/private mode
2. Browse products and add items to cart
3. Proceed to checkout
4. Fill in delivery information
5. Click "Confirmer la commande"

#### 4.2 Verify Success
**Expected**:
- Order creates successfully
- No RLS policy error
- Redirected to confirmation or orders page
- Order visible in admin panel with NULL user_id

### Success Criteria
✅ Order creation succeeds
✅ No "row violates row-level security policy" error
✅ Order appears in database with user_id = NULL

---

## Test 5: Order Creation - Authenticated User

### Objective
Verify that logged-in users can create orders.

### Test Steps

#### 5.1 Create User Order
1. Log in to the application
2. Add items to cart
3. Proceed to checkout
4. Fill in delivery information
5. Click "Confirmer la commande"

#### 5.2 Verify Success
**Expected**:
- Order creates successfully
- User can view order in account page
- Order in database has correct user_id

### Success Criteria
✅ Order creation succeeds
✅ Order visible in user's account/orders page
✅ Order has correct user_id in database

---

## Test 6: SKU Management

### Objective
Verify that administrators can manually manage SKUs.

### Test Steps

#### 6.1 Create Product with Manual SKU
1. Log in as admin
2. Navigate to `/admin/products/new`
3. Fill product details
4. For variants, enter custom SKU (e.g., "CASE-001")
5. Save product

#### 6.2 Verify SKU
**Expected**:
- Product saved with custom SKU
- SKU visible in admin product list
- SKU used in system (not auto-generated UUID)

#### 6.3 Create Product without SKU
1. Create another product
2. Leave SKU field empty
3. Save product

#### 6.4 Verify Auto-Generation
**Expected**:
- Product saved successfully
- SKU auto-generated by system
- Product functions normally

### Success Criteria
✅ Manual SKU entry works
✅ Auto-generation works when SKU not provided
✅ Both products function correctly

---

## Common Issues and Troubleshooting

### Issue: Guest orders still fail
**Check**: Has the database migration been applied?
**Solution**: Run `migrations/fix_orders_rls_policy.sql`

### Issue: Currency still shows Arabic
**Check**: Has the application been redeployed with new changes?
**Solution**: Ensure latest code is deployed and cache is cleared

### Issue: Variants not grouping
**Check**: Are the items actually variants of the same product?
**Solution**: Verify product setup in admin panel

---

## Reporting Issues

If any tests fail, report with:
1. Test number and step that failed
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Browser and device information
6. Console errors (if any)

---

## Rollback Plan

If critical issues are found:

1. **Currency Display**: Changes are cosmetic, no data impact
   - Can be reverted without data loss
   
2. **Order Creation**: Requires database rollback
   ```sql
   DROP POLICY "Users can create their own orders" ON orders;
   CREATE POLICY "Users can create their own orders"
     ON orders FOR INSERT
     WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
   ```
   - Note: This will break guest orders again
