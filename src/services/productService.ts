import {
  collection,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteField,
  FieldValue,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Product } from "@/types";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
import { saveVideoBlob, getVideoBlobUrl } from "./videoStorage";

const PRODUCTS_COLLECTION = "products";
const STORAGE_KEY = "vu_products_catalog_v4";

// Helper to strip undefined values so Firestore never throws unsupported field value errors
const sanitizeForFirestore = (obj: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  // blob: URLs only live in the uploading browser and huge data URLs exceed the doc size limit
  if (typeof clean.videoUrl === "string" && (clean.videoUrl.startsWith("blob:") || clean.videoUrl.length > 500000)) {
    delete clean.videoUrl;
  }
  delete clean.id;
  return clean;
};

// ---- Firestore write error reporting ----
// Writes run in the background after the optimistic local update, so failures are
// pushed to listeners (the admin panel shows them as a toast) instead of being swallowed.
const writeErrorListeners: Array<(message: string) => void> = [];

export const subscribeProductWriteErrors = (cb: (message: string) => void) => {
  writeErrorListeners.push(cb);
  return () => {
    const idx = writeErrorListeners.indexOf(cb);
    if (idx > -1) writeErrorListeners.splice(idx, 1);
  };
};

export const describeFirestoreError = (err: unknown): string => {
  const code = (err as { code?: string })?.code || "";
  if (code === "permission-denied") {
    return "Yetki reddedildi: bu hesap Firestore'da yönetici (admins) olarak kayıtlı değil veya oturum kapanmış.";
  }
  if (code === "unavailable") {
    return "Firebase'e ulaşılamadı (internet bağlantısını kontrol edin).";
  }
  if (code === "invalid-argument" || code === "resource-exhausted") {
    return "Ürün verisi çok büyük (fotoğraf/video). Daha küçük dosya deneyin.";
  }
  return (err as { message?: string })?.message || String(err);
};

const reportWriteError = (action: string, err: unknown) => {
  console.error(`Firestore ${action} failed:`, err);
  const message = `Kaydedilemedi (${action}): ${describeFirestoreError(err)}`;
  writeErrorListeners.forEach((cb) => cb(message));
};

// Writes changed fields to products/{id}. If the doc does not exist yet (product only
// lives in initialProducts / localStorage) or is a partial doc without createdAt, the
// full product is written so it shows up for every visitor.
const writeProductDoc = async (
  id: string,
  fields: Record<string, unknown | FieldValue>
): Promise<void> => {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  const snap = await getDoc(productRef);
  const existing = snap.exists() ? snap.data() : null;

  if (existing && existing.createdAt && existing.title) {
    await setDoc(productRef, fields, { merge: true });
    return;
  }

  const local =
    localProductsStore.find((p) => p.id === id) ||
    INITIAL_VEYSELUSTAM_PRODUCTS.find((p) => p.id === id);
  if (!local) {
    await setDoc(productRef, fields, { merge: true });
    return;
  }

  await setDoc(
    productRef,
    {
      ...sanitizeForFirestore(local),
      ...(existing || {}),
      ...fields,
      createdAt: local.createdAt || existing?.createdAt || new Date().toISOString(),
    },
    { merge: true }
  );
};

const syncProductInBackground = (action: string, id: string, fields: Record<string, unknown | FieldValue>) => {
  writeProductDoc(id, fields).catch((err) => reportWriteError(action, err));
};

// Helper to load catalog from localStorage (persists discounts & custom products)
const loadProductsFromStorage = (): Product[] => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_VEYSELUSTAM_PRODUCTS.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load products from localStorage:", e);
    }
  }
  return [...INITIAL_VEYSELUSTAM_PRODUCTS];
};

// Helper to save catalog to localStorage
const saveProductsToStorage = (products: Product[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn("Failed to save products to localStorage:", e);
    }
  }
};

// Local in-memory store initialized with localStorage or scraped products dataset
let localProductsStore: Product[] = loadProductsFromStorage();

// Active subscribers list for instant local state sync
const subscribers: Array<(products: Product[]) => void> = [];

const notifySubscribers = () => {
  saveProductsToStorage(localProductsStore);
  subscribers.forEach((cb) => cb([...localProductsStore]));
};

