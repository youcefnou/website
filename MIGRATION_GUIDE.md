# Migration Guide for FAQ and About Pages

This document explains how to apply the database migration to add FAQ and About page management functionality.

## Overview

This migration adds a `pages` table to store content for static pages (FAQ and About) that can be managed from the admin panel.

## Running the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy the contents of `migrations/add_pages_table.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### Option 2: Using psql Command Line

If you have direct database access:

```bash
psql -h your-db-host -U your-username -d your-database -f migrations/add_pages_table.sql
```

### Option 3: Using Supabase CLI

If you're using Supabase CLI:

```bash
supabase db push migrations/add_pages_table.sql
```

## What This Migration Does

1. **Creates the `pages` table** with the following columns:
   - `id` (TEXT, primary key) - Page identifier (e.g., 'faq', 'about')
   - `title` (TEXT) - Page title
   - `content` (TEXT) - Page content in Markdown format
   - `meta_description` (TEXT, nullable) - SEO meta description
   - `is_published` (BOOLEAN) - Whether the page is visible to users
   - `created_at` (TIMESTAMPTZ) - Creation timestamp
   - `updated_at` (TIMESTAMPTZ) - Last update timestamp

2. **Inserts default content** for two pages:
   - FAQ page (id: 'faq')
   - About page (id: 'about')

3. **Creates a trigger** to automatically update the `updated_at` timestamp when a page is modified

## Verification

After running the migration, verify it was successful:

```sql
-- Check that the pages table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pages'
ORDER BY ordinal_position;

-- View the default pages
SELECT id, title, is_published, created_at
FROM pages;
```

You should see two rows: one for 'faq' and one for 'about'.

## Using the New Feature

### Admin Panel

1. Log in to the admin panel
2. Navigate to **Settings** → **Gestion des pages**
3. Click on a page (FAQ or About) to edit its content
4. Update the title, content, and meta description as needed
5. Click "Enregistrer" to save changes

### Public Pages

Once the migration is complete:
- FAQ page will be accessible at `/faq`
- About page will be accessible at `/about`
- Footer links will no longer result in 404 errors

## Rollback

If you need to rollback this migration:

```sql
-- Remove the trigger
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;

-- Remove the pages table
DROP TABLE IF EXISTS pages;
```

**Note:** This will delete all page content. Only rollback if necessary.

## Troubleshooting

### Error: "relation already exists"

If you see this error, the migration has already been run. The migration is idempotent and safe to run multiple times.

### Error: "permission denied"

Make sure you're using a database user with sufficient privileges to create tables and triggers.

### Pages not showing up

1. Verify the migration ran successfully
2. Check that pages have `is_published` set to `true`
3. Clear your Next.js cache: `rm -rf .next`
4. Restart your development server

## Support

If you encounter any issues, please check the migration file comments for more details or contact the development team.
