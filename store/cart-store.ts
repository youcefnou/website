import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productName: string;
  subProductName: string; // Variant name (e.g., "Sebta", "Transparent") or empty string for no variant
  phoneModel: string; // Phone model from sellable_item description
  quantity: number;
  unitPrice: number;
  // Additional fields for cart operations
  sellableItemId: string;
  image_url?: string | null;
  sku: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isHydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (sellableItemId: string) => void;
  updateQuantity: (sellableItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  setHydrated: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,

      addItem: (item: CartItem) =>
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.sellableItemId === item.sellableItemId
          );

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.sellableItemId === item.sellableItemId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }

          return { items: [...state.items, item] };
        }),

      removeItem: (sellableItemId: string) =>
        set((state) => ({
          items: state.items.filter((i) => i.sellableItemId !== sellableItemId),
        })),

      updateQuantity: (sellableItemId: string, quantity: number) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.sellableItemId !== sellableItemId),
            };
          }

          return {
            items: state.items.map((i) =>
              i.sellableItemId === sellableItemId ? { ...i, quantity } : i
            ),
          };
        }),

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const state = get();
        return state.items.reduce(
          (total, item) => total + item.unitPrice * item.quantity,
          0
        );
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
