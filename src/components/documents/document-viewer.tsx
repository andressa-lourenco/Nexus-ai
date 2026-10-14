"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DocIcon, kindLabel } from "@/components/common/doc-icon";
import { Badge } from "@/components/ui/primitives";
import { formatBytes, formatNumber, plural } from "@/lib/client/format";
import type { StoredDocument } from "@/lib/rag/types";

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i} className="rounded bg-violet-500/30 px-0.5 text-violet-50">{p}</mark> : p))}</>;
}

export function DocumentViewer({ doc, onClose, focusChunk }: { doc: StoredDocument; onClose: () => void; focusChunk?: number }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (focusChunk == null) return;
    document.getElementById(`chunk-${focusChunk}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusChunk]);

  const chunks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? doc.chunks.filter((c) => c.text.toLowerCase().includes(q)) : doc.chunks;
  }, [doc.chunks, query]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={doc.name}>
      <button className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-label="Close viewer" />
      <section className="relative flex h-full w-full max-w-2xl flex-col border-l border-violet-300/15 bg-[linear-gradient(180deg,#2d1b43,#211335)] shadow-[-40px_0_80px_-20px_rgb(8_3_18/0.8)] animate-[fade-up_0.4s_cubic-bezier(0.22,1,0.36,1)_both] sm:animate-[slide-in_0.4s_cubic-bezier(0.22,1,0.36,1)_both]">
        <header className="border-b border-violet-200/[0.06] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <DocIcon kind={doc.kind} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-mist-50">{doc.name}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge>{kindLabel(doc.kind)}</Badge>
                {doc.pageCount != null && <Badge>{plural(doc.pageCount, "page")}</Badge>}
                <Badge tone="violet">{plural(doc.chunks.length, "chunk")}</Badge>
                <Badge>{formatNumber(doc.wordCount)} words</Badge>
                <Badge>{formatBytes(doc.size)}</Badge>
              </div>
              <p className="mt-2 font-mono text-[10.5px] text-mist-500">{doc.embeddingModel} · {doc.dimensions} dimensions</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-mist-400 transition hover:bg-violet-200/5 hover:text-mist-50" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="mt-5 flex items-center gap-2 field rounded-xl px-3">
            <Search className="h-4 w-4 text-mist-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search inside this document" className="h-10 flex-1 bg-transparent text-sm text-mist-50 placeholder:text-mist-500 focus:outline-none" />
            {query && <span className="font-mono text-[11px] text-mist-500">{chunks.length} hits</span>}
          </label>
        </header>
        <ol className="flex-1 space-y-3 overflow-y-auto p-5 sm:p-6">
          {chunks.length === 0 && <p className="py-10 text-center text-sm text-mist-500">No chunk contains “{query}”.</p>}
          {chunks.map((chunk) => (
            <li
              key={chunk.index}
              id={`chunk-${chunk.index}`}
              className={`rounded-xl border p-4 transition ${focusChunk === chunk.index ? "border-violet-300/50 bg-violet-500/[0.12] shadow-[0_0_0_4px_rgb(157_78_221/0.1)]" : "border-violet-200/[0.06] bg-violet-200/[0.015]"}`}
            >
              <div className="mb-2 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-mist-500">
                <span className="text-violet-300">#{chunk.index + 1}</span>
                {chunk.page != null && <span>· page {chunk.page}</span>}
                <span>· {chunk.text.length} chars</span>
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-mist-200"><Highlight text={chunk.text} query={query.trim()} /></p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
