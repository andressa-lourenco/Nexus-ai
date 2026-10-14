"use client";

import { Eye, Layers, Trash2 } from "lucide-react";
import { useState } from "react";
import { DocIcon, kindLabel } from "@/components/common/doc-icon";
import { Badge, Card } from "@/components/ui/primitives";
import { formatBytes, formatNumber, formatRelativeTime, plural } from "@/lib/client/format";
import type { DocumentSummary } from "@/lib/rag/types";

export function DocumentCard({ doc, onOpen, onDelete, stale, index }: { doc: DocumentSummary; onOpen: () => void; onDelete: () => Promise<void>; stale?: boolean; index: number }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <Card className="surface-hover group flex flex-col p-5 animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <div className="flex items-start gap-3">
        <DocIcon kind={doc.kind} />
        <div className="min-w-0 flex-1">
          <button onClick={onOpen} className="block w-full truncate text-left text-sm font-semibold text-mist-50 transition hover:text-violet-200" title={doc.name}>
            {doc.name}
          </button>
          <p className="mt-1 font-mono text-[11px] text-mist-500">{formatRelativeTime(doc.createdAt)} · {formatBytes(doc.size)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge>{kindLabel(doc.kind)}</Badge>
        {doc.pageCount != null && <Badge>{plural(doc.pageCount, "page")}</Badge>}
        <Badge tone="violet"><Layers className="h-3 w-3" /> {plural(doc.chunkCount, "chunk")}</Badge>
        <Badge>{formatNumber(doc.wordCount)} words</Badge>
        {stale && <Badge tone="amber">Different embedding model</Badge>}
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-violet-200/[0.05] pt-4">
        <button onClick={onOpen} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-mist-200 transition hover:bg-violet-200/[0.05]">
          <Eye className="h-3.5 w-3.5" /> View chunks
        </button>
        <div className="ml-auto flex items-center gap-1">
          {confirming && <button onClick={() => setConfirming(false)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-mist-400 transition hover:bg-violet-200/[0.05]">Cancel</button>}
          <button
            disabled={deleting}
            onClick={async () => {
              if (!confirming) return setConfirming(true);
              setDeleting(true);
              await onDelete().catch(() => setDeleting(false));
            }}
            className={confirming ? "rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25" : "rounded-lg p-1.5 text-mist-500 transition hover:bg-rose-500/10 hover:text-rose-300"}
            aria-label={confirming ? "Confirm delete" : `Delete ${doc.name}`}
          >
            {confirming ? (deleting ? "Deleting…" : "Delete") : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </Card>
  );
}