// Convert file to Base64 Data URL instantly
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        resolve("https://cdn.myikas.com/images/12b70023-d1d5-479c-951a-7f0a014982a9/3b66ab45-af5a-4152-8a16-a2e22d478adf/720/img-20240207-121651.webp");
      }
    };
    reader.onerror = () => {
      resolve("https://cdn.myikas.com/images/12b70023-d1d5-479c-951a-7f0a014982a9/3b66ab45-af5a-4152-8a16-a2e22d478adf/720/img-20240207-121651.webp");
    };
    reader.readAsDataURL(file);
  });
};

// Upload a single file (image or video) to Storage with IndexedDB fallback for videos
export const uploadFileToStorage = async (file: File, folderName: string = "products"): Promise<string> => {
  // For video files, save to browser IndexedDB for instant 60fps playback without localStorage truncation
  if (file.type && file.type.startsWith("video/")) {
    const videoKey = `vu_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return await saveVideoBlob(videoKey, file);
  }

  try {
    const firebaseUploadPromise = (async () => {
      const fileExt = file.name.split('.').pop() || "jpg";
      const fileName = `${folderName}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    })();

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("Storage timeout")), 1200);
    });

    return await Promise.race([firebaseUploadPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Storage upload network fallback to instant base64:", error);
    return await fileToBase64(file);
  }
};

export const uploadImageToStorage = (file: File): Promise<string> => {
  return uploadFileToStorage(file, "products");
};

// Merge Firestore docs over the local catalog. Firestore is the source of truth for every
// product it holds (so admin edits reach all browsers); products not in Firestore yet
// (not seeded) fall back to the local / initial dataset.
// Videos shipped with the site (public/videos) for catalogue products; a video set
// in the admin panel takes precedence.
const SEED_VIDEOS = new Map(
  INITIAL_VEYSELUSTAM_PRODUCTS.filter((p) => p.id && p.videoUrl).map((p) => [p.id!, p.videoUrl!] as const)
);

const mergeWithInitialProducts = (fetched: Product[]): Product[] => {
  const base = loadProductsFromStorage();
  const baseMap = new Map<string, Product>();
  base.forEach((p) => p.id && baseMap.set(p.id, p));

  const fetchedIds = new Set<string>();
  const merged: Product[] = fetched
    .filter((p) => p.id)
    .map((remote) => {
      fetchedIds.add(remote.id!);
      const localProd = baseMap.get(remote.id!);
      return localProd
        ? { ...localProd, ...remote, videoUrl: remote.videoUrl || SEED_VIDEOS.get(remote.id!) || localProd.videoUrl }
        : { ...remote, videoUrl: remote.videoUrl || SEED_VIDEOS.get(remote.id!) };
    })
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  base.forEach((p) => {
    if (p.id && !fetchedIds.has(p.id)) merged.push(p);
  });
  return merged;
};

// Fetch all products with instant fallback
export const getProducts = async (): Promise<Product[]> => {
  localProductsStore = loadProductsFromStorage();
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));

    if (!querySnapshot.empty) {
      const fetched = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      localProductsStore = mergeWithInitialProducts(fetched);
      notifySubscribers();
      return localProductsStore;
    }
  } catch (error) {
    console.warn("Firestore fetch failed, using local products dataset:", error);
  }

  return localProductsStore;
};

// Synchronous lookup in the local dataset, for rendering before Firestore answers
export const getLocalProductById = (id: string): Product | null => {
  localProductsStore = loadProductsFromStorage();
  return localProductsStore.find((p) => p.id === id) || null;
};

// Fetch a single product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  localProductsStore = loadProductsFromStorage();
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const local = localProductsStore.find((p) => p.id === id);
      return { ...(local || {}), id: docSnap.id, ...docSnap.data() } as Product;
    }
  } catch (error) {
    console.warn("Firestore getDoc failed, searching local store:", error);
  }

  return localProductsStore.find((p) => p.id === id) || null;
};

