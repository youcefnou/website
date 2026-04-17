# Consolidated Database Schema

## Overview

The `consolidated_schema.sql` file is a comprehensive, single-file database schema that consolidates all SQL schema definitions and migrations for the e-commerce platform. This file simplifies database setup and ensures consistency across deployments.

**✨ UPDATED**: Schema now uses **email-based authentication** with optional phone numbers, supports **guest orders**, and includes enhanced **cart tracking** with detailed product/variant information.

## Contents

The consolidated schema includes the following sections:

### 1. **ENUMS** (Lines ~25-64)
Defines all enumeration types:
- `order_status`: pending, confirmed, delivered, canceled
- `role`: user, admin
- `analytics_event_type`: page_view, product_view, add_to_cart, etc.

### 2. **SCHEMA DEFINITIONS** (Lines ~65-390)
Complete table definitions with constraints and comments:
- `users` - **Email-based authentication** (phone optional)
- `admins` - Admin privileges with role-based access
- `categories` - Product categories
- `products` - Base products
- `product_variants` - Product variations (size, color, etc.)
- `sellable_items` - Actual SKUs that can be purchased
- `delivery_wilayas` - 58 Algerian wilayas with delivery pricing
- `carts` - Shopping carts (user and anonymous)
- `cart_items` - Items in carts
- `orders` - Customer orders (**supports guest orders** with NULL user_id)
- `order_items` - Items in orders
- `home_content` - Homepage configuration (singleton)
- `store_settings` - Store configuration (singleton, includes email/phone in contact_info)
- `analytics_events` - User behavior tracking
- `product_reviews` - Customer reviews
- `wishlists` - User wishlists
- `order_status_history` - Order status audit trail
- `pages` - Static pages (FAQ, About)

### 3. **INDEXES** (Lines ~391-450)
Performance indexes for:
- Foreign key relationships
- Analytics queries
- Order status and date filtering
- Soft delete queries

### 4. **VIEWS** (Lines ~451-700)
Analytics and reporting views:
- `best_selling_products` - Top sellers by quantity
- `revenue_per_product` - Revenue breakdown by product
- `revenue_per_category` - Revenue breakdown by category
- `orders_per_wilaya` - Order statistics by location
- `funnel_view` - Conversion funnel metrics
- `delivery_performance` - Delivery metrics
- `daily_revenue_trends` - Daily revenue analysis
- `weekly_revenue_trends` - Weekly revenue analysis
- `monthly_revenue_trends` - Monthly revenue analysis
- `abandoned_carts` - Abandoned cart analysis
- `product_conversion_rates` - View-to-purchase rates

### 5. **TRIGGERS** (Lines ~701-920)
Automatic business logic:
- `update_updated_at_column()` - Auto-update timestamps
- `validate_variant_belongs_to_product()` - Ensure variant consistency
- `decrement_stock_on_order_confirm()` - Reduce stock on order confirmation
- `restore_stock_on_order_cancel()` - Restore stock on cancellation
- `restore_stock_on_order_unconfirm()` - Restore stock on status change
- `log_order_status_change()` - Audit trail for order updates

### 6. **HELPER FUNCTIONS** (Lines ~921-1120)
Utility functions:
- `calculate_cart_total()` - Calculate cart totals
- **`get_cart_details()` - Get detailed cart with product/variant info (NEW)**
- `merge_anonymous_cart()` - Merge carts on user login
- `check_stock_availability()` - Verify stock before checkout
- `validate_stock_before_confirm()` - Pre-order validation
- `get_order_summary()` - Complete order details with variants
- `is_admin()` - Check admin privileges
- `validate_session_ownership()` - Session validation

### 7. **POLICY DEFINITIONS** (Lines ~1121-1400)
Row Level Security (RLS) policies:
- Public read access for products, categories
- User-specific access for carts, orders, wishlists
- **Guest order support** - explicit NULL handling in policies
- Admin full access to all data
- Secure policies for anonymous users (session validation)
- **Fixed RLS for guest order creation** (NULL = NULL issue resolved)

### 8. **DEFAULT DATA INSERTIONS** (Lines ~1401-1560)
Initial data:
- Home content settings
- Store settings with default values (includes email/phone in contact_info)
- All 58 Algerian wilayas (Adrar to El Meniaa)
- Default FAQ page (in French)
- Default About page (in French)

### 9. **MIGRATIONS** (Lines ~1561-1710)
Consolidated migrations from `migrations/` folder:
- `add_footer_config.sql` - Social links and contact info
- `add_pages_table.sql` - Pages table creation
- `add_custom_settings.sql` - Carousel and category cards
- `add_footer_tagline.sql` - Footer tagline field
- `fix_orders_rls_policy.sql` - Guest order fix

### 10. **STORAGE BUCKETS** (Lines ~1711-1790)
Image storage configuration:
- `product-images` - Product image uploads (5MB limit)
- `category-images` - Category image uploads (5MB limit)
- `store-logos` - Store logo uploads (2MB limit)
- Storage policies for public viewing and admin management

## Usage

### Initial Database Setup

1. **Access Supabase SQL Editor**
   - Navigate to your Supabase project dashboard
   - Go to SQL Editor

