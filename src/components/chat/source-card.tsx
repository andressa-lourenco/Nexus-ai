import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/client/format";
import type { SourceRef } from "@/lib/rag/types";

export function SourceCard({ source, cited, active, onSelect }: { source: SourceRef; cited: boolean; active: boolean; onSelect: () => void }) {
  const pct = Math.round(Math.max(0, Math.min(1, source.score)) * 100);
  return (
    <div
      id={`source-${source.documentId}-${source.chunkIndex}`}
      className={cn(
        "rounded-xl border p-3.5 transition duration-300",
        active ? "border-violet-300/50 bg-violet-500/[0.12] shadow-[0_0_0_4px_rgb(157_78_221/0.1),0_0_30px_-10px_rgb(157_78_221/0.8)]" : "border-violet-200/10 bg-ink-900/50 backdrop-blur-xl hover:border-violet-300/30",
        !cited && "opacity-70",
      )}
    >
      <button onClick={onSelect} className="flex w-full items-start gap-3 text-left">
        <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-[11px] font-semibold", cited ? "bg-violet-500/20 text-violet-200" : "bg-violet-200/[0.06] text-mist-400")}>{source.n}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-mist-50">{source.documentName}</p>
          <div className="mt-1 flex items-center gap-2 font-mono text-[10.5px] text-mist-500">
            {source.page != null && <span>p.{source.page}</span>}
            <span>chunk #{source.chunkIndex + 1}</span>
            <span className="flex items-center gap-1.5">
              <span className="relative h-1 w-10 overflow-hidden rounded-full bg-violet-200/10"><span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-violet-200" style={{ width: `${pct}%` }} /></span>
              {pct}%
            </span>
            {!cited && <span className="text-mist-500">· retrieved, not cited</span>}
          </div>
        </div>
      </button>
      {active && (
        <div className="mt-3 animate-fade-in">
          <p className="max-h-48 overflow-y-auto whitespace-pre-wrap border-l-2 border-violet-400/40 pl-3 text-[12.5px] leading-relaxed text-mist-200">{source.text}</p>
          <Link href={`/documents?doc=${source.documentId}&chunk=${source.chunkIndex}`} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 transition hover:text-violet-200">
            Open in document <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
