"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pencil, LayoutDashboard, LogOut, Loader2 } from "lucide-react";
import { Product } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getProductById } from "@/services/productService";

// The product form is only downloaded once an admin actually opens it
const ProductFormModal = dynamic(() => import("@/components/admin/ProductFormModal"), { ssr: false });

interface AdminEditContextType {
  /** Opens the product form for this product id; `onSaved` runs after a save. */
  openEditor: (productId: string, onSaved?: () => void) => void;
}

const AdminEditContext = createContext<AdminEditContextType>({ openEditor: () => {} });

export const useAdminEdit = () => useContext(AdminEditContext);

/**
 * Lets a signed-in admin edit products where they appear on the storefront
 * (Etsy-style): pencil buttons call openEditor, which loads the stored
 * (Turkish, untranslated) product and shows the admin product form over the page.
 */
export function AdminEditProvider({ children }: { children: React.ReactNode }) {
  const { isAdmin, adminLogout } = useAuth();
  const pathname = usePathname();
  const [editing, setEditing] = useState<Product | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const onSavedRef = useRef<(() => void) | undefined>();

  const openEditor = useCallback(
    async (productId: string, onSaved?: () => void) => {
      if (!isAdmin) return;
      setLoadingId(productId);
      try {
        // The stored product, never the translated copy shown to visitors
        const product = await getProductById(productId);
        if (product) {
          onSavedRef.current = onSaved;
          setEditing(product);
        }
      } finally {
        setLoadingId(null);
      }
    },
    [isAdmin]
  );

  const onAdminPage = pathname?.startsWith("/admin");

  return (
    <AdminEditContext.Provider value={{ openEditor }}>
      {isAdmin && !onAdminPage && (
        <div className="bg-brass-600 text-white text-xs sm:text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 font-semibold">
              <Pencil className="w-3.5 h-3.5" /> Yönetici modu
            </span>
            <span className="hidden sm:inline text-white/80">Ürünlerin üzerindeki kalemle olduğu yerde düzenleyebilirsin.</span>
            <span className="ms-auto flex items-center gap-4">
              {loadingId && <Loader2 className="w-4 h-4 animate-spin" aria-label="Ürün yükleniyor" />}
              <Link href="/admin" className="flex items-center gap-1 hover:underline">
                <LayoutDashboard className="w-3.5 h-3.5" /> Yönetim paneli
              </Link>
              <button type="button" onClick={() => adminLogout()} className="flex items-center gap-1 hover:underline">
                <LogOut className="w-3.5 h-3.5" /> Çıkış
              </button>
            </span>
          </div>
        </div>
      )}

      {children}

      {isAdmin && editing && (
        <ProductFormModal
          isOpen
          productToEdit={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            onSavedRef.current?.();
            onSavedRef.current = undefined;
          }}
        />
      )}
    </AdminEditContext.Provider>
  );
}

/** Small pencil button for the storefront; renders nothing for visitors. */
export function AdminEditButton({
  productId,
  onSaved,
  className = "",
  label = "Düzenle",
}: {
  productId?: string;
  onSaved?: () => void;
  className?: string;
  label?: string;
}) {
  const { isAdmin } = useAuth();
  const { openEditor } = useAdminEdit();
  if (!isAdmin || !productId) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openEditor(productId, onSaved);
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-brass-600 hover:bg-brass-500 text-white text-xs font-semibold shadow-lg transition-colors ${className}`}
    >
      <Pencil className="w-3.5 h-3.5" /> {label}
    </button>
  );
}
