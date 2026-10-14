"use client";

import { KeyRound } from "lucide-react";
import { useLibrary } from "@/components/providers/library-provider";
import { Alert } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

/** Explains, without faking anything, why AI features are unavailable. */
export function ConfigBanner() {
  const { health, storageError, refreshHealth } = useLibrary();
  return (
    <div className="mb-6 space-y-3 empty:hidden">
      {health.status === "ready" && !health.data.configured && (
        <Alert
          tone="warning"
          title="AI provider not configured"
          action={<Button size="sm" variant="secondary" onClick={refreshHealth}><KeyRound className="h-3.5 w-3.5" /> Recheck</Button>}
        >
          Add <code className="rounded bg-black/30 px-1 font-mono text-[12px]">GEMINI_API_KEY</code> (or <code className="rounded bg-black/30 px-1 font-mono text-[12px]">OPENAI_API_KEY</code>) to <code className="rounded bg-black/30 px-1 font-mono text-[12px]">.env.local</code> and restart the server. Indexing and answering are disabled until then.
        </Alert>
      )}
      {health.status === "error" && (
        <Alert tone="error" title="Cannot reach the server" action={<Button size="sm" variant="secondary" onClick={refreshHealth}>Retry</Button>}>
          {health.message}
        </Alert>
      )}
      {storageError && (
        <Alert tone="error" title="Local storage unavailable">
          {storageError} Your browser may be in a private mode that blocks IndexedDB.
        </Alert>
      )}
    </div>
  );
}
