DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'delivered', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE role AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE analytics_event_type AS ENUM ('page_view', 'product_view', 'add_to_cart', 'cart_abandon', 'checkout_start', 'order_placed', 'order_delivered'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE CHECK (phone ~ '^\+?[0-9]{10,15}$'),
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT CHECK (image_url IS NULL OR image_url ~ '^https?://'),
  display_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  has_variants BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sellable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0 AND price <= 999999.99),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT CHECK (image_url IS NULL OR image_url ~ '^https?://'),
  sku TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_wilayas (
  id INT PRIMARY KEY CHECK (id >= 1 AND id <= 58),
  name TEXT NOT NULL,
  delivery_price NUMERIC(12, 2) NOT NULL CHECK (delivery_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL),
  CONSTRAINT unique_user_cart UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  sellable_item_id UUID NOT NULL REFERENCES sellable_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, sellable_item_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL CHECK (phone ~ '^\+?[0-9]{10,15}$'),
  wilaya_id INT NOT NULL REFERENCES delivery_wilayas(id),
  commune TEXT NOT NULL,
  address TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  delivery_price NUMERIC(12, 2) NOT NULL CHECK (delivery_price >= 0 AND delivery_price <= 99999.99),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0 AND subtotal <= 9999999.99),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0 AND total <= 9999999.99),
  cod_only BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sellable_item_id UUID NOT NULL REFERENCES sellable_items(id) ON DELETE RESTRICT,
  session_id TEXT,
  product_name TEXT NOT NULL,
  sub_product_name TEXT,
  phone_model TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  price_at_order NUMERIC(12, 2) NOT NULL CHECK (price_at_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS home_content (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_title TEXT,
  sub_title TEXT,
  description TEXT,
  cta_text TEXT,
  section_visibility JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT 'My Store',
  logo_url TEXT CHECK (logo_url IS NULL OR logo_url ~ '^https?://'),
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#666666',
  accent_color TEXT DEFAULT '#0066cc',
  footer_tagline TEXT DEFAULT 'Votre destination pour les meilleurs accessoires de téléphone en Algérie',
  social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "tiktok": ""}'::jsonb,
  contact_info JSONB DEFAULT '{"phone": "", "email": "", "address": ""}'::jsonb,
  custom_settings JSONB DEFAULT '{
    "carousel_slides": [
      {
        "id": 1,
        "title": "Protégez votre téléphone avec style",
        "subtitle": "Découvrez notre collection de coques premium",
        "cta_text": "Acheter maintenant",
        "cta_link": "/products",
        "bg_color": "from-blue-600 to-purple-600",
        "image_url": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1200",
        "enabled": true,
        "order": 1
      },
      {
        "id": 2,
        "title": "Accessoires de qualité supérieure",
        "subtitle": "Chargeurs, câbles, écouteurs et plus",
        "cta_text": "Découvrir",
        "cta_link": "/products",
        "bg_color": "from-green-600 to-teal-600",
        "image_url": "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200",
        "enabled": true,
        "order": 2
      },
      {
        "id": 3,
        "title": "Livraison rapide partout en Algérie",
        "subtitle": "Commandez aujourd''hui, recevez demain",
        "cta_text": "Voir les produits",
        "cta_link": "/products",
        "bg_color": "from-orange-600 to-red-600",
        "image_url": "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200",
        "enabled": true,
        "order": 3
      }
    ],
    "carousel_settings": {
      "auto_play": true,
      "interval": 5000,
      "show_arrows": true,
      "show_dots": true
    },
    "category_cards": []
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type analytics_event_type NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sellable_item_id UUID NOT NULL REFERENCES sellable_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sellable_item_id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_sellable_items_product_id ON sellable_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sellable_items_variant_id ON sellable_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_sellable_item_id ON cart_items(sellable_item_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_wilaya_id ON orders(wilaya_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sellable_item_id ON order_items(sellable_item_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type_created_at ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_created_at ON analytics_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id_created_at ON analytics_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_updated_at ON cart_items(updated_at);
CREATE INDEX IF NOT EXISTS idx_sellable_items_stock ON sellable_items(stock);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_sellable_item_id ON wishlists(sellable_item_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_is_published ON pages(is_published) WHERE is_published = true;

CREATE OR REPLACE VIEW best_selling_products AS
SELECT
  si.id AS sellable_item_id,
  p.id AS product_id,
  p.name AS product_name,
  si.sku,
  si.description,
  COUNT(oi.id) AS order_count,
  SUM(oi.quantity) AS total_quantity_sold,
  SUM(oi.quantity * oi.price_at_order) AS total_revenue
FROM sellable_items si
JOIN products p ON si.product_id = p.id
LEFT JOIN order_items oi ON si.id = oi.sellable_item_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('confirmed', 'delivered')
GROUP BY si.id, p.id, p.name, si.sku, si.description
ORDER BY total_quantity_sold DESC NULLS LAST;

CREATE OR REPLACE VIEW revenue_per_product AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  c.id AS category_id,
  c.name AS category_name,
  COUNT(DISTINCT oi.id) AS order_items_count,
  SUM(oi.quantity) AS total_quantity_sold,
  SUM(oi.quantity * oi.price_at_order) AS total_revenue
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN sellable_items si ON p.id = si.product_id
LEFT JOIN order_items oi ON si.id = oi.sellable_item_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('confirmed', 'delivered')
GROUP BY p.id, p.name, c.id, c.name
ORDER BY total_revenue DESC NULLS LAST;

CREATE OR REPLACE VIEW revenue_per_category AS
SELECT
  c.id AS category_id,
  c.name AS category_name,
  COUNT(DISTINCT oi.id) AS order_items_count,
  SUM(oi.quantity) AS total_quantity_sold,
  SUM(oi.quantity * oi.price_at_order) AS total_revenue
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN sellable_items si ON p.id = si.product_id
LEFT JOIN order_items oi ON si.id = oi.sellable_item_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('confirmed', 'delivered')
GROUP BY c.id, c.name
ORDER BY total_revenue DESC NULLS LAST;

CREATE OR REPLACE VIEW orders_per_wilaya AS
SELECT
  dw.id AS wilaya_id,
  dw.name AS wilaya_name,
  COUNT(o.id) AS total_orders,
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
  COUNT(CASE WHEN o.status = 'confirmed' THEN 1 END) AS confirmed_orders,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS delivered_orders,
  COUNT(CASE WHEN o.status = 'canceled' THEN 1 END) AS canceled_orders,
  SUM(o.total) AS total_revenue,
  AVG(o.total) AS average_order_value
FROM delivery_wilayas dw
LEFT JOIN orders o ON dw.id = o.wilaya_id
GROUP BY dw.id, dw.name
ORDER BY total_orders DESC NULLS LAST;

CREATE OR REPLACE VIEW funnel_view AS
SELECT
  COUNT(DISTINCT CASE WHEN ae.event_type = 'page_view' THEN COALESCE(ae.user_id::TEXT, ae.session_id) END) AS unique_page_views,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'add_to_cart' THEN COALESCE(ae.user_id::TEXT, ae.session_id) END) AS unique_cart_additions,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'checkout_start' THEN COALESCE(ae.user_id::TEXT, ae.session_id) END) AS unique_checkout_starts,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'order_placed' THEN COALESCE(ae.user_id::TEXT, ae.session_id) END) AS unique_orders_placed,
  COUNT(CASE WHEN ae.event_type = 'page_view' THEN 1 END) AS total_page_views,
  COUNT(CASE WHEN ae.event_type = 'add_to_cart' THEN 1 END) AS total_cart_additions,
  COUNT(CASE WHEN ae.event_type = 'checkout_start' THEN 1 END) AS total_checkout_starts,
  COUNT(CASE WHEN ae.event_type = 'order_placed' THEN 1 END) AS total_orders_placed
FROM analytics_events ae;

CREATE OR REPLACE VIEW delivery_performance AS
SELECT
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
  COUNT(CASE WHEN o.status = 'confirmed' THEN 1 END) AS confirmed_orders,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS delivered_orders,
  COUNT(CASE WHEN o.status = 'canceled' THEN 1 END) AS canceled_orders,
  COUNT(*) AS total_orders,
  ROUND(100.0 * COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) / NULLIF(COUNT(*), 0), 2) AS delivery_rate_percentage,
  ROUND(AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 86400.0) FILTER (WHERE o.status = 'delivered'), 2) AS avg_delivery_time_days
