
import { encryptData, decryptData } from './crypto';

const DB_NAME = 'EmeraldFinanceDB';
const DB_VERSION = 3; // Upgraded for Context Indices

// Define store names
export const STORES = {
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  SUBSCRIPTIONS: 'subscriptions',
  GOALS: 'goals',
  DEBTS: 'debts',
  CONTEXTS: 'custom_contexts',
  ATTACHMENTS: 'attachments'
};

// Stores that require encryption
export const ENCRYPTED_STORES = [
    STORES.TRANSACTIONS,
    STORES.SUBSCRIPTIONS,
    STORES.GOALS,
    STORES.DEBTS,
    STORES.CONTEXTS
];

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = (event.target as IDBOpenDBRequest).transaction;
      
      if (!db.objectStoreNames.contains(STORES.ATTACHMENTS)) {
        db.createObjectStore(STORES.ATTACHMENTS);
      }
      
      // Transactions
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const store = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('context', 'context', { unique: false });
      } else {
         const store = tx?.objectStore(STORES.TRANSACTIONS);
         if (store && !store.indexNames.contains('context')) store.createIndex('context', 'context', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
        db.createObjectStore(STORES.BUDGETS, { keyPath: 'key' });
      }
      
      // Subscriptions
      if (!db.objectStoreNames.contains(STORES.SUBSCRIPTIONS)) {
        const store = db.createObjectStore(STORES.SUBSCRIPTIONS, { keyPath: 'id' });
        store.createIndex('context', 'context', { unique: false });
      } else {
         const store = tx?.objectStore(STORES.SUBSCRIPTIONS);
         if (store && !store.indexNames.contains('context')) store.createIndex('context', 'context', { unique: false });
      }

      // Goals
      if (!db.objectStoreNames.contains(STORES.GOALS)) {
        const store = db.createObjectStore(STORES.GOALS, { keyPath: 'id' });
        store.createIndex('context', 'context', { unique: false });
      } else {
         const store = tx?.objectStore(STORES.GOALS);
         if (store && !store.indexNames.contains('context')) store.createIndex('context', 'context', { unique: false });
      }

      // Debts
      if (!db.objectStoreNames.contains(STORES.DEBTS)) {
        const store = db.createObjectStore(STORES.DEBTS, { keyPath: 'id' });
        store.createIndex('context', 'context', { unique: false });
      } else {
         const store = tx?.objectStore(STORES.DEBTS);
         if (store && !store.indexNames.contains('context')) store.createIndex('context', 'context', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CONTEXTS)) {
        db.createObjectStore(STORES.CONTEXTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const performTransaction = async (
  storeName: string, 
  mode: IDBTransactionMode, 
  callback: (store: IDBObjectStore) => IDBRequest | void
): Promise<any> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = callback(store);
    
    if (req) {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
    }
  });
};

// Helper to encrypt an item if it belongs to a sensitive store
const prepareForSave = async (storeName: string, item: any) => {
    if (!ENCRYPTED_STORES.includes(storeName) || !item) return item;

    const publicMeta: any = {
        id: item.id,
        _enc: true 
    };

    // Public Metadata for Indices
    if (item.date) publicMeta.date = item.date;
    if (item.context) publicMeta.context = item.context;
    if (item.type) publicMeta.type = item.type;
    if (item.key) publicMeta.key = item.key;

    const encrypted = await encryptData(item);
    
    return {
        ...publicMeta,
        _payload: encrypted.payload,
        _iv: encrypted.iv
    };
};

const prepareFromLoad = async (item: any) => {
    if (!item) return item;
    if (item._enc && item._payload && item._iv) {
        try {
            const decrypted = await decryptData({ payload: item._payload, iv: item._iv });
            return decrypted;
        } catch (e) {
            console.error("Failed to decrypt item", item.id);
            return item; 
        }
    }
    return item;
};

