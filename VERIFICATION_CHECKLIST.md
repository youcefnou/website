# Verification Checklist - Admin Orders Export & Status

## Required Flows
- [ ] Guest → cart → checkout → order created successfully
- [ ] Logged-in user → cart → checkout → order created successfully

## Orders Data Integrity
- [ ] Orders include `full_name` for the owner
- [ ] Line items carry correct product name, variant group, and phone model
- [ ] Quantities and unit prices match checkout values

## Admin Status Management
- [ ] Admin can view all orders
- [ ] Admin can update status through pending → confirmed → shipped
- [ ] Admin can set status to cancelled
- [ ] Status changes persist in the database and refresh in UI
- [ ] Only allowed statuses are used: pending, confirmed, shipped, cancelled

## Admin Export
- [ ] Export works with selected orders and with all orders
- [ ] CSV export columns match checkout layout: Order Owner, Produit, Variante, Modèle, Qté, Prix unitaire, Sous-total
- [ ] Excel (XLSX) export uses the same columns and one row per line item
- [ ] Export preserves variant and model details (no grouping/merging)
- [ ] Export respects the current selection/filter

## Safety Checks
- [ ] No Supabase SQL changes
- [ ] No RLS changes
- [ ] No middleware changes
- [ ] Checkout and cart flows remain unchanged

# Verification Checklist - Carousel & Category Cards Implementation

## Pre-Deployment Checklist

### Database Migration
- [ ] Open Supabase SQL Editor
- [ ] Execute `migrations/add_custom_settings.sql`
- [ ] Verify column exists: `SELECT custom_settings FROM store_settings WHERE id = 1;`
- [ ] Confirm default carousel slides are present
- [ ] Check JSON structure is valid

### Code Verification
- [x] All TypeScript types defined
- [x] No linting errors
- [x] Build successful
- [x] No console errors in development
- [x] All imports correct

### Admin Panel Access
- [ ] Login as admin user
- [ ] Navigate to `/admin/settings`
- [ ] Verify "Gestion du carrousel" link visible
- [ ] Verify "Gestion des cartes de catégories" link visible
- [ ] Click both links to ensure pages load

### Carousel Manager Testing
- [ ] Access `/admin/settings/carousel`
- [ ] Page loads without errors
- [ ] Default slides are displayed (3 slides)
- [ ] Test adding a new slide
- [ ] Test editing slide title
- [ ] Test changing gradient color
- [ ] Test disabling a slide
- [ ] Test reordering slides (up/down buttons)
- [ ] Test deleting a slide
- [ ] Configure carousel settings:
  - [ ] Toggle auto-play
  - [ ] Change interval to different value
  - [ ] Toggle show arrows
  - [ ] Toggle show dots
- [ ] Click "Sauvegarder" (Save)
- [ ] Verify success toast appears
- [ ] Navigate to homepage
- [ ] Confirm carousel shows updated content
- [ ] Test carousel auto-advance (if enabled)
- [ ] Test navigation arrows (if enabled)
- [ ] Test indicator dots (if enabled)

### Category Cards Manager Testing
- [ ] Access `/admin/settings/category-cards`
- [ ] Page loads without errors
- [ ] Test adding a new card
- [ ] Test icon picker:
  - [ ] Click through all 11 icons
  - [ ] Verify selection highlights
- [ ] Test color picker:
  - [ ] Click through all 8 colors
  - [ ] Verify selection ring appears
- [ ] Test linking to category:
  - [ ] Select existing category from dropdown
  - [ ] Verify card name can be custom
- [ ] Test preview panel shows correct icon/color
- [ ] Test disabling a card
- [ ] Test reordering cards
- [ ] Test deleting a card
- [ ] Click "Sauvegarder" (Save)
- [ ] Verify success toast appears
- [ ] Navigate to homepage
- [ ] Confirm category cards show updated content
- [ ] Click a category card
- [ ] Verify redirects to filtered products page

### Homepage Verification
- [ ] Visit homepage as non-admin user
- [ ] Carousel section loads
- [ ] Slides transition properly
- [ ] Category cards section loads
- [ ] Cards display with correct icons and colors
- [ ] Hover effects work on cards
- [ ] Featured products section still works
- [ ] Features section still works
- [ ] No console errors

