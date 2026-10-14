"use client";

import { ClipboardPaste, FileUp, Library, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ConfigBanner } from "@/components/layout/config-banner";
import { PageHeader } from "@/components/layout/page-header";
import { useLibrary } from "@/components/providers/library-provider";
import { Card, EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/client/format";
import { DocumentCard } from "./document-card";
import { DocumentViewer } from "./document-viewer";
import { PasteTextForm } from "./paste-text-form";
import { UploadQueue } from "./upload-queue";
import { UploadZone } from "./upload-zone";

type Tab = "upload" | "paste";

export function LibraryView() {
  const { documents, summaries, loading, health, removeDocument, totals } = useLibrary();
  const [tab, setTab] = useState<Tab>("upload");
  const [filter, setFilter] = useState("");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const openId = params.get("doc");
  const focusChunk = params.get("chunk");
  const openDoc = openId ? documents.find((d) => d.id === openId) : undefined;
  const aiReady = health.status === "ready" && health.data.configured;
  const currentModel = health.status === "ready" ? health.data.embeddingModel : null;

  const setOpen = useCallback((id: string | null) => router.replace(id ? `${pathname}?doc=${id}` : pathname, { scroll: false }), [router, pathname]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? summaries.filter((d) => d.name.toLowerCase().includes(q)) : summaries;
  }, [summaries, filter]);

  return (
    <>
      <ConfigBanner />
      <PageHeader
        eyebrow="Knowledge base"
        title={<>Document <span className="text-gradient">library</span></>}
        description="Add sources to your knowledge base. Each file is parsed, split into overlapping chunks and embedded for semantic search."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit p-5 animate-fade-up lg:sticky lg:top-10 lg:col-span-2">
          <div role="tablist" className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-violet-200/[0.06] bg-ink-950/50 p-1">
            {([["upload", "Upload files", FileUp], ["paste", "Paste text", ClipboardPaste]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn("flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition", tab === key ? "bg-gradient-to-b from-violet-500/30 to-violet-600/15 text-mist-50 shadow-[inset_0_0_0_1px_rgb(196_161_255/0.2),0_0_18px_-8px_rgb(157_78_221/0.8)]" : "text-mist-500 hover:text-mist-200")}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          {tab === "upload" ? <UploadZone disabled={!aiReady} /> : <PasteTextForm disabled={!aiReady} onDone={(id) => setOpen(id)} />}
          {!aiReady && health.status !== "loading" && <p className="mt-3 text-center text-xs text-amber-200/80">Indexing requires a configured AI provider.</p>}
          <UploadQueue />
        </Card>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}</div>
          ) : summaries.length === 0 ? (
            <Card>
              <EmptyState
                icon={Library}
                title="No documents yet"
                description="Upload a PDF, Markdown or text file — or paste text — to build your searchable knowledge base."
              />
            </Card>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-mist-400">
                  <span className="font-semibold text-mist-50">{totals.documents}</span> documents · <span className="font-semibold text-mist-50">{totals.chunks}</span> chunks
                </p>
                <label className="flex items-center gap-2 field rounded-xl px-3 sm:w-64">
                  <Search className="h-4 w-4 text-mist-500" />
                  <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name" aria-label="Filter documents" className="h-9 flex-1 bg-transparent text-sm text-mist-50 placeholder:text-mist-500 focus:outline-none" />
                </label>
              </div>
              {visible.length === 0 ? (
                <p className="py-12 text-center text-sm text-mist-500">No document matches “{filter}”.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {visible.map((doc, i) => (
                    <DocumentCard
                      key={doc.id}
                      index={i}
                      doc={doc}
                      stale={currentModel != null && doc.embeddingModel !== currentModel}
                      onOpen={() => setOpen(doc.id)}
                      onDelete={() => removeDocument(doc.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {openDoc && <DocumentViewer doc={openDoc} onClose={() => setOpen(null)} focusChunk={focusChunk != null ? Number(focusChunk) : undefined} />}
    </>
  );
}