FROM orders o;

CREATE OR REPLACE VIEW daily_revenue_trends AS
SELECT
  DATE(o.created_at) AS date,
  COUNT(o.id) AS order_count,
  COUNT(DISTINCT o.user_id) AS unique_customers,
  SUM(o.total) AS total_revenue,
  SUM(o.subtotal) AS subtotal_revenue,
  SUM(o.delivery_price) AS delivery_revenue,
  AVG(o.total) AS average_order_value,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS delivered_orders,
  COUNT(CASE WHEN o.status = 'canceled' THEN 1 END) AS canceled_orders
FROM orders o
WHERE o.status IN ('confirmed', 'delivered')
GROUP BY DATE(o.created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW weekly_revenue_trends AS
SELECT
  DATE_TRUNC('week', o.created_at) AS week_start,
  COUNT(o.id) AS order_count,
  COUNT(DISTINCT o.user_id) AS unique_customers,
  SUM(o.total) AS total_revenue,
  SUM(o.subtotal) AS subtotal_revenue,
  SUM(o.delivery_price) AS delivery_revenue,
  AVG(o.total) AS average_order_value,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS delivered_orders,
  COUNT(CASE WHEN o.status = 'canceled' THEN 1 END) AS canceled_orders
FROM orders o
WHERE o.status IN ('confirmed', 'delivered')
GROUP BY DATE_TRUNC('week', o.created_at)
ORDER BY week_start DESC;

CREATE OR REPLACE VIEW monthly_revenue_trends AS
SELECT
  DATE_TRUNC('month', o.created_at) AS month_start,
  COUNT(o.id) AS order_count,
  COUNT(DISTINCT o.user_id) AS unique_customers,
  SUM(o.total) AS total_revenue,
  SUM(o.subtotal) AS subtotal_revenue,
  SUM(o.delivery_price) AS delivery_revenue,
  AVG(o.total) AS average_order_value,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS delivered_orders,
  COUNT(CASE WHEN o.status = 'canceled' THEN 1 END) AS canceled_orders
FROM orders o
WHERE o.status IN ('confirmed', 'delivered')
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY month_start DESC;

CREATE OR REPLACE VIEW abandoned_carts AS
SELECT
  c.id AS cart_id,
  c.user_id,
  c.session_id,
  c.created_at AS cart_created_at,
  c.updated_at AS cart_updated_at,
  EXTRACT(EPOCH FROM (NOW() - c.updated_at)) / 3600 AS hours_since_update,
  COUNT(ci.id) AS item_count,
  SUM(ci.quantity) AS total_quantity,
  SUM(ci.quantity * si.price) AS cart_value
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
LEFT JOIN sellable_items si ON ci.sellable_item_id = si.id
WHERE 
  NOT EXISTS (
    SELECT 1 FROM orders o 
    WHERE (c.user_id IS NOT NULL AND o.user_id = c.user_id)
       OR (c.session_id IS NOT NULL AND o.user_id IS NULL)
  )
  AND EXISTS (SELECT 1 FROM cart_items WHERE cart_id = c.id)
  AND c.updated_at < NOW() - INTERVAL '24 hours'
GROUP BY c.id, c.user_id, c.session_id, c.created_at, c.updated_at
ORDER BY cart_value DESC;

CREATE OR REPLACE VIEW product_conversion_rates AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  c.id AS category_id,
  c.name AS category_name,
  COUNT(DISTINCT CASE 
    WHEN ae.event_type = 'product_view' 
    THEN COALESCE(ae.user_id::TEXT, ae.session_id) 
  END) AS product_views,
  COUNT(DISTINCT CASE 
    WHEN ae.event_type = 'add_to_cart' 
    THEN COALESCE(ae.user_id::TEXT, ae.session_id) 
  END) AS add_to_cart_count,
  COUNT(DISTINCT oi.order_id) AS order_count,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN ae.event_type = 'add_to_cart' THEN COALESCE(ae.user_id::TEXT, ae.session_id) END) / 
    NULLIF(COUNT(DISTINCT CASE WHEN ae.event_type = 'product_view' THEN COALESCE(ae.user_id::TEXT, ae.session_id) END), 0),
    2
  ) AS view_to_cart_rate,
  ROUND(
    100.0 * COUNT(DISTINCT oi.order_id) / 
    NULLIF(COUNT(DISTINCT CASE WHEN ae.event_type = 'product_view' THEN COALESCE(ae.user_id::TEXT, ae.session_id) END), 0),
    2
  ) AS view_to_order_rate
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN sellable_items si ON p.id = si.product_id
LEFT JOIN analytics_events ae ON 
  ae.event_type IN ('product_view', 'add_to_cart') AND
  (ae.metadata->>'product_id')::UUID = p.id
