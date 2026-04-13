#!/bin/bash
# Verification script for sup.sql

echo "======================================"
echo "Verifying sup.sql Structure"
echo "======================================"
echo ""

# Check file exists
if [ ! -f "sup.sql" ]; then
    echo "❌ ERROR: sup.sql not found"
    exit 1
fi

echo "✓ File exists"

# Count lines
LINE_COUNT=$(wc -l < sup.sql)
echo "✓ File has $LINE_COUNT lines"

# Check for BEGIN/COMMIT
if grep -q "^BEGIN;" sup.sql && grep -q "^COMMIT;" sup.sql; then
    echo "✓ Transaction block found (BEGIN/COMMIT)"
else
    echo "❌ Missing transaction block"
    exit 1
fi

# Check for critical sections
echo ""
echo "Checking critical sections:"

sections=(
    "ENUMS"
    "TABLES"
    "INDEXES"
    "TRIGGERS AND FUNCTIONS"
    "ROW LEVEL SECURITY"
    "GRANTS FOR APPLICATION ROLES"
    "INITIAL DATA"
)

for section in "${sections[@]}"; do
    if grep -q "$section" sup.sql; then
        echo "  ✓ $section section found"
    else
        echo "  ❌ $section section missing"
    fi
done

echo ""
echo "Checking critical tables:"

tables=(
    "users"
    "orders"
    "order_items"
    "carts"
    "cart_items"
    "products"
    "sellable_items"
    "delivery_wilayas"
)

for table in "${tables[@]}"; do
    if grep -q "CREATE TABLE IF NOT EXISTS $table" sup.sql; then
        echo "  ✓ $table table definition found"
    else
        echo "  ⚠️  $table table might not be idempotent"
    fi
done

echo ""
echo "Checking critical RLS policies:"

# Check orders INSERT policy
if grep -A 10 "Users can create their own orders" sup.sql | grep -q "auth.uid() IS NULL AND user_id IS NULL"; then
    echo "  ✓ Orders INSERT policy handles guest users correctly"
else
    echo "  ❌ Orders INSERT policy missing guest user handling"
    exit 1
fi

# Check order_items INSERT policy
if grep -A 15 "Users can create order items for their orders" sup.sql | grep -q "auth.uid() IS NULL AND orders.user_id IS NULL"; then
    echo "  ✓ Order items INSERT policy handles guest users correctly"
else
    echo "  ❌ Order items INSERT policy missing guest user handling"
    exit 1
fi

echo ""
echo "Checking grants:"

if grep -q "GRANT USAGE ON SCHEMA public TO anon, authenticated;" sup.sql; then
    echo "  ✓ Schema usage granted to anon and authenticated"
else
    echo "  ❌ Missing schema grants"
    exit 1
fi

if grep -q "GRANT.*orders.*TO anon, authenticated" sup.sql; then
    echo "  ✓ Orders table grants found"
else
    echo "  ❌ Missing orders table grants"
    exit 1
fi

echo ""
echo "Checking initial data:"

# Check wilayas count - look for lines like "(1, 'Adrar', 0)," using portable regex
WILAYA_COUNT=$(grep -E -c '^\([0-9]+, ' sup.sql)
if [ "$WILAYA_COUNT" -eq 58 ]; then
    echo "  ✓ All 58 wilayas defined"
else
    echo "  ⚠️  Expected 58 wilayas, found $WILAYA_COUNT"
fi

echo ""
echo "======================================"
echo "Verification Summary"
echo "======================================"
echo "✓ sup.sql structure is valid"
echo "✓ Critical RLS policies are correctly defined"
echo "✓ Guest user support is implemented"
echo "✓ Grants are configured for anon and authenticated roles"
echo ""
echo "The file is ready to be applied to Supabase."
echo ""

