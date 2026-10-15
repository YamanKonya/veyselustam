// Browser IndexedDB storage for seamless high-performance video persistence
const DB_NAME = "VeyselUstamMediaDB";
const STORE_NAME = "product_videos";
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Save video Blob/File in IndexedDB by product ID or key
export const saveVideoBlob = async (key: string, fileOrBlob: Blob): Promise<string> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fileOrBlob, key);

      req.onsuccess = () => {
        const objectUrl = URL.createObjectURL(fileOrBlob);
        resolve(objectUrl);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn("Failed to save video to IndexedDB:", error);
    return URL.createObjectURL(fileOrBlob);
  }
};

// Retrieve video Blob from IndexedDB and return an Object URL
export const getVideoBlobUrl = async (key: string): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          resolve(URL.createObjectURL(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (error) {
    console.warn("Failed to read video from IndexedDB:", error);
    return null;
  }
};

// Delete video from IndexedDB
export const deleteVideoBlob = async (key: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
  } catch (error) {
    console.warn("Failed to delete video from IndexedDB:", error);
  }
};