LEFT JOIN order_items oi ON si.id = oi.sellable_item_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('confirmed', 'delivered')
GROUP BY p.id, p.name, c.id, c.name
ORDER BY product_views DESC;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sellable_items_updated_at ON sellable_items;
CREATE TRIGGER update_sellable_items_updated_at BEFORE UPDATE ON sellable_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carts_updated_at ON carts;
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_wilayas_updated_at ON delivery_wilayas;
CREATE TRIGGER update_delivery_wilayas_updated_at BEFORE UPDATE ON delivery_wilayas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_home_content_updated_at ON home_content;
CREATE TRIGGER update_home_content_updated_at BEFORE UPDATE ON home_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION validate_variant_belongs_to_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if variant_id is not NULL
  IF NEW.variant_id IS NOT NULL THEN
    -- Verify the variant belongs to the product
    IF NOT EXISTS (
      SELECT 1 FROM product_variants pv
      WHERE pv.id = NEW.variant_id 
        AND pv.product_id = NEW.product_id
    ) THEN
      RAISE EXCEPTION 'Variant % does not belong to product %', NEW.variant_id, NEW.product_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_variant_product ON sellable_items;
CREATE TRIGGER trigger_validate_variant_product
  BEFORE INSERT OR UPDATE ON sellable_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_variant_belongs_to_product();

