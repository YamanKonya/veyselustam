import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

interface RecentStore {
  recentItems: Product[];
  addRecentItem: (product: Product) => void;
  clearRecent: () => void;
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set, get) => ({
      recentItems: [],
      
      addRecentItem: (product) => {
        if (!product.id) return;
        
        const currentItems = get().recentItems;
        // Check if already exists, if so, remove it to put it at the front
        const filteredItems = currentItems.filter(item => item.id !== product.id);
        
        // Add to front, keep max 10 items
        const newItems = [product, ...filteredItems].slice(0, 10);
        
        set({ recentItems: newItems });
      },
      
      clearRecent: () => set({ recentItems: [] }),
    }),
    {
      name: "veyselustam-recent-storage",
    }
  )
);
