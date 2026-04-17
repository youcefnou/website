/**
 * Cart Grouping Utility
 *
 * Groups cart items by:
 * 1. productId (main product)
 * 2. subProductName (variant like Sebta, Transparent)
 * 3. phoneModel (phone models are variants, NOT products)
 *
 * Business Logic:
 * - Main product (e.g., Anti-Choc) appears ONCE
 * - Sub-product (e.g., Sebta) appears ONCE under main product
 * - Phone models listed under sub-product
 */

import type { CartItem } from '@/store/cart-store';
import type { UserCartItem, ProductGroup, SubProductGroup } from '@/lib/types/cart';

/**
 * Group guest cart items by product → sub-product → phone model
 */
export function groupGuestCartItems(items: CartItem[]): ProductGroup[] {
  if (!items || items.length === 0) return [];

  const productGroups = new Map<
    string,
    {
      productId: string;
      productName: string;
      imageUrl: string | null;
      subProducts: Map<
        string,
        {
          subProductName: string;
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
      >;
      totalPrice: number;
      totalQuantity: number;
    }
  >();

  items.forEach((item) => {
    // Validate item data
    if (!item.productId || !item.productName) {
      return;
    }

    const productId = item.productId;
    const productName = item.productName;
    const subProductName = item.subProductName || 'Standard';
    const phoneModel = item.phoneModel || item.sku;
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;

    if (quantity <= 0 || unitPrice < 0) {
      return;
    }

    // Create product group if it doesn't exist
    if (!productGroups.has(productId)) {
      productGroups.set(productId, {
        productId,
        productName,
        imageUrl: item.image_url || null,
        subProducts: new Map(),
        totalPrice: 0,
        totalQuantity: 0,
      });
    }

    const productGroup = productGroups.get(productId)!;

    // Create sub-product group if it doesn't exist
    if (!productGroup.subProducts.has(subProductName)) {
      productGroup.subProducts.set(subProductName, {
        subProductName,
        phoneModels: [],
        totalPrice: 0,
        totalQuantity: 0,
      });
    }

    const subProductGroup = productGroup.subProducts.get(subProductName)!;

    // Add phone model
    subProductGroup.phoneModels.push({
      phoneModel,
      quantity,
      unitPrice,
      sellableItemId: item.sellableItemId,
      stock: item.stock,
    });
    subProductGroup.totalPrice += unitPrice * quantity;
    subProductGroup.totalQuantity += quantity;

    // Update product totals
    productGroup.totalPrice += unitPrice * quantity;
    productGroup.totalQuantity += quantity;
  });

  // Convert to array format
  return Array.from(productGroups.values()).map((productGroup) => ({
    productId: productGroup.productId,
    productName: productGroup.productName,
    imageUrl: productGroup.imageUrl,
    subProducts: Array.from(productGroup.subProducts.values()),
    totalPrice: productGroup.totalPrice,
    totalQuantity: productGroup.totalQuantity,
  }));
}

/**
 * Extended SubProductGroup with cartItemId for user cart items
 */
export interface UserSubProductGroup extends SubProductGroup {
  phoneModels: Array<{
    phoneModel: string;
    quantity: number;
    unitPrice: number;
    sellableItemId: string;
    stock: number;
    cartItemId: string;
  }>;
}

/**
 * Extended ProductGroup with cartItemId for user cart items
 */
export interface UserProductGroup extends Omit<ProductGroup, 'subProducts'> {
  subProducts: UserSubProductGroup[];
}

/**
 * Group user cart items (from Supabase) by product → sub-product → phone model
 */
export function groupUserCartItems(items: UserCartItem[]): UserProductGroup[] {
  if (!items || items.length === 0) return [];

  const productGroups = new Map<
    string,
    {
      productId: string;
      productName: string;
      imageUrl: string | null;
      subProducts: Map<
        string,
        {
          subProductName: string;
          phoneModels: Array<{
            phoneModel: string;
            quantity: number;
            unitPrice: number;
            sellableItemId: string;
            stock: number;
            cartItemId: string;
          }>;
          totalPrice: number;
          totalQuantity: number;
        }
      >;
      totalPrice: number;
      totalQuantity: number;
    }
  >();

  items.forEach((item) => {
    // Validate item data
    if (
      !item?.sellable_item?.product?.id ||
      !item?.sellable_item?.product?.name
    ) {
      return;
    }

    if (!item.sellable_item?.id || !item.sellable_item?.sku) {
      return;
    }

    const price = Number(item.sellable_item.price) || 0;
    const quantity = Number(item.quantity) || 0;

    if (quantity <= 0 || price < 0) {
      return;
    }

    const productId = item.sellable_item.product.id;
    const productName = item.sellable_item.product.name;
    const subProductName = item.sellable_item.variant?.name || 'Standard';
    const phoneModel =
      item.sellable_item.description || `SKU: ${item.sellable_item.sku}`;

    // Create product group if it doesn't exist
    if (!productGroups.has(productId)) {
      productGroups.set(productId, {
        productId,
        productName,
        imageUrl: item.sellable_item.image_url,
        subProducts: new Map(),
        totalPrice: 0,
        totalQuantity: 0,
      });
    }

    const productGroup = productGroups.get(productId)!;

    // Create sub-product group if it doesn't exist
    if (!productGroup.subProducts.has(subProductName)) {
      productGroup.subProducts.set(subProductName, {
        subProductName,
        phoneModels: [],
        totalPrice: 0,
        totalQuantity: 0,
      });
    }

    const subProductGroup = productGroup.subProducts.get(subProductName)!;

    // Add phone model
    subProductGroup.phoneModels.push({
      phoneModel,
      quantity,
      unitPrice: price,
      sellableItemId: item.sellable_item.id,
      stock: item.sellable_item.stock,
      cartItemId: item.id,
    });
    subProductGroup.totalPrice += price * quantity;
    subProductGroup.totalQuantity += quantity;

    // Update product totals
    productGroup.totalPrice += price * quantity;
    productGroup.totalQuantity += quantity;
  });

  // Convert to array format
  return Array.from(productGroups.values()).map((productGroup) => ({
    productId: productGroup.productId,
    productName: productGroup.productName,
    imageUrl: productGroup.imageUrl,
    subProducts: Array.from(productGroup.subProducts.values()),
    totalPrice: productGroup.totalPrice,
    totalQuantity: productGroup.totalQuantity,
  }));
}