CREATE OR REPLACE FUNCTION decrement_stock_on_order_confirm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE sellable_items si
    SET stock = si.stock - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND si.id = oi.sellable_item_id;
    
    IF EXISTS (
      SELECT 1
      FROM order_items oi
      JOIN sellable_items si ON oi.sellable_item_id = si.id
      WHERE oi.order_id = NEW.id
        AND si.stock < 0
    ) THEN
      RAISE EXCEPTION 'Insufficient stock for one or more items in order %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_stock_on_confirm ON orders;
CREATE TRIGGER trigger_decrement_stock_on_confirm
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
  EXECUTE FUNCTION decrement_stock_on_order_confirm();

CREATE OR REPLACE FUNCTION restore_stock_on_order_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'canceled' AND OLD.status = 'confirmed' THEN
    UPDATE sellable_items si
    SET stock = si.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND si.id = oi.sellable_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_cancel ON orders;
CREATE TRIGGER trigger_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'canceled' AND OLD.status = 'confirmed')
  EXECUTE FUNCTION restore_stock_on_order_cancel();

CREATE OR REPLACE FUNCTION restore_stock_on_order_unconfirm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND OLD.status = 'confirmed' THEN
    UPDATE sellable_items si
    SET stock = si.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND si.id = oi.sellable_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_unconfirm ON orders;
CREATE TRIGGER trigger_restore_stock_on_unconfirm
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'pending' AND OLD.status = 'confirmed')
  EXECUTE FUNCTION restore_stock_on_order_unconfirm();

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_order_status_change();

CREATE OR REPLACE FUNCTION calculate_cart_total(p_cart_id UUID)
RETURNS TABLE(
  subtotal NUMERIC(12, 2),
  delivery_price NUMERIC(12, 2),
  total NUMERIC(12, 2),
  item_count BIGINT
) AS $$
DECLARE
  v_subtotal NUMERIC(12, 2);
  v_item_count BIGINT;
