/**
 * Database types generated from Supabase schema
 * These types should be regenerated when the database schema changes
 * Run: npx supabase gen types typescript --project-id <project-id> > db/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string | null;
          name: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone?: string | null;
          name: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string | null;
          name?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admins: {
        Row: {
          user_id: string;
          role: 'user' | 'admin';
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: 'user' | 'admin';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'user' | 'admin';
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          has_variants: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          has_variants?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          has_variants?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sellable_items: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          description: string | null;
          price: number;
          stock: number;
          image_url: string | null;
          sku: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          description?: string | null;
          price: number;
          stock?: number;
          image_url?: string | null;
          sku: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          description?: string | null;
          price?: number;
          stock?: number;
          image_url?: string | null;
          sku?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          sellable_item_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          sellable_item_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          sellable_item_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          full_name: string;
          phone: string;
          wilaya_id: number;
          commune: string;
          address: string;
          status: 'pending' | 'confirmed' | 'delivered' | 'canceled';
          delivery_price: number;
          subtotal: number;
          total: number;
          cod_only: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          full_name: string;
          phone: string;
          wilaya_id: number;
          commune: string;
          address: string;
          status?: 'pending' | 'confirmed' | 'delivered' | 'canceled';
          delivery_price: number;
          subtotal: number;
          total: number;
          cod_only?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          full_name?: string;
          phone?: string;
          wilaya_id?: number;
          commune?: string;
          address?: string;
          status?: 'pending' | 'confirmed' | 'delivered' | 'canceled';
          delivery_price?: number;
          subtotal?: number;
          total?: number;
          cod_only?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          sellable_item_id: string;
          session_id: string | null;
          quantity: number;
          price_at_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          sellable_item_id: string;
          session_id?: string | null;
          quantity: number;
          price_at_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          sellable_item_id?: string;
          session_id?: string | null;
          quantity?: number;
          price_at_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      delivery_wilayas: {
        Row: {
          id: number;
          name: string;
          delivery_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          name: string;
          delivery_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          delivery_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      home_content: {
        Row: {
          id: number;
          hero_title: string | null;
          sub_title: string | null;
          description: string | null;
          cta_text: string | null;
          section_visibility: Json;
          updated_at: string;
        };
        Insert: {
          id?: number;
          hero_title?: string | null;
          sub_title?: string | null;
          description?: string | null;
          cta_text?: string | null;
          section_visibility?: Json;
          updated_at?: string;
        };
        Update: {
          id?: number;
          hero_title?: string | null;
          sub_title?: string | null;
          description?: string | null;
          cta_text?: string | null;
          section_visibility?: Json;
          updated_at?: string;
        };
      };
      store_settings: {
        Row: {
          id: number;
          store_name: string;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          social_links: Json;
          contact_info: Json;
          custom_settings: Json;
          updated_at: string;
        };
        Insert: {
          id?: number;
          store_name?: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          social_links?: Json;
          contact_info?: Json;
          custom_settings?: Json;
          updated_at?: string;
        };
        Update: {
          id?: number;
          store_name?: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          social_links?: Json;
          contact_info?: Json;
          custom_settings?: Json;
          updated_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          event_type:
            | 'page_view'
            | 'product_view'
            | 'add_to_cart'
            | 'cart_abandon'
            | 'checkout_start'
            | 'order_placed'
            | 'order_delivered';
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          event_type:
            | 'page_view'
            | 'product_view'
            | 'add_to_cart'
            | 'cart_abandon'
            | 'checkout_start'
            | 'order_placed'
            | 'order_delivered';
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          event_type?:
            | 'page_view'
            | 'product_view'
            | 'add_to_cart'
            | 'cart_abandon'
            | 'checkout_start'
            | 'order_placed'
            | 'order_delivered';
          metadata?: Json;
          created_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          title: string;
          content: string;
          meta_description: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          content: string;
          meta_description?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          meta_description?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      best_selling_products: {
        Row: {
          sellable_item_id: string;
          product_id: string;
          product_name: string;
          sku: string;
          description: string | null;
          order_count: number;
          total_quantity_sold: number;
          total_revenue: number;
        };
      };
      revenue_per_product: {
        Row: {
          product_id: string;
          product_name: string;
          category_id: string | null;
          category_name: string | null;
          order_items_count: number;
          total_quantity_sold: number;
          total_revenue: number;
        };
      };
      revenue_per_category: {
        Row: {
          category_id: string;
          category_name: string;
          order_items_count: number;
          total_quantity_sold: number;
          total_revenue: number;
        };
      };
      orders_per_wilaya: {
        Row: {
          wilaya_id: number;
          wilaya_name: string;
          total_orders: number;
          pending_orders: number;
          confirmed_orders: number;
          delivered_orders: number;
          canceled_orders: number;
          total_revenue: number;
          average_order_value: number;
        };
      };
      funnel_view: {
        Row: {
          unique_page_views: number;
          unique_cart_additions: number;
          unique_checkout_starts: number;
          unique_orders_placed: number;
          total_page_views: number;
          total_cart_additions: number;
          total_checkout_starts: number;
          total_orders_placed: number;
        };
      };
      delivery_performance: {
        Row: {
          pending_orders: number;
          confirmed_orders: number;
          delivered_orders: number;
          canceled_orders: number;
          total_orders: number;
          delivery_rate_percentage: number;
          avg_delivery_time_days: number;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      order_status: 'pending' | 'confirmed' | 'delivered' | 'canceled';
      role: 'user' | 'admin';
      analytics_event_type:
        | 'page_view'
        | 'product_view'
        | 'add_to_cart'
        | 'cart_abandon'
        | 'checkout_start'
        | 'order_placed'
        | 'order_delivered';
    };
  };
}
