# Supabase Database Schema Documentation

## Overview

This database schema is designed for a full-featured e-commerce platform with the following capabilities:
- Product catalog with variants
- Shopping cart (authenticated and anonymous)
- Order management with audit trail
- Delivery tracking by Algerian wilayas
- Analytics and funnel tracking
- Admin management
- Product reviews and ratings
- Wishlist functionality
- Revenue trends analysis
- Abandoned cart tracking
- Row Level Security (RLS)
- Storage bucket management for images

## Quick Start

### Running the Schema

To initialize your Supabase database, run:

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase.sql
```

Or use the Supabase dashboard SQL editor to paste and execute the contents of `supabase.sql`.

## Schema Components

### Enums

- **order_status**: `pending`, `confirmed`, `delivered`, `canceled`
- **role**: `user`, `admin`
- **analytics_event_type**: `page_view`, `product_view`, `add_to_cart`, `cart_abandon`, `checkout_start`, `order_placed`, `order_delivered`

### Tables

#### Core User Tables
- **users**: User profiles with phone authentication
- **admins**: Admin role assignments

#### Product Tables
- **categories**: Product categories with soft delete, active/featured flags
- **products**: Base products (may have variants) with soft delete, active/featured flags
- **product_variants**: Product variations (size, color, etc.)
- **sellable_items**: Actual SKUs that can be purchased with stock management
- **product_reviews**: Customer reviews and ratings (1-5 stars)

#### Shopping & Orders
- **carts**: Shopping carts for users or sessions (unique per user)
- **cart_items**: Items in carts
- **orders**: Customer orders with delivery information
- **order_items**: Items in orders with snapshot pricing
- **order_status_history**: Audit trail for all order status changes
- **delivery_wilayas**: 58 Algerian wilayas with delivery pricing

#### User Features
- **wishlists**: User wishlist items for saved products

#### Configuration
- **home_content**: Homepage content (singleton table)
- **store_settings**: Store configuration with logo (singleton table)

#### Analytics
- **analytics_events**: Event tracking for funnel analysis

### Views

#### Sales Analytics
- **best_selling_products**: Top products by quantity sold
- **revenue_per_product**: Revenue breakdown by product
- **revenue_per_category**: Revenue breakdown by category

#### Revenue Trends
- **daily_revenue_trends**: Daily revenue, order count, and metrics
- **weekly_revenue_trends**: Weekly revenue aggregation
- **monthly_revenue_trends**: Monthly revenue aggregation

#### Geographic Analytics
- **orders_per_wilaya**: Order statistics by wilaya

#### Conversion Analytics
- **funnel_view**: User journey from page view to order
- **product_conversion_rates**: View-to-cart and view-to-order conversion rates
- **abandoned_carts**: Analysis of carts not converted to orders
- **delivery_performance**: Delivery metrics (pending vs delivered)

### Triggers

#### Automatic Timestamps
All tables with mutable data have automatic `updated_at` timestamp triggers.

#### Stock Management
- **decrement_stock_on_order_confirm**: Atomically reduces stock when order status changes to `confirmed`
  - Prevents negative stock
  - Raises exception if insufficient stock
- **restore_stock_on_order_cancel**: Restores stock when order is canceled from confirmed status
- **restore_stock_on_order_unconfirm**: Restores stock when order transitions from confirmed back to pending

#### Audit Trail
- **log_order_status_change**: Automatically logs all order status changes to order_status_history table with timestamp and user who made the change

### Helper Functions

#### Cart Management
- **calculate_cart_total(cart_id)**: Returns subtotal, delivery price, total, and item count for a cart
- **merge_anonymous_cart(session_id, user_id)**: Merges anonymous session cart into user cart on login
- **check_stock_availability(cart_id)**: Validates all items in cart have sufficient stock

#### Order Management
- **get_order_summary(order_id)**: Returns complete order details with all items
- **validate_stock_before_confirm(order_id)**: Validates stock availability before order confirmation

#### Security
- **validate_session_ownership(session_id)**: Validates session ownership for anonymous carts
- **is_admin()**: Checks if current user has admin privileges

### Row Level Security (RLS)

#### Public Read Access
The following tables are readable by everyone:
- categories
- products
- product_variants
- sellable_items
- delivery_wilayas
- home_content
- store_settings

#### User-Scoped Access

**Carts & Cart Items:**
- Users can access their own carts (by `user_id`)
- Anonymous users can access session-based carts with proper session validation
- Full CRUD operations within scope

**Orders & Order Items:**
- Users can view and create their own orders
- Guest checkout supported (orders without user_id)
- Orders are scoped to `user_id` when authenticated

**Users Table:**
- Users can view and update their own profile
- Users can create their own profile (signup)

**Product Reviews:**
- Anyone can view reviews
- Users can create, update, and delete their own reviews
- One review per user per product

**Wishlists:**
- Users can view, add, and remove items from their own wishlist

**Order Status History:**
- Users can view status history for their own orders

#### Admin Access

Admins have full access to:
- All user data
- All orders with update capabilities
- Admin table management (insert/update/delete admins)
- Product management (categories, products, variants, sellable items)
- Configuration (home_content, store_settings, delivery_wilayas)
- Analytics data
- All reviews and wishlists
- Order status history

Admin status is determined by the `is_admin()` function, which checks if the authenticated user exists in the `admins` table.

#### Analytics

- **Insert**: Anyone can insert analytics events (for tracking)
- **Read**: Users can view their own events, admins can view all analytics data

#### Storage Buckets

Three storage buckets are configured with RLS policies:
- **product-images**: Public read, admin write (5MB limit, images only)
- **category-images**: Public read, admin write (5MB limit, images only)
- **store-logos**: Public read, admin write (2MB limit, includes SVG)

## Indexes

All foreign keys have indexes for performance:
- `admins(user_id)`
- `products(category_id)`
- `product_variants(product_id)`
- `sellable_items(product_id, variant_id, stock)`
- `carts(user_id, session_id)`
- `cart_items(cart_id, sellable_item_id, updated_at)`
- `orders(user_id, wilaya_id, status, created_at)`
- `orders(status, created_at)` - Composite index
- `order_items(order_id, sellable_item_id)`
- `product_reviews(product_id, user_id)`
- `wishlists(user_id, sellable_item_id)`
- `order_status_history(order_id, created_at)`

Soft delete indexes:
- `categories(deleted_at)` - Partial index for active categories
- `products(deleted_at)` - Partial index for active products

Analytics-specific indexes:
- `analytics_events(event_type, created_at)`
- `analytics_events(user_id, created_at)`
- `analytics_events(session_id, created_at)`

## Usage Examples

### Product Structure

```sql
-- Simple product without variants
INSERT INTO products (name, category_id, has_variants) 
VALUES ('Basic T-Shirt', '<category-uuid>', FALSE);

