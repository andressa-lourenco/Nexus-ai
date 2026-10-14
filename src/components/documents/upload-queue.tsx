"use client";

import { Check, CircleAlert, X } from "lucide-react";
import { useLibrary, type UploadJob } from "@/components/providers/library-provider";
import { Spinner } from "@/components/ui/primitives";
import { cn, formatBytes } from "@/lib/client/format";

const LABEL: Record<UploadJob["status"], string> = {
  queued: "Queued",
  processing: "Extracting, chunking & embedding…",
  done: "Indexed",
  error: "Failed",
};

export function UploadQueue() {
  const { uploads, dismissUpload } = useLibrary();
  if (uploads.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2" aria-live="polite">
      {uploads.map((job) => (
        <li key={job.id} className={cn("relative flex items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-3 animate-fade-up", job.status === "error" ? "border-rose-400/25 bg-rose-500/[0.07]" : job.status === "done" ? "border-emerald-300/15 bg-emerald-400/[0.04]" : "border-violet-300/20 bg-ink-800/70 shadow-[0_0_24px_-12px_rgb(157_78_221/0.8)]")}>
          {job.status === "processing" && <span className="absolute inset-x-0 bottom-0 h-0.5 animate-shimmer bg-gradient-to-r from-transparent via-violet-300 to-transparent bg-[length:200%_100%]" />}
          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset", job.status === "error" ? "bg-rose-500/10 ring-rose-400/20" : job.status === "done" ? "bg-emerald-400/10 ring-emerald-300/20" : "bg-violet-500/15 ring-violet-300/20")}>
            {job.status === "done" ? <Check className="h-4 w-4 text-emerald-300" /> : job.status === "error" ? <CircleAlert className="h-4 w-4 text-rose-300" /> : <Spinner />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-mist-50">{job.name}</p>
            <p className={cn("mt-0.5 text-xs", job.status === "error" ? "text-rose-200/80" : "text-mist-500")}>
              {job.status === "error" ? job.error : `${LABEL[job.status]} · ${formatBytes(job.size)}`}
            </p>
          </div>
          {(job.status === "done" || job.status === "error") && (
            <button onClick={() => dismissUpload(job.id)} className="rounded-lg p-1.5 text-mist-500 transition hover:bg-violet-200/5 hover:text-mist-200" aria-label={`Dismiss ${job.name}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
