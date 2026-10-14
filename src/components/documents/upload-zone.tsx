"use client";

import { FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { useLibrary } from "@/components/providers/library-provider";
import { cn } from "@/lib/client/format";
import { RAG_CONFIG } from "@/lib/rag/config";

export function UploadZone({ disabled }: { disabled?: boolean }) {
  const { addFiles } = useLibrary();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list || list.length === 0 || disabled) return;
    addFiles(Array.from(list));
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload documents"
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !disabled && (e.preventDefault(), input.current?.click())}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files);
      }}
      className={cn(
        "group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-6 py-10 text-center transition duration-300",
        dragging ? "scale-[1.01] border-violet-400/70 bg-violet-500/[0.08]" : "border-violet-200/12 bg-violet-200/[0.015] hover:border-violet-400/40 hover:bg-violet-500/[0.04]",
        disabled && "cursor-not-allowed opacity-50 hover:border-violet-200/12 hover:bg-violet-200/[0.015]",
      )}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full bg-violet-500/20 blur-3xl transition-opacity", dragging ? "opacity-100" : "opacity-0 group-hover:opacity-60")} />
      <span className={cn("relative grid h-14 w-14 place-items-center rounded-2xl border border-violet-300/30 bg-gradient-to-b from-ink-700 to-ink-850 text-violet-200 shadow-[0_0_24px_-8px_rgb(157_78_221/0.8)] transition duration-300", dragging ? "-translate-y-1 scale-110" : "group-hover:-translate-y-1")}>
        <FileUp className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="relative mt-4 text-sm font-semibold text-mist-50">{dragging ? "Release to upload" : "Drop files here or click to browse"}</p>
      <p className="relative mt-1 text-xs text-mist-500">PDF, TXT or Markdown · up to {RAG_CONFIG.maxFileBytes / 1024 / 1024} MB each</p>
      <input
        ref={input}
        type="file"
        multiple
        accept={[...RAG_CONFIG.acceptedExtensions, "application/pdf", "text/plain", "text/markdown"].join(",")}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
