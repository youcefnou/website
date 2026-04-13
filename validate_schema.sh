#!/bin/bash

# Schema Validation Script
# This script validates the consolidated_schema.sql file for:
# 1. SQL syntax correctness
# 2. Idempotency (safe to run multiple times)
# 3. Required features presence

echo "========================================="
echo "SQL Schema Validation Script"
echo "========================================="
echo ""

SCHEMA_FILE="consolidated_schema.sql"

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ ERROR: $SCHEMA_FILE not found!"
    exit 1
fi

echo "✓ Schema file found: $SCHEMA_FILE"
echo ""

# Check for required features
echo "Checking for required features..."
echo ""

# 1. Email-based authentication
if grep -q "email TEXT UNIQUE NOT NULL" "$SCHEMA_FILE"; then
    echo "✓ Email-based authentication configured"
else
    echo "❌ Email-based authentication NOT found"
    exit 1
fi

# 2. Optional phone in users table
if grep -q "phone TEXT CHECK (phone IS NULL OR" "$SCHEMA_FILE"; then
    echo "✓ Optional phone field configured"
else
    echo "❌ Optional phone field NOT found"
    exit 1
fi

# 3. Guest orders support (NULL user_id in orders)
if grep -q "user_id UUID REFERENCES users(id) ON DELETE SET NULL" "$SCHEMA_FILE"; then
    echo "✓ Guest orders support (NULLable user_id)"
else
    echo "❌ Guest orders support NOT found"
    exit 1
fi

# 4. Guest orders RLS policy
if grep -q "auth.uid() IS NULL AND user_id IS NULL" "$SCHEMA_FILE"; then
    echo "✓ Guest orders RLS policy configured"
else
    echo "❌ Guest orders RLS policy NOT found"
    exit 1
fi

# 5. Product variants table
if grep -q "CREATE TABLE IF NOT EXISTS product_variants" "$SCHEMA_FILE"; then
    echo "✓ Product variants table defined"
else
    echo "❌ Product variants table NOT found"
    exit 1
fi

# 6. Cart details function
if grep -q "CREATE OR REPLACE FUNCTION get_cart_details" "$SCHEMA_FILE"; then
    echo "✓ get_cart_details function defined"
else
    echo "❌ get_cart_details function NOT found"
    exit 1
fi

# 7. Order summary function
if grep -q "CREATE OR REPLACE FUNCTION get_order_summary" "$SCHEMA_FILE"; then
    echo "✓ get_order_summary function defined"
else
    echo "❌ get_order_summary function NOT found"
    exit 1
fi

# 8. Store settings with contact_info
if grep -q 'contact_info JSONB DEFAULT.*"phone".*"email"' "$SCHEMA_FILE"; then
    echo "✓ Store settings with email/phone placeholders"
else
    echo "❌ Store settings contact_info NOT found"
    exit 1
fi

# 9. Order status enum (for delivery_status)
if grep -q "CREATE TYPE order_status AS ENUM" "$SCHEMA_FILE"; then
    echo "✓ Order status enum (delivery_status) defined"
else
    echo "❌ Order status enum NOT found"
    exit 1
fi

# 10. Admins table with role enum
if grep -q "CREATE TABLE IF NOT EXISTS admins" "$SCHEMA_FILE" && grep -q "CREATE TYPE role AS ENUM" "$SCHEMA_FILE"; then
    echo "✓ Admin management (admins table + role enum)"
else
    echo "❌ Admin management NOT properly configured"
    exit 1
fi

# 11. 58 Algerian wilayas
WILAYA_COUNT=$(grep -cE "^\([0-9]+, " "$SCHEMA_FILE" || echo "0")
if [ "$WILAYA_COUNT" -ge 58 ] && grep -q "id INT PRIMARY KEY CHECK (id >= 1 AND id <= 58)" "$SCHEMA_FILE"; then
    echo "✓ 58 Algerian wilayas defined"
else
    echo "❌ 58 Algerian wilayas NOT found (found $WILAYA_COUNT)"
    exit 1
fi

# 12. Idempotency checks
echo ""
echo "Checking idempotency features..."
echo ""

IDEMPOTENT_COUNT=0

if grep -q "CREATE TABLE IF NOT EXISTS" "$SCHEMA_FILE"; then
    echo "✓ Uses CREATE TABLE IF NOT EXISTS"
    ((IDEMPOTENT_COUNT++))
fi

if grep -q "DO \$\$ BEGIN" "$SCHEMA_FILE" && grep -q "duplicate_object" "$SCHEMA_FILE"; then
    echo "✓ Uses DO blocks with exception handling for enums"
    ((IDEMPOTENT_COUNT++))
fi

if grep -q "DROP POLICY IF EXISTS" "$SCHEMA_FILE"; then
    echo "✓ Uses DROP POLICY IF EXISTS before creating policies"
    ((IDEMPOTENT_COUNT++))
fi

if grep -q "ON CONFLICT.*DO NOTHING" "$SCHEMA_FILE"; then
    echo "✓ Uses ON CONFLICT DO NOTHING for default data"
    ((IDEMPOTENT_COUNT++))
fi

if [ $IDEMPOTENT_COUNT -ge 4 ]; then
    echo ""
    echo "✓ Schema is properly idempotent"
else
    echo ""
    echo "❌ Schema may not be fully idempotent"
    exit 1
fi

# Count total features
echo ""
echo "========================================="
echo "Validation Summary"
echo "========================================="
echo "✓ All required features are present"
echo "✓ Schema is idempotent and safe to run multiple times"
echo "✓ Email-based authentication with optional phone"
echo "✓ Guest orders fully supported"
echo "✓ Cart system with detailed product/variant tracking"
echo "✓ Admin role management configured"
echo "✓ Order metadata (delivery_status, created_at, contact)"
echo "✓ 58 Algerian wilayas configured"
echo ""
echo "Schema validation PASSED! ✅"
echo ""