### Product Page Verification
- [ ] Visit any product page
- [ ] Category badge appears below title
- [ ] Badge has correct category name
- [ ] Badge is clickable
- [ ] Clicking badge redirects to filtered products
- [ ] Filter actually works (shows only that category)
- [ ] Badge styling is consistent

### Navigation Verification
Admin Panel:
- [ ] Login as admin
- [ ] Verify "Accueil" link in top navigation
- [ ] Click link
- [ ] Verify redirects to homepage
- [ ] Navigate back to admin
- [ ] Verify still authenticated

User Account:
- [ ] Login as regular user
- [ ] Go to `/account`
- [ ] Verify "Accueil" link in sidebar (first item)
- [ ] Click link
- [ ] Verify redirects to homepage
- [ ] Navigate back to account
- [ ] Verify still authenticated

### UI Enhancement Verification
Admin Dashboard (`/admin`):
- [ ] Stat cards have colored icon backgrounds
- [ ] Cards have shadow effects
- [ ] Hover increases shadow
- [ ] Icons are visible and appropriate
- [ ] Numbers are bold and large
- [ ] Trend indicators present

Admin Products (`/admin/products`):
- [ ] Search bar present at top
- [ ] Product cards have shadows
- [ ] Stock badges show correct colors (green/red)
- [ ] SKU displayed in mono font
- [ ] Empty state shows icon and CTA
- [ ] Hover effects work

Admin Orders (`/admin/orders`):
- [ ] Icon header present
- [ ] Consistent styling with other pages

### Mobile Responsiveness
- [ ] Test on mobile viewport (375px)
- [ ] Carousel scales properly
- [ ] Category cards stack correctly
- [ ] Admin panels are usable
- [ ] Buttons are touch-friendly (44px+)
- [ ] Text is readable
- [ ] No horizontal scroll

### API Endpoint Testing
Carousel API:
```bash
# Test with curl (replace with actual auth token)
curl -X POST http://localhost:3000/api/admin/carousel \
  -H "Content-Type: application/json" \
  -d '{"slides":[],"settings":{"auto_play":true,"interval":5000,"show_arrows":true,"show_dots":true}}'
```
- [ ] Returns 401 without auth
- [ ] Returns 200 with admin auth
- [ ] Updates database correctly

Category Cards API:
```bash
curl -X POST http://localhost:3000/api/admin/category-cards \
  -H "Content-Type: application/json" \
  -d '{"cards":[]}'
```
- [ ] Returns 401 without auth
- [ ] Returns 200 with admin auth
- [ ] Updates database correctly

### Error Handling
- [ ] Try saving carousel with invalid data
- [ ] Verify error toast appears
- [ ] Try accessing admin pages without auth
- [ ] Verify redirect to login/home
- [ ] Test with network offline
- [ ] Verify graceful error messages

### Performance
- [ ] Homepage loads in < 2 seconds
- [ ] Admin pages load in < 1 second
- [ ] No significant layout shifts
- [ ] Images load progressively
- [ ] No memory leaks (check DevTools)

### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Post-Deployment Verification

### Production Environment
- [ ] Migration ran successfully
- [ ] No errors in production logs
- [ ] Admin panel accessible
- [ ] Carousel manager works
- [ ] Category cards manager works
- [ ] Homepage displays correctly
- [ ] SSL certificate valid
- [ ] Performance is acceptable

### User Acceptance
- [ ] Admin can manage carousel
- [ ] Admin can manage categories
- [ ] Users see dynamic content
- [ ] No existing features broken
- [ ] Mobile experience is good

## Rollback Plan

If issues occur:
1. Revert database migration:
   ```sql
   ALTER TABLE store_settings DROP COLUMN IF EXISTS custom_settings;
   ```
2. Revert code to previous commit
3. Redeploy
4. Verify functionality restored

## Success Metrics

- [ ] Zero critical bugs
- [ ] Admin can use features without training
- [ ] Homepage load time < 2s
- [ ] Mobile score > 90 (Lighthouse)
- [ ] No accessibility violations
- [ ] User satisfaction positive

## Sign-Off

- [ ] Developer verified functionality
- [ ] QA team tested all scenarios
- [ ] Product owner approved features
- [ ] Ready for production deployment

---

**Date**: _______________
**Tester**: _______________
**Status**: ☐ Pass ☐ Fail ☐ Pending
**Notes**: 
_______________________________________________
_______________________________________________
_______________________________________________