BEGIN
  SELECT 
    COALESCE(SUM(ci.quantity * si.price), 0),
    COALESCE(COUNT(ci.id), 0)
  INTO v_subtotal, v_item_count
  FROM cart_items ci
  JOIN sellable_items si ON ci.sellable_item_id = si.id
  WHERE ci.cart_id = p_cart_id;
  
  RETURN QUERY SELECT 
    v_subtotal,
    0::NUMERIC(12, 2) AS delivery_price,
    v_subtotal AS total,
    v_item_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to merge anonymous cart to user cart on login
CREATE OR REPLACE FUNCTION merge_anonymous_cart(p_session_id TEXT, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_session_cart_id UUID;
  v_user_cart_id UUID;
  v_cart_item RECORD;
BEGIN
  -- Get the session cart
  SELECT id INTO v_session_cart_id
  FROM carts
  WHERE session_id = p_session_id AND user_id IS NULL;
  
  -- If no session cart, nothing to merge
  IF v_session_cart_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get or create user cart
  SELECT id INTO v_user_cart_id
  FROM carts
  WHERE user_id = p_user_id;
  
  IF v_user_cart_id IS NULL THEN
    -- Create a new cart for the user
    INSERT INTO carts (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_user_cart_id;
  END IF;
  
  -- Merge cart items from session cart to user cart
  FOR v_cart_item IN 
    SELECT sellable_item_id, quantity 
    FROM cart_items 
    WHERE cart_id = v_session_cart_id
  LOOP
    -- Insert or update cart items
    INSERT INTO cart_items (cart_id, sellable_item_id, quantity)
    VALUES (v_user_cart_id, v_cart_item.sellable_item_id, v_cart_item.quantity)
    ON CONFLICT (cart_id, sellable_item_id) 
    DO UPDATE SET 
      quantity = cart_items.quantity + EXCLUDED.quantity,
      updated_at = NOW();
  END LOOP;
  
  -- Delete the session cart
  DELETE FROM carts WHERE id = v_session_cart_id;
  
  RETURN v_user_cart_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check stock availability for a cart
CREATE OR REPLACE FUNCTION check_stock_availability(p_cart_id UUID)
RETURNS TABLE(
  all_available BOOLEAN,
  unavailable_items JSONB
) AS $$
DECLARE
  v_all_available BOOLEAN := TRUE;
  v_unavailable JSONB := '[]'::JSONB;
BEGIN
  -- Check each item in the cart
  SELECT 
    BOOL_AND(si.stock >= ci.quantity),
    COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'sellable_item_id', ci.sellable_item_id,
          'product_name', p.name,
          'requested_quantity', ci.quantity,
          'available_stock', si.stock
        )
      ) FILTER (WHERE si.stock < ci.quantity),
      '[]'::JSONB
    )
  INTO v_all_available, v_unavailable
  FROM cart_items ci
  JOIN sellable_items si ON ci.sellable_item_id = si.id
  JOIN products p ON si.product_id = p.id
  WHERE ci.cart_id = p_cart_id;
  
  RETURN QUERY SELECT 
    COALESCE(v_all_available, TRUE),
    v_unavailable;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check stock before order confirmation
CREATE OR REPLACE FUNCTION validate_stock_before_confirm(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_insufficient_stock BOOLEAN;
BEGIN
  -- Check if any item in the order has insufficient stock
  SELECT EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN sellable_items si ON oi.sellable_item_id = si.id
    WHERE oi.order_id = p_order_id
      AND si.stock < oi.quantity
  ) INTO v_has_insufficient_stock;
  
  IF v_has_insufficient_stock THEN
    RAISE EXCEPTION 'Insufficient stock for one or more items in order %', p_order_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get complete order summary
