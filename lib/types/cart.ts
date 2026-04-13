/**
 * Shared type definitions for cart functionality
 */

/**
 * User cart item with product and variant information
 */
export interface UserCartItem {
  id: string;
  quantity: number;
  sellable_item: {
    id: string;
    sku: string;
    price: number;
    stock: number;
    image_url: string | null;
    description: string | null;
    product: {
      id: string;
      name: string;
    };
    /**
     * Variant information from product_variants table
     * - null when sellable item has no variant (variant_id is null)
     * - name is null when variant exists but has no name specified
     */
    variant: {
      id: string;
      name: string | null;
    } | null;
  };
}

/**
 * Sub-product group containing phone models
 * Phone models are VARIANTS, not products
 */
export interface SubProductGroup {
  subProductName: string; // Variant name (e.g., "Sebta", "Transparent") or "Standard" for no variant
  phoneModels: Array<{
    phoneModel: string;
    quantity: number;
    unitPrice: number;
    sellableItemId: string;
    stock: number;
  }>;
  totalPrice: number;
  totalQuantity: number;
}

/**
 * Product group containing sub-products (variants)
 * Main product appears ONCE, sub-products listed under it
 */
export interface ProductGroup {
  productId: string;
  productName: string;
  imageUrl: string | null;
  subProducts: SubProductGroup[];
  totalPrice: number;
  totalQuantity: number;
}

/**
 * Legacy interface for backwards compatibility
 * @deprecated Use ProductGroup instead
 */
export interface GroupedCartItem {
  productId: string;
  productName: string;
  imageUrl: string | null;
  variants: UserCartItem[];
  totalPrice: number;
}
