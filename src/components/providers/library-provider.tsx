"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fetchHealth, ingestFile, ingestText } from "@/lib/client/api";
import { indexedDbStore, summarize } from "@/lib/client/db";
import { RAG_CONFIG } from "@/lib/rag/config";
import type { DocumentSummary, HealthStatus, IngestedDocument, StoredDocument } from "@/lib/rag/types";

export type UploadStatus = "queued" | "processing" | "done" | "error";

export interface UploadJob {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
  error?: string;
  documentId?: string;
}

type HealthState = { status: "loading" } | { status: "ready"; data: HealthStatus } | { status: "error"; message: string };

interface LibraryContextValue {
  documents: StoredDocument[];
  summaries: DocumentSummary[];
  loading: boolean;
  storageError: string | null;
  health: HealthState;
  uploads: UploadJob[];
  totals: { documents: number; chunks: number; words: number; bytes: number; pages: number };
  addFiles: (files: File[]) => void;
  addText: (title: string, text: string) => Promise<StoredDocument>;
  removeDocument: (id: string) => Promise<void>;
  dismissUpload: (id: string) => void;
  refreshHealth: () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function validateFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!RAG_CONFIG.acceptedExtensions.some((ext) => name.endsWith(ext))) return "Unsupported format. Use PDF, TXT or Markdown.";
  if (file.size === 0) return "The file is empty.";
  if (file.size > RAG_CONFIG.maxFileBytes) return `File exceeds ${RAG_CONFIG.maxFileBytes / 1024 / 1024} MB.`;
  return null;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const queue = useRef<{ job: UploadJob; file: File }[]>([]);
  const working = useRef(false);

  const refreshHealth = useCallback(() => {
    setHealth({ status: "loading" });
    fetchHealth()
      .then((data) => setHealth({ status: "ready", data }))
      .catch((e: Error) => setHealth({ status: "error", message: e.message }));
  }, []);

  useEffect(() => {
    refreshHealth();
    indexedDbStore
      .list()
      .then((docs) => setDocuments(docs.sort((a, b) => b.createdAt - a.createdAt)))
      .catch((e: Error) => setStorageError(e.message))
      .finally(() => setLoading(false));
  }, [refreshHealth]);

  const persist = useCallback(async (ingested: IngestedDocument): Promise<StoredDocument> => {
    const doc: StoredDocument = { ...ingested, id: newId(), createdAt: Date.now() };
    await indexedDbStore.put(doc);
    setDocuments((prev) => [doc, ...prev]);
    return doc;
  }, []);

  const updateJob = useCallback((id: string, patch: Partial<UploadJob>) => {
    setUploads((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const drain = useCallback(async () => {
    if (working.current) return;
    working.current = true;
    while (queue.current.length) {
      const { job, file } = queue.current.shift()!;
      updateJob(job.id, { status: "processing" });
      try {
        const doc = await persist(await ingestFile(file));
        updateJob(job.id, { status: "done", documentId: doc.id });
      } catch (e) {
        updateJob(job.id, { status: "error", error: (e as Error).message });
      }
    }
    working.current = false;
  }, [persist, updateJob]);

  const addFiles = useCallback(
    (files: File[]) => {
      const jobs: UploadJob[] = files.map((file) => {
        const error = validateFile(file);
        const job: UploadJob = { id: newId(), name: file.name, size: file.size, status: error ? "error" : "queued", error: error ?? undefined };
        if (!error) queue.current.push({ job, file });
        return job;
      });
      setUploads((prev) => [...jobs, ...prev.filter((j) => j.status !== "done")]);
      void drain();
    },
    [drain],
  );

  const addText = useCallback(async (title: string, text: string) => persist(await ingestText(title, text)), [persist]);

  const removeDocument = useCallback(async (id: string) => {
    await indexedDbStore.remove(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const dismissUpload = useCallback((id: string) => setUploads((prev) => prev.filter((j) => j.id !== id)), []);

  const value = useMemo<LibraryContextValue>(() => {
    const summaries = documents.map(summarize);
    return {
      documents,
      summaries,
      loading,
      storageError,
      health,
      uploads,
      totals: {
        documents: documents.length,
        chunks: summaries.reduce((n, d) => n + d.chunkCount, 0),
        words: documents.reduce((n, d) => n + d.wordCount, 0),
        bytes: documents.reduce((n, d) => n + d.size, 0),
        pages: documents.reduce((n, d) => n + (d.pageCount ?? 0), 0),
      },
      addFiles,
      addText,
      removeDocument,
      dismissUpload,
      refreshHealth,
    };
  }, [documents, loading, storageError, health, uploads, addFiles, addText, removeDocument, dismissUpload, refreshHealth]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>.");
  return ctx;
}
