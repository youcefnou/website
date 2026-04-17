import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'اسم المنتج مطلوب')
    .min(3, 'اسم المنتج يجب أن يكون 3 أحرف على الأقل')
    .max(200, 'اسم المنتج يجب أن لا يتجاوز 200 حرف'),
  
  description: z
    .string()
    .max(1000, 'الوصف يجب أن لا يتجاوز 1000 حرف')
    .optional()
    .nullable(),
  
  categoryId: z
    .string()
    .uuid('معرف التصنيف يجب أن يكون UUID صالح'),
  
  hasVariants: z.boolean().default(false),
});

export const sellableItemSchema = z.object({
  productId: z
    .string()
    .uuid('معرف المنتج يجب أن يكون UUID صالح'),
  
  variantId: z
    .string()
    .uuid('معرف المتغير يجب أن يكون UUID صالح')
    .optional()
    .nullable(),
  
  description: z
    .string()
    .max(500, 'الوصف يجب أن لا يتجاوز 500 حرف')
    .optional()
    .nullable(),
  
  price: z
    .number()
    .positive('السعر يجب أن يكون أكبر من صفر')
    .max(999999.99, 'السعر يجب أن لا يتجاوز 999,999.99'),
  
  stock: z
    .number()
    .int('المخزون يجب أن يكون رقم صحيح')
    .min(0, 'المخزون لا يمكن أن يكون سالب'),
  
  sku: z
    .string()
    .min(1, 'رمز SKU مطلوب')
    .max(100, 'رمز SKU يجب أن لا يتجاوز 100 حرف'),
  
  imageUrl: z
    .string()
    .url('رابط الصورة يجب أن يكون URL صالح')
    .optional()
    .nullable(),
});

export const productVariantSchema = z.object({
  productId: z
    .string()
    .uuid('معرف المنتج يجب أن يكون UUID صالح'),
  
  name: z
    .string()
    .max(100, 'اسم المتغير يجب أن لا يتجاوز 100 حرف')
    .optional()
    .nullable(),
});

export const addToCartSchema = z.object({
  sellableItemId: z
    .string()
    .uuid('معرف المنتج يجب أن يكون UUID صالح'),
  
  quantity: z
    .number()
    .int('الكمية يجب أن تكون رقم صحيح')
    .positive('الكمية يجب أن تكون أكبر من صفر')
    .max(999, 'الكمية يجب أن لا تتجاوز 999'),
  
  stock: z
    .number()
    .int()
    .min(0, 'المخزون لا يمكن أن يكون سالب'),
});

export type ProductData = z.infer<typeof productSchema>;
export type SellableItemData = z.infer<typeof sellableItemSchema>;
export type ProductVariantData = z.infer<typeof productVariantSchema>;
export type AddToCartData = z.infer<typeof addToCartSchema>;

export function validateProduct(data: unknown): ProductData {
  return productSchema.parse(data);
}

export function validateSellableItem(data: unknown): SellableItemData {
  return sellableItemSchema.parse(data);
}

export function validateProductVariant(data: unknown): ProductVariantData {
  return productVariantSchema.parse(data);
}

export function validateAddToCart(data: unknown): AddToCartData {
  return addToCartSchema.parse(data);
}
