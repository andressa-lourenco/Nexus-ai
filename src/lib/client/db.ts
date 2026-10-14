import type { DocumentSummary, StoredDocument } from "@/lib/rag/types";

/**
 * Persistence boundary for the vector index. The default implementation keeps
 * documents, chunks and embeddings in the browser's IndexedDB, which keeps the
 * server stateless. Swap this for a server-backed store (pgvector, Pinecone…)
 * without touching the UI.
 */
export interface VectorStore {
  list(): Promise<StoredDocument[]>;
  get(id: string): Promise<StoredDocument | undefined>;
  put(doc: StoredDocument): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = "nexus-ai";
const DB_VERSION = 1;
const STORE = "documents";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the local database."));
  });
}

function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = op(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? request.error ?? new Error("Local database operation failed."));
        };
        tx.onabort = tx.onerror;
      }),
  );
}

export const indexedDbStore: VectorStore = {
  list: () => run("readonly", (s) => s.getAll() as IDBRequest<StoredDocument[]>),
  get: (id) => run("readonly", (s) => s.get(id) as IDBRequest<StoredDocument | undefined>),
  put: async (doc) => {
    await run("readwrite", (s) => s.put(doc));
  },
  remove: async (id) => {
    await run("readwrite", (s) => s.delete(id));
  },
  clear: async () => {
    await run("readwrite", (s) => s.clear());
  },
};

export function summarize(doc: StoredDocument): DocumentSummary {
  const { chunks, ...rest } = doc;
  return { ...rest, chunkCount: chunks.length };
}