INSERT INTO sellable_items (product_id, sku, price, stock, description)
VALUES ('<product-uuid>', 'TSHIRT-001', 1500.00, 100, 'Cotton T-Shirt');

-- Product with variants
INSERT INTO products (name, category_id, has_variants)
VALUES ('Premium T-Shirt', '<category-uuid>', TRUE);

INSERT INTO product_variants (product_id, name)
VALUES ('<product-uuid>', 'Small'), ('<product-uuid>', 'Medium');

INSERT INTO sellable_items (product_id, variant_id, sku, price, stock)
VALUES 
  ('<product-uuid>', '<small-variant-uuid>', 'TSHIRT-S', 2000.00, 50),
  ('<product-uuid>', '<medium-variant-uuid>', 'TSHIRT-M', 2000.00, 75);
```

### Order Flow

1. **Create Cart**: User adds items to cart
2. **Checkout**: Create order from cart items
3. **Confirm**: Admin confirms order → stock is automatically decremented
4. **Deliver**: Admin marks as delivered

### Stock Management

Stock is automatically managed:
- When order status changes to `confirmed`, stock is decremented
- If stock would go negative, the transaction fails
- Stock checks should be performed before order confirmation

### Analytics Tracking

```sql
-- Track page view
INSERT INTO analytics_events (session_id, event_type, metadata)
VALUES ('session-123', 'page_view', '{"page": "/products"}');

-- Track product view
INSERT INTO analytics_events (user_id, event_type, metadata)
VALUES ('<user-uuid>', 'product_view', '{"product_id": "<product-uuid>"}');

-- View funnel
SELECT * FROM funnel_view;
```

## Security Notes

1. **Admin Function**: The `is_admin()` function is `SECURITY DEFINER`, allowing it to check admin status regardless of RLS policies.

2. **Session-Based Carts**: Anonymous users can create carts using a `session_id`. Make sure to generate secure, unique session IDs in your application.

3. **Phone Authentication**: The `users` table uses phone numbers as unique identifiers. Integrate with Supabase Auth for phone-based authentication.

4. **Order Integrity**: Orders capture price at the time of order (`price_at_order`) to maintain historical accuracy even if product prices change.

5. **Stock Prevention**: The trigger prevents negative stock, but you should also validate stock availability in your application before allowing order creation.

## Maintenance

### Updating Delivery Prices for Wilayas

All 58 Algerian wilayas are pre-seeded with default delivery price of 0. Admins can update the delivery prices:

```sql
-- Update delivery price for a specific wilaya
UPDATE delivery_wilayas 
SET delivery_price = 500.00
WHERE id = 16; -- Alger

