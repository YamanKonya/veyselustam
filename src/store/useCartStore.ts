import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

export interface CartItem {
  cartItemId: string; // `${productId}_${ringSize || 'no-size'}`
  product: Product;
  selectedRingSize?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, selectedRingSize?: string, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, selectedRingSize, quantity = 1) => {
        if (!product.id) return;

        const cartItemId = `${product.id}_${selectedRingSize || "standard"}`;
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.cartItemId === cartItemId);

        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingIndex].quantity += quantity;
          set({ items: updatedItems, isOpen: true });
        } else {
          set({
            items: [
              ...currentItems,
              {
                cartItemId,
                product,
                selectedRingSize,
                quantity,
              },
            ],
            isOpen: true,
          });
        }
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalAmount: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.product.price || 0) * item.quantity,
          0
        );
      },
    }),
    {
      name: "veyselustam-cart-storage",
      // Keep only the items; the drawer should never reopen on its own after a reload
      partialize: (state) => ({ items: state.items }),
      // Older saves also hold isOpen; read back only the items
      merge: (persisted, current) => ({
        ...current,
        items: (persisted as { items?: CartItem[] } | undefined)?.items ?? current.items,
      }),
    }
  )
);
