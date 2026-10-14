"use client";

import { Cpu, RefreshCw } from "lucide-react";
import { useLibrary } from "@/components/providers/library-provider";
import { cn } from "@/lib/client/format";

export function StatusDot({ tone }: { tone: "ok" | "warn" | "error" | "loading" }) {
  const colors = { ok: "bg-emerald-400", warn: "bg-amber-400", error: "bg-rose-400", loading: "bg-mist-500" } as const;
  return (
    <span className="relative flex h-2 w-2">
      {tone === "ok" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", colors[tone])} />
    </span>
  );
}

export function useEngineTone() {
  const { health } = useLibrary();
  if (health.status === "loading") return { tone: "loading" as const, label: "Checking…" };
  if (health.status === "error") return { tone: "error" as const, label: "Unreachable" };
  return health.data.configured ? { tone: "ok" as const, label: "Online" } : { tone: "warn" as const, label: "Not configured" };
}

export function EngineStatusCard() {
  const { health, refreshHealth } = useLibrary();
  const { tone, label } = useEngineTone();
  return (
    <div className="rounded-2xl border border-violet-200/10 bg-[linear-gradient(160deg,rgb(157_78_221/0.12),rgb(33_19_53/0.4))] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold text-mist-50">
          <Cpu className="h-3.5 w-3.5 text-violet-300" strokeWidth={1.75} /> AI engine
        </span>
        <button onClick={refreshHealth} className="rounded-md p-1 text-mist-500 transition hover:bg-violet-200/5 hover:text-mist-200" aria-label="Recheck AI engine status">
          <RefreshCw className={cn("h-3 w-3", health.status === "loading" && "animate-spin")} />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-mist-400">
        <StatusDot tone={tone} /> {label}
      </div>
      {health.status === "ready" && (
        <dl className="mt-3 space-y-1.5 font-mono text-[10.5px] text-mist-500">
          {health.data.provider && (
            <div className="flex justify-between gap-2"><dt>Provider</dt><dd className="truncate text-mist-400 capitalize">{health.data.provider}</dd></div>
          )}
          <div className="flex justify-between gap-2"><dt>LLM</dt><dd className="truncate text-mist-400">{health.data.chatModel}</dd></div>
          <div className="flex justify-between gap-2"><dt>Embed</dt><dd className="truncate text-mist-400">{health.data.embeddingModel}</dd></div>
        </dl>
      )}
    </div>
  );
}
