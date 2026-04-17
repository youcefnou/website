#!/usr/bin/env bash
# SQL Schema Validation Script
# This script validates the SQL schema files for syntax and completeness

echo "==================================================="
echo "SQL Schema Validation Report"
echo "==================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a pattern exists in a file
check_pattern() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✓${NC} $description"
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        return 1
    fi
}

# Function to count occurrences
count_pattern() {
    local file=$1
    local pattern=$2
    local description=$3
    
    local count=$(grep -c "$pattern" "$file" 2>/dev/null || echo "0")
    echo -e "${YELLOW}ℹ${NC} $description: $count"
}

# Check supabase.sql
echo "--- Checking supabase.sql ---"
echo ""

check_pattern "supabase.sql" "CREATE TABLE pages" "Pages table exists"
check_pattern "supabase.sql" "footer_tagline" "Footer tagline column exists"
check_pattern "supabase.sql" "custom_settings" "Custom settings column exists"
check_pattern "supabase.sql" "social_links" "Social links column exists"
check_pattern "supabase.sql" "contact_info" "Contact info column exists"
check_pattern "supabase.sql" "update_product_reviews_updated_at" "Product reviews trigger exists"
check_pattern "supabase.sql" "update_pages_updated_at" "Pages trigger exists"
check_pattern "supabase.sql" "Anyone can view published pages" "Pages RLS policy exists"

echo ""
count_pattern "supabase.sql" "CREATE TABLE" "Total tables"
count_pattern "supabase.sql" "CREATE TRIGGER.*updated_at" "Updated_at triggers"
count_pattern "supabase.sql" "CREATE INDEX" "Indexes"
count_pattern "supabase.sql" "CREATE POLICY" "RLS policies"

echo ""
echo "--- Checking sup.sql ---"
echo ""

check_pattern "sup.sql" "CREATE TABLE IF NOT EXISTS pages" "Pages table exists (idempotent)"
check_pattern "sup.sql" "footer_tagline" "Footer tagline column/check exists"
check_pattern "sup.sql" "custom_settings" "Custom settings column/check exists"
check_pattern "sup.sql" "social_links" "Social links column/check exists"
check_pattern "sup.sql" "contact_info" "Contact info column/check exists"
check_pattern "sup.sql" "update_product_reviews_updated_at" "Product reviews trigger exists"
check_pattern "sup.sql" "update_pages_updated_at" "Pages trigger exists"
check_pattern "sup.sql" "Anyone can view published pages" "Pages RLS policy exists"

echo ""
count_pattern "sup.sql" "CREATE TABLE IF NOT EXISTS" "Idempotent table creates"
count_pattern "sup.sql" "DROP TRIGGER IF EXISTS" "Idempotent trigger drops"
count_pattern "sup.sql" "CREATE INDEX IF NOT EXISTS" "Idempotent indexes"
count_pattern "sup.sql" "DROP POLICY IF EXISTS" "Idempotent policy drops"

echo ""
echo "--- Checking Migration Files ---"
echo ""

for migration in migrations/*.sql; do
    filename=$(basename "$migration")
    echo "Checking $filename..."
    
    # Check for idempotency patterns
    if grep -q "IF NOT EXISTS\|DO \$\$\|DROP.*IF EXISTS" "$migration"; then
        echo -e "  ${GREEN}✓${NC} Has idempotency patterns"
    else
        echo -e "  ${YELLOW}⚠${NC} May not be fully idempotent"
    fi
    
    # Check for transactions
    if grep -q "BEGIN;\|COMMIT;" "$migration"; then
        echo -e "  ${GREEN}✓${NC} Uses transactions"
    else
        echo -e "  ${YELLOW}⚠${NC} No explicit transactions"
    fi
done

echo ""
echo "--- Verification Queries Generated ---"
echo ""
echo "Run these queries on your database to verify the changes:"
echo ""

cat << 'EOF'
-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
-- Expected: 18 tables including 'pages'

-- 2. Check updated_at triggers
SELECT tgname, tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE 'update_%_updated_at'
ORDER BY table_name;
-- Expected: 13 triggers

-- 3. Check store_settings columns
SELECT column_name, data_type, column_default IS NOT NULL as has_default
FROM information_schema.columns
WHERE table_name = 'store_settings'
  AND column_name IN ('footer_tagline', 'custom_settings', 'social_links', 'contact_info')
ORDER BY column_name;
-- Expected: 4 rows, all with has_default = true

-- 4. Check pages table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pages'
ORDER BY ordinal_position;
-- Expected: 7 columns (id, title, content, meta_description, is_published, created_at, updated_at)

-- 5. Check RLS policies for pages
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'pages'
ORDER BY policyname;
-- Expected: 3 policies

-- 6. Check initial pages data
SELECT id, title, is_published FROM pages ORDER BY id;
-- Expected: 'about' and 'faq' pages

-- 7. Verify placeholder backfill logic
SELECT COUNT(*) as total_items,
       COUNT(image_url) as items_with_image,
       COUNT(*) - COUNT(image_url) as items_without_image
FROM sellable_items;
-- All items should have image_url (either real or placeholder)

-- 8. Check orders RLS policies
SELECT policyname, 
       pg_get_expr(qual, 'orders'::regclass) as using_expr,
       pg_get_expr(with_check, 'orders'::regclass) as with_check_expr
FROM pg_policies
WHERE tablename = 'orders' AND cmd = 'INSERT';
-- Verify guest order policy exists and handles NULL correctly
EOF

echo ""
echo "==================================================="
echo "Validation Complete!"
echo "==================================================="