CREATE OR REPLACE FUNCTION get_order_summary(p_order_id UUID)
RETURNS TABLE(
  order_id UUID,
  order_status order_status,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_wilaya TEXT,
  delivery_commune TEXT,
  delivery_address TEXT,
  subtotal NUMERIC(12, 2),
  delivery_price NUMERIC(12, 2),
  total NUMERIC(12, 2),
  order_date TIMESTAMPTZ,
  items JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.status,
    o.full_name,
    o.phone,
    dw.name,
    o.commune,
    o.address,
    o.subtotal,
    o.delivery_price,
    o.total,
    o.created_at,
    COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'sellable_item_id', oi.sellable_item_id,
          'product_name', p.name,
          'variant_name', pv.name,
          'description', si.description,
          'quantity', oi.quantity,
          'price_at_order', oi.price_at_order,
          'line_total', oi.quantity * oi.price_at_order
        ) ORDER BY oi.created_at
      ),
      '[]'::JSONB
    ) AS items
  FROM orders o
  JOIN delivery_wilayas dw ON o.wilaya_id = dw.id
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN sellable_items si ON oi.sellable_item_id = si.id
  LEFT JOIN products p ON si.product_id = p.id
  LEFT JOIN product_variants pv ON si.variant_id = pv.id
  WHERE o.id = p_order_id
  GROUP BY o.id, o.status, o.full_name, o.phone, dw.name, o.commune, 
           o.address, o.subtotal, o.delivery_price, o.total, o.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_wilayas ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON product_variants;
CREATE POLICY "Product variants are viewable by everyone"
  ON product_variants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sellable items are viewable by everyone" ON sellable_items;
CREATE POLICY "Sellable items are viewable by everyone"
  ON sellable_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Delivery wilayas are viewable by everyone" ON delivery_wilayas;
CREATE POLICY "Delivery wilayas are viewable by everyone"
  ON delivery_wilayas FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Home content is viewable by everyone" ON home_content;
CREATE POLICY "Home content is viewable by everyone"
  ON home_content FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Store settings are viewable by everyone" ON store_settings;
CREATE POLICY "Store settings are viewable by everyone"
  ON store_settings FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION validate_session_ownership(cart_session_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN cart_session_id IS NOT NULL AND LENGTH(cart_session_id) >= 32;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can view their own carts" ON carts;
CREATE POLICY "Users can view their own carts"
  ON carts FOR SELECT
  USING (
    auth.uid() = user_id OR
    (session_id IS NOT NULL AND validate_session_ownership(session_id))
  );

DROP POLICY IF EXISTS "Users can create their own carts" ON carts;
CREATE POLICY "Users can create their own carts"
  ON carts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (session_id IS NOT NULL AND validate_session_ownership(session_id))
  );

DROP POLICY IF EXISTS "Users can update their own carts" ON carts;
CREATE POLICY "Users can update their own carts"
  ON carts FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (session_id IS NOT NULL AND validate_session_ownership(session_id))
  );

DROP POLICY IF EXISTS "Users can delete their own carts" ON carts;
CREATE POLICY "Users can delete their own carts"
  ON carts FOR DELETE
  USING (
    auth.uid() = user_id OR
    (session_id IS NOT NULL AND validate_session_ownership(session_id))
  );

DROP POLICY IF EXISTS "Users can view their cart items" ON cart_items;
CREATE POLICY "Users can view their cart items"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND (carts.user_id = auth.uid() OR 
             (carts.session_id IS NOT NULL AND validate_session_ownership(carts.session_id)))
    )
  );

DROP POLICY IF EXISTS "Users can insert cart items" ON cart_items;
CREATE POLICY "Users can insert cart items"
  ON cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND (carts.user_id = auth.uid() OR 
             (carts.session_id IS NOT NULL AND validate_session_ownership(carts.session_id)))
    )
  );

DROP POLICY IF EXISTS "Users can update their cart items" ON cart_items;
CREATE POLICY "Users can update their cart items"
  ON cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND (carts.user_id = auth.uid() OR 
             (carts.session_id IS NOT NULL AND validate_session_ownership(carts.session_id)))
    )
  );

DROP POLICY IF EXISTS "Users can delete their cart items" ON cart_items;
CREATE POLICY "Users can delete their cart items"
  ON cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND (carts.user_id = auth.uid() OR 
             (carts.session_id IS NOT NULL AND validate_session_ownership(carts.session_id)))
    )
  );

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          orders.user_id = auth.uid()
          OR
          (auth.uid() IS NULL AND orders.user_id IS NULL)
        )
    )
  );

DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
          OR
          (auth.uid() IS NULL AND orders.user_id IS NULL)
        )
    )
  );

DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own analytics events" ON analytics_events;
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;
CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Only admins can view admins table" ON admins;
CREATE POLICY "Only admins can view admins table"
  ON admins FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert new admins" ON admins;