// Real-time listener that guarantees INSTANT initial data delivery from localStorage
export const subscribeProducts = (onUpdate: (products: Product[]) => void) => {
  localProductsStore = loadProductsFromStorage();
  onUpdate([...localProductsStore]);
  subscribers.push(onUpdate);

  let unsubscribeFirebase = () => {};
  try {
    unsubscribeFirebase = onSnapshot(
      collection(db, PRODUCTS_COLLECTION),
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
          localProductsStore = mergeWithInitialProducts(fetched);
          notifySubscribers();
        }
      },
      (error) => {
        console.warn("Firestore subscription network fallback:", error);
      }
    );
  } catch (error) {
    console.warn("Firebase snapshot listener setup skipped:", error);
  }

  return () => {
    const idx = subscribers.indexOf(onUpdate);
    if (idx > -1) subscribers.splice(idx, 1);
    try {
      unsubscribeFirebase();
    } catch (e) {}
  };
};

// Add a new product manually
export const createProduct = async (
  productData: Omit<Product, "id">,
  imageFiles: File[] = []
): Promise<string> => {
  const uploadedImageUrls: string[] = [...(productData.images || [])];

  for (const file of imageFiles) {
    const url = await uploadImageToStorage(file);
    uploadedImageUrls.push(url);
  }

  const newId = `vu-prod-${Date.now()}`;
  const newProduct: Product = {
    id: newId,
    ...productData,
    images: uploadedImageUrls.length > 0 ? uploadedImageUrls : ["https://cdn.myikas.com/images/12b70023-d1d5-479c-951a-7f0a014982a9/3b66ab45-af5a-4152-8a16-a2e22d478adf/720/img-20240207-121651.webp"],
    createdAt: new Date().toISOString(),
  };

  // INSTANT LOCAL UPDATE (0ms)
  localProductsStore = [newProduct, ...localProductsStore];
  notifySubscribers();

  // Background non-blocking sync to Firestore
  setDoc(doc(db, PRODUCTS_COLLECTION, newId), sanitizeForFirestore(newProduct), { merge: true }).catch(
    (err) => reportWriteError("yeni ürün", err)
  );

  return newProduct.id!;
};

// Update an existing product
export const updateProduct = async (
  id: string,
  productData: Partial<Product>,
  newImageFiles: File[] = []
): Promise<void> => {
  const uploadedImageUrls: string[] = [...(productData.images || [])];

  for (const file of newImageFiles) {
    const url = await uploadImageToStorage(file);
    uploadedImageUrls.push(url);
  }

  const updatedFields = {
    ...productData,
    images: uploadedImageUrls,
    updatedAt: new Date().toISOString(),
  };

  // INSTANT LOCAL UPDATE (0ms)
  localProductsStore = localProductsStore.map((p) =>
    p.id === id ? { ...p, ...updatedFields } : p
  );
  notifySubscribers();

  // Clearing a field in the form must remove it from Firestore, not keep the old value
  const firestoreFields: Record<string, unknown | FieldValue> = sanitizeForFirestore(updatedFields);
  (["originalPrice", "discountPercent", "videoUrl"] as const).forEach((key) => {
    if (key in productData && productData[key] === undefined) firestoreFields[key] = deleteField();
  });

  // Background non-blocking sync to Firestore
  syncProductInBackground("ürün güncelleme", id, firestoreFields);
};

// Delete a product
export const deleteProduct = async (id: string): Promise<void> => {
  localProductsStore = localProductsStore.filter((p) => p.id !== id);
  notifySubscribers();

  deleteDoc(doc(db, PRODUCTS_COLLECTION, id)).catch((err) => reportWriteError("ürün silme", err));
};

// Bulk apply percentage discount to selected products or category
export const applyBulkDiscount = async (
  percent: number,
  targetCategory?: string,
  selectedProductIds?: string[]
): Promise<number> => {
  if (percent <= 0 || percent >= 100) return 0;

  let count = 0;
  const changed: Product[] = [];
  localProductsStore = localProductsStore.map((product) => {
    const matchesCategory = !targetCategory || targetCategory === "Hepsi" || product.category === targetCategory;
    const matchesSelection = !selectedProductIds || selectedProductIds.length === 0 || (product.id && selectedProductIds.includes(product.id));

    if (matchesCategory && matchesSelection) {
      count++;
      const basePrice = product.originalPrice || product.price;
      const discountedPrice = Math.round(basePrice * (1 - percent / 100));

      const updated = {
        ...product,
        originalPrice: basePrice,
        price: discountedPrice,
        discountPercent: percent,
        isCampaign: true,
      };
      changed.push(updated);
      return updated;
    }
    return product;
  });

  notifySubscribers();
  await Promise.all(
    changed.map((p) =>
      writeProductDoc(p.id!, {
        originalPrice: p.originalPrice,
        price: p.price,
        discountPercent: p.discountPercent,
        isCampaign: true,
      })
    )
  ).catch((err) => reportWriteError("toplu indirim", err));
  return count;
};