// --- Atomic Restore Operation ---
export const replaceAllData = async (data: any) => {
    const db = await openDB();
    
    const prep = async (store: string, items: any[]) => {
        return Promise.all(items.map(item => prepareForSave(store, item)));
    };

    const budgetsArr = Object.entries(data.budgets || {}).map(([key, amount]) => ({ key, amount }));
    
    const [txs, budgets, subs, goals, debts, contexts] = await Promise.all([
        prep(STORES.TRANSACTIONS, data.transactions || []),
        prep(STORES.BUDGETS, budgetsArr),
        prep(STORES.SUBSCRIPTIONS, data.subscriptions || []),
        prep(STORES.GOALS, data.goals || []),
        prep(STORES.DEBTS, data.debts || []),
        prep(STORES.CONTEXTS, data.customContexts || [])
    ]);

    return new Promise<void>((resolve, reject) => {
        const storeNames = [
            STORES.TRANSACTIONS, STORES.BUDGETS, STORES.SUBSCRIPTIONS, 
            STORES.GOALS, STORES.DEBTS, STORES.CONTEXTS
        ];
        
        const tx = db.transaction(storeNames, 'readwrite');
        
        tx.onabort = () => reject(new Error("Transaction Aborted"));
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();

        const stores = {
            [STORES.TRANSACTIONS]: txs,
            [STORES.BUDGETS]: budgets,
            [STORES.SUBSCRIPTIONS]: subs,
            [STORES.GOALS]: goals,
            [STORES.DEBTS]: debts,
            [STORES.CONTEXTS]: contexts
        };

        Object.entries(stores).forEach(([storeName, items]) => {
            const store = tx.objectStore(storeName);
            store.clear();
            items.forEach((item: any) => store.add(item));
        });
    });
};

// --- CRUD Operations ---

export const dbItems = {
  getAll: async (storeName: string) => {
      const results = await performTransaction(storeName, 'readonly', store => store.getAll());
      return await Promise.all(results.map((item: any) => prepareFromLoad(item)));
  },
  
  // NEW: Optimized Range/Index Query
  getFromIndex: async (storeName: string, indexName: string, query: IDBValidKey | IDBKeyRange) => {
      const results = await performTransaction(storeName, 'readonly', store => {
          const index = store.index(indexName);
          return index.getAll(query);
      });
      return await Promise.all(results.map((item: any) => prepareFromLoad(item)));
  },

  get: async (storeName: string, key: string | number) => {
      const item = await performTransaction(storeName, 'readonly', store => store.get(key));
      return await prepareFromLoad(item);
  },
  
  add: async (storeName: string, item: any, key?: IDBValidKey) => {
      const securedItem = await prepareForSave(storeName, item);
      return performTransaction(storeName, 'readwrite', store => store.add(securedItem, key));
  },
  
  put: async (storeName: string, item: any, key?: IDBValidKey) => {
      const securedItem = await prepareForSave(storeName, item);
      return performTransaction(storeName, 'readwrite', store => store.put(securedItem, key));
  },
  
  delete: (storeName: string, key: string | number) => performTransaction(storeName, 'readwrite', store => store.delete(key)),
  
  clear: (storeName: string) => performTransaction(storeName, 'readwrite', store => store.clear()),

  bulkPut: async (storeName: string, items: any[]) => {
    const db = await openDB();
    const securedItems = await Promise.all(items.map(item => prepareForSave(storeName, item)));

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      securedItems.forEach(item => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  
  replaceDB: replaceAllData
};

export const saveAttachmentSafe = async (id: string | number, data: string) => {
   const db = await openDB();
   return new Promise<void>((resolve, reject) => {
     const tx = db.transaction(STORES.ATTACHMENTS, 'readwrite');
     const store = tx.objectStore(STORES.ATTACHMENTS);
     const req = store.put(data, id.toString());
     req.onsuccess = () => resolve();
     req.onerror = () => reject(req.error);
   });
}

export const deleteAttachment = (id: string | number) => dbItems.delete(STORES.ATTACHMENTS, id.toString());

export const getAttachment = async (id: string | number): Promise<string | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ATTACHMENTS, 'readonly');
      const store = tx.objectStore(STORES.ATTACHMENTS);
      const req = store.get(id.toString());
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
};

export const getAllAttachments = async (): Promise<Record<string, string>> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ATTACHMENTS, 'readonly');
    const store = tx.objectStore(STORES.ATTACHMENTS);
    const cursorReq = store.openCursor();
    const result: Record<string, string> = {};
    
    cursorReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) {
        result[cursor.key as string] = cursor.value;
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
};

export const clearAllStores = async () => {
   const db = await openDB();
   const names = Array.from(db.objectStoreNames);
   const tx = db.transaction(names, 'readwrite');
   names.forEach(name => tx.objectStore(name).clear());
   return new Promise<void>((resolve, reject) => {
       tx.oncomplete = () => resolve();
       tx.onerror = () => reject(tx.error);
   });
};