CREATE POLICY "Admins can insert new admins"
  ON admins FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update admins" ON admins;
CREATE POLICY "Admins can update admins"
  ON admins FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete admins" ON admins;
CREATE POLICY "Admins can delete admins"
  ON admins FOR DELETE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
CREATE POLICY "Admins can manage product variants"
  ON product_variants FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage sellable items" ON sellable_items;
CREATE POLICY "Admins can manage sellable items"
  ON sellable_items FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage delivery wilayas" ON delivery_wilayas;
CREATE POLICY "Admins can manage delivery wilayas"
  ON delivery_wilayas FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage home content" ON home_content;
CREATE POLICY "Admins can manage home content"
  ON home_content FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage store settings" ON store_settings;
CREATE POLICY "Admins can manage store settings"
  ON store_settings FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Anyone can view product reviews" ON product_reviews;
CREATE POLICY "Anyone can view product reviews"
  ON product_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own reviews" ON product_reviews;
CREATE POLICY "Users can create their own reviews"
  ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;
CREATE POLICY "Users can update their own reviews"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON product_reviews;
CREATE POLICY "Users can delete their own reviews"
  ON product_reviews FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;
CREATE POLICY "Admins can manage all reviews"
  ON product_reviews FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view their own wishlist" ON wishlists;
CREATE POLICY "Users can view their own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to their wishlist" ON wishlists;
CREATE POLICY "Users can add to their wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from their wishlist" ON wishlists;
CREATE POLICY "Users can delete from their wishlist"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all wishlists" ON wishlists;
CREATE POLICY "Admins can view all wishlists"
  ON wishlists FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view their order status history" ON order_status_history;
CREATE POLICY "Users can view their order status history"
  ON order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
        AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all order status history" ON order_status_history;
CREATE POLICY "Admins can view all order status history"
  ON order_status_history FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert order status history" ON order_status_history;
CREATE POLICY "Admins can insert order status history"
  ON order_status_history FOR INSERT
  WITH CHECK (
    exists (
      select 1
      from admins
      where admins.user_id = auth.uid()
    )
    AND changed_by = auth.uid()
  );

DROP POLICY IF EXISTS "Anyone can view published pages" ON pages;
CREATE POLICY "Anyone can view published pages"
  ON pages FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can view all pages" ON pages;
CREATE POLICY "Admins can view all pages"
  ON pages FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage pages" ON pages;
CREATE POLICY "Admins can manage pages"
  ON pages FOR ALL
  USING (is_admin());