-- Update multiple wilayas
UPDATE delivery_wilayas 
SET delivery_price = 600.00
WHERE id IN (31, 9, 35); -- Oran, Blida, Boumerdès
```

### Making a User an Admin

```sql
INSERT INTO admins (user_id, role)
VALUES ('<user-uuid>', 'admin');
```

### Updating Store Settings

```sql
UPDATE store_settings 
SET store_name = 'My Awesome Store',
    primary_color = '#FF5733'
WHERE id = 1;
```

## Performance Considerations

1. **Indexes**: All foreign keys and commonly queried fields have indexes
2. **Views**: Pre-computed aggregation views for analytics
3. **Atomic Operations**: Stock updates are atomic to prevent race conditions
4. **RLS**: Row-level security is applied but indexed fields are used in policies for performance
5. **Partial Indexes**: Soft delete queries use partial indexes for better performance

## Data Validation

The schema includes comprehensive validation constraints:

### Phone Numbers
Phone numbers are validated to match international format: `^\+?[0-9]{10,15}$`

### URLs
Image URLs are validated to ensure they start with `http://` or `https://`

### Prices
- Product prices: Limited to reasonable range (0 - 999,999.99)
- Order totals: Limited to prevent data overflow (0 - 9,999,999.99)

### Business Rules
- Users can only have one active cart (enforced by unique constraint)
- Each user can only review a product once
- Product variants must belong to their parent product
- Stock cannot go negative (enforced by triggers)

## New Features

### Soft Delete
Products and categories support soft delete via `deleted_at` timestamp:
```sql
-- Soft delete a product
UPDATE products SET deleted_at = NOW() WHERE id = '<product-uuid>';

-- Restore a product
UPDATE products SET deleted_at = NULL WHERE id = '<product-uuid>';

-- Query only active products
SELECT * FROM products WHERE deleted_at IS NULL;
```

### Product Reviews
```sql
-- Add a review
INSERT INTO product_reviews (product_id, user_id, rating, review_text, is_verified_purchase)
VALUES ('<product-uuid>', '<user-uuid>', 5, 'Excellent product!', TRUE);

-- Get average rating for a product
SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
FROM product_reviews
WHERE product_id = '<product-uuid>';
```

### Wishlist
```sql
-- Add to wishlist
INSERT INTO wishlists (user_id, sellable_item_id)
VALUES ('<user-uuid>', '<item-uuid>');

-- Get user's wishlist
SELECT si.*, p.name, p.description
FROM wishlists w
JOIN sellable_items si ON w.sellable_item_id = si.id
JOIN products p ON si.product_id = p.id
WHERE w.user_id = '<user-uuid>';
```

### Helper Functions Usage
```sql
-- Calculate cart total
SELECT * FROM calculate_cart_total('<cart-uuid>');

-- Check stock availability
SELECT * FROM check_stock_availability('<cart-uuid>');

-- Merge anonymous cart on login
SELECT merge_anonymous_cart('session-123', '<user-uuid>');

-- Get complete order summary
SELECT * FROM get_order_summary('<order-uuid>');
```

### Revenue Analytics
```sql
-- Daily revenue
SELECT * FROM daily_revenue_trends 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;

-- Monthly trends
SELECT * FROM monthly_revenue_trends
ORDER BY month_start DESC
LIMIT 12;

-- Abandoned carts
SELECT * FROM abandoned_carts
WHERE cart_value > 1000
ORDER BY cart_value DESC;

-- Product conversion rates
SELECT * FROM product_conversion_rates
WHERE product_views > 100
ORDER BY view_to_order_rate DESC;
```

### Order Audit Trail
```sql
-- View order status history
SELECT 
  osh.*,
  u.name as changed_by_name
FROM order_status_history osh
LEFT JOIN users u ON osh.changed_by = u.id
WHERE order_id = '<order-uuid>'
ORDER BY created_at DESC;
```

## Migration Notes

If you need to modify the schema:
1. Use migrations for incremental changes
2. Test RLS policies thoroughly after changes
3. Re-index if adding new query patterns
4. Update views if table structures change