// Clear discount / reset prices for selected products or category
export const clearBulkDiscount = async (
  targetCategory?: string,
  selectedProductIds?: string[]
): Promise<number> => {
  let count = 0;
  const changed: Product[] = [];
  localProductsStore = localProductsStore.map((product) => {
    const matchesCategory = !targetCategory || targetCategory === "Hepsi" || product.category === targetCategory;
    const matchesSelection = !selectedProductIds || selectedProductIds.length === 0 || (product.id && selectedProductIds.includes(product.id));

    if (matchesCategory && matchesSelection && product.originalPrice) {
      count++;
      changed.push(product);
      return {
        ...product,
        price: product.originalPrice,
        originalPrice: undefined,
        discountPercent: undefined,
        isCampaign: false,
      };
    }
    return product;
  });

  notifySubscribers();
  await Promise.all(
    changed.map((p) =>
      writeProductDoc(p.id!, {
        price: p.originalPrice,
        originalPrice: deleteField(),
        discountPercent: deleteField(),
        isCampaign: false,
      })
    )
  ).catch((err) => reportWriteError("indirim kaldırma", err));
  return count;
};

// Toggle Featured (Vitrin Ürünü)
export const toggleFeaturedProduct = async (id: string): Promise<boolean> => {
  let newStatus = false;
  localProductsStore = localProductsStore.map((p) => {
    if (p.id === id) {
      newStatus = !p.isFeatured;
      return { ...p, isFeatured: newStatus };
    }
    return p;
  });
  notifySubscribers();

  syncProductInBackground("vitrin", id, { isFeatured: newStatus });
  return newStatus;
};

// Toggle Active / Passive (Aktif / Pasif)
export const toggleActiveProduct = async (id: string): Promise<boolean> => {
  let newStatus = false;
  localProductsStore = localProductsStore.map((p) => {
    if (p.id === id) {
      const current = p.isActive !== false; // varsayılan true
      newStatus = !current;
      return { ...p, isActive: newStatus };
    }
    return p;
  });
  notifySubscribers();

  syncProductInBackground("aktif/pasif", id, { isActive: newStatus });
  return newStatus;
};

// Seed every catalog product into Firestore products/{id} if it is missing (or only a
// partial doc without createdAt). Uses this browser's local copy so earlier local edits
// are kept; existing complete docs are never overwritten.
export const seedProductsToFirestore = async (): Promise<{ created: number; skipped: number }> => {
  const localMap = new Map<string, Product>();
  localProductsStore.forEach((p) => p.id && localMap.set(p.id, p));

  const toSeed: Product[] = INITIAL_VEYSELUSTAM_PRODUCTS.map((p) => localMap.get(p.id!) || p);
  localProductsStore.forEach((p) => {
    if (p.id && !INITIAL_VEYSELUSTAM_PRODUCTS.some((ip) => ip.id === p.id)) toSeed.push(p);
  });

  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  const complete = new Set(
    snapshot.docs.filter((d) => d.data().createdAt && d.data().title).map((d) => d.id)
  );
  const partial = new Map(snapshot.docs.filter((d) => !complete.has(d.id)).map((d) => [d.id, d.data()]));

  let created = 0;
  for (const product of toSeed) {
    if (!product.id || complete.has(product.id)) continue;
    await setDoc(
      doc(db, PRODUCTS_COLLECTION, product.id),
      {
        ...sanitizeForFirestore(product),
        ...(partial.get(product.id) || {}),
        createdAt: product.createdAt || new Date().toISOString(),
      },
      { merge: true }
    );
    created++;
  }
  return { created, skipped: toSeed.length - created };
};