INSERT INTO home_content (id, hero_title, sub_title, description, cta_text, section_visibility)
VALUES (
  1,
  'Welcome to Our Store',
  'Quality Products at Great Prices',
  'Discover our curated collection of premium products',
  'Shop Now',
  '{"featured": true, "categories": true, "bestsellers": true}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO store_settings (id, store_name, logo_url, primary_color, secondary_color, accent_color)
VALUES (
  1,
  'My Store',
  NULL,
  '#000000',
  '#666666',
  '#0066cc'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_wilayas (id, name, delivery_price) VALUES
(1, 'Adrar', 0),
(2, 'Chlef', 0),
(3, 'Laghouat', 0),
(4, 'Oum El Bouaghi', 0),
(5, 'Batna', 0),
(6, 'Béjaïa', 0),
(7, 'Biskra', 0),
(8, 'Béchar', 0),
(9, 'Blida', 0),
(10, 'Bouira', 0),
(11, 'Tamanrasset', 0),
(12, 'Tébessa', 0),
(13, 'Tlemcen', 0),
(14, 'Tiaret', 0),
(15, 'Tizi Ouzou', 0),
(16, 'Alger', 0),
(17, 'Djelfa', 0),
(18, 'Jijel', 0),
(19, 'Sétif', 0),
(20, 'Saïda', 0),
(21, 'Skikda', 0),
(22, 'Sidi Bel Abbès', 0),
(23, 'Annaba', 0),
(24, 'Guelma', 0),
(25, 'Constantine', 0),
(26, 'Médéa', 0),
(27, 'Mostaganem', 0),
(28, 'M''Sila', 0),
(29, 'Mascara', 0),
(30, 'Ouargla', 0),
(31, 'Oran', 0),
(32, 'El Bayadh', 0),
(33, 'Illizi', 0),
(34, 'Bordj Bou Arréridj', 0),
(35, 'Boumerdès', 0),
(36, 'El Tarf', 0),
(37, 'Tindouf', 0),
(38, 'Tissemsilt', 0),
(39, 'El Oued', 0),
(40, 'Khenchela', 0),
(41, 'Souk Ahras', 0),
(42, 'Tipaza', 0),
(43, 'Mila', 0),
(44, 'Aïn Defla', 0),
(45, 'Naâma', 0),
(46, 'Aïn Témouchent', 0),
(47, 'Ghardaïa', 0),
(48, 'Relizane', 0),
(49, 'Timimoun', 0),
(50, 'Bordj Badji Mokhtar', 0),
(51, 'Ouled Djellal', 0),
(52, 'Béni Abbès', 0),
(53, 'In Salah', 0),
(54, 'In Guezzam', 0),
(55, 'Touggourt', 0),
(56, 'Djanet', 0),
(57, 'El M''Ghair', 0),
(58, 'El Meniaa', 0)
ON CONFLICT (id) DO NOTHING;

-- Insert default pages content
INSERT INTO pages (id, title, content, meta_description, is_published)
VALUES (
  'faq',
  'Questions Fréquemment Posées',
  '## Comment puis-je passer une commande ?

Vous pouvez parcourir notre catalogue de produits, ajouter les articles souhaités à votre panier et procéder au paiement.

## Quels sont les délais de livraison ?

Les délais de livraison varient en fonction de votre wilaya. Généralement, la livraison prend entre 2 et 5 jours ouvrables.

## Quels sont les modes de paiement acceptés ?

Nous acceptons le paiement à la livraison dans toutes les wilayas d''Algérie.

## Comment puis-je suivre ma commande ?

Vous pouvez suivre votre commande depuis votre espace client dans la section "Mes commandes".

## Quelle est votre politique de retour ?

Nous acceptons les retours dans les 7 jours suivant la réception de votre commande, à condition que les produits soient dans leur état d''origine.

## Comment puis-je vous contacter ?

Vous pouvez nous contacter via la page Contact ou directement par téléphone ou email (voir pied de page).',
  'Questions fréquemment posées - Trouvez les réponses à vos questions sur la commande, la livraison et les retours.',
  true
),
(
  'about',
  'À Propos',
  '## Qui sommes-nous ?

Bienvenue sur notre boutique en ligne ! Nous sommes une entreprise algérienne spécialisée dans la vente de produits de qualité.

## Notre Mission

Notre mission est de fournir à nos clients des produits de haute qualité à des prix compétitifs, avec un service client exceptionnel.

## Notre Engagement

Nous nous engageons à :
- Offrir des produits de qualité supérieure
- Assurer une livraison rapide dans toute l''Algérie
- Fournir un service client réactif et professionnel
- Garantir la satisfaction de nos clients

## Contactez-nous

N''hésitez pas à nous contacter pour toute question ou demande d''information. Nous sommes là pour vous aider !',
  'Découvrez qui nous sommes, notre mission et notre engagement envers nos clients.',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('store-logos', 'store-logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Anyone can view category images" ON storage.objects;
CREATE POLICY "Anyone can view category images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "Admins can upload category images" ON storage.objects;
CREATE POLICY "Admins can upload category images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'category-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can update category images" ON storage.objects;
CREATE POLICY "Admins can update category images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'category-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete category images" ON storage.objects;
CREATE POLICY "Admins can delete category images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'category-images' AND is_admin());

DROP POLICY IF EXISTS "Anyone can view store logos" ON storage.objects;
CREATE POLICY "Anyone can view store logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "Admins can upload store logos" ON storage.objects;
CREATE POLICY "Admins can upload store logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-logos' AND is_admin());

DROP POLICY IF EXISTS "Admins can update store logos" ON storage.objects;
CREATE POLICY "Admins can update store logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'store-logos' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete store logos" ON storage.objects;
CREATE POLICY "Admins can delete store logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'store-logos' AND is_admin());