2. **Execute the Consolidated Schema**
   ```sql
   -- Copy and paste the entire contents of consolidated_schema.sql
   -- Click "Run" or press Ctrl+Enter
   ```

3. **Verify Execution**
   - Check for any error messages
   - Review NOTICE messages confirming successful operations
   - Verify all tables exist in the Table Editor

### Re-running the Schema

The consolidated schema is **idempotent** - it can be run multiple times safely:
- Uses `CREATE IF NOT EXISTS` for tables
- Uses `DO $$ ... EXCEPTION WHEN duplicate_object` for enums
- Uses `ON CONFLICT DO NOTHING` for default data
- Uses `DROP POLICY IF EXISTS` before recreating policies

### Post-Deployment Checklist

After running the consolidated schema:

- [ ] **Verify Tables** - Check all 17 tables exist
- [ ] **Verify Views** - Confirm 11 analytics views created
- [ ] **Verify RLS** - Test RLS policies work correctly
- [ ] **Verify Triggers** - Test automatic updates work
- [ ] **Verify Initial Data** - Check wilayas, settings, pages inserted
- [ ] **Test Authentication** - Verify user login/signup
- [ ] **Test Cart Operations** - Test both anonymous and authenticated carts
- [ ] **Test Order Placement** - Verify guest and user orders work
- [ ] **Test Admin Operations** - Verify admin CRUD operations

## Key Features

### Authentication & User Management
- **Email-based authentication** (phone optional)
- Guest user support for orders (no registration required)
- Admin role management via `admins` table and `role` enum
- Row-level security for data isolation

### E-commerce Functionality
- **Product variants** (size, color, etc.) with proper tracking
- **Detailed cart system** with product name, variant, unit price, total, quantities
- Order management with delivery status tracking
- Cart function: `get_cart_details()` returns comprehensive item info
- Order function: `get_order_summary()` returns complete order with variants
- Stock management with automatic updates on order confirmation/cancellation

### Security
- **Row Level Security (RLS)** enabled on all tables
- User-specific data isolation
- **Guest order support** with explicit NULL handling in RLS policies
- Admin-only access to sensitive operations
- Secure session validation for anonymous users
- Fixed guest order creation (NULL = NULL SQL issue resolved)

### Contact Information
- Email and phone placeholders in `store_settings.contact_info` JSONB
- Customer contact info captured in orders (phone field)
- Flexible contact management for store operations

### Order Metadata
- **Delivery status** tracked via `order_status` enum (pending, confirmed, delivered, canceled)
- **Created timestamp** (`created_at`) for all orders
- **Customer contact** information (full_name, phone) in orders table
- Order history tracking via `order_status_history` table

### Data Integrity
- Foreign key constraints
- Check constraints for valid data ranges
- Unique constraints where appropriate
- Trigger-based validation (e.g., variant belongs to product)

### Performance
- Comprehensive indexing strategy
- Optimized queries in views
- Efficient soft delete implementation

### Algerian Context
- 58 official Algerian wilayas
- French language content (FAQ, About pages)
- COD (Cash on Delivery) payment support
- Wilaya-specific delivery pricing

## Troubleshooting

### Common Issues

**Issue**: "relation already exists" errors
- **Solution**: This is normal - the schema is idempotent and will skip existing objects

**Issue**: Guest users cannot create orders
- **Solution**: The `fix_orders_rls_policy` migration addresses this with explicit NULL handling

**Issue**: Storage bucket policies not working
- **Solution**: Ensure the `is_admin()` function is created before storage policies

**Issue**: Views returning no data
- **Solution**: Views depend on orders having status 'confirmed' or 'delivered'. Populate test data first.

### Debugging Tips

1. **Check table existence**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Verify RLS policies**:
   ```sql
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Check triggers**:
   ```sql
   SELECT trigger_name, event_object_table, action_statement 
   FROM information_schema.triggers 
   WHERE trigger_schema = 'public';
   ```

4. **Verify data insertion**:
   ```sql
   SELECT COUNT(*) FROM delivery_wilayas; -- Should be 58
   SELECT * FROM store_settings WHERE id = 1;
   SELECT * FROM pages;
   ```

## Migration History

This consolidated schema replaces the following individual files:
- `supabase.sql` - Original schema
- `sup.sql` - Alternative schema
- `migrations/add_footer_config.sql`
- `migrations/add_pages_table.sql`
- `migrations/add_custom_settings.sql`
- `migrations/add_footer_tagline.sql`
- `migrations/fix_orders_rls_policy.sql`

## Maintenance

### Adding New Migrations

When adding new database changes:
1. Create a separate migration file in `migrations/` folder first
2. Test the migration independently
3. Update `consolidated_schema.sql` to include the migration in Section 9
4. Ensure idempotency with appropriate guards

### Schema Updates

When updating the schema:
1. Make changes in the appropriate section
2. Update comments and documentation
3. Test with a fresh database
4. Update this README if necessary

## Support

For issues or questions:
- Check the troubleshooting section above
- Review inline comments in `consolidated_schema.sql`
- Refer to Supabase documentation: https://supabase.com/docs

## License

This schema is part of the e-commerce platform project and follows the project's licensing terms.
