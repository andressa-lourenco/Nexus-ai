"use client";

import { ClipboardPaste } from "lucide-react";
import { useState } from "react";
import { useLibrary } from "@/components/providers/library-provider";
import { Button } from "@/components/ui/button";
import { Alert, Spinner } from "@/components/ui/primitives";
import { RAG_CONFIG } from "@/lib/rag/config";

export function PasteTextForm({ disabled, onDone }: { disabled?: boolean; onDone?: (id: string) => void }) {
  const { addText } = useLibrary();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState<{ status: "idle" | "saving" } | { status: "error"; message: string }>({ status: "idle" });
  const saving = state.status === "saving";

  return (
    <form
      className="flex min-h-[220px] flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ status: "saving" });
        try {
          const doc = await addText(title.trim(), text);
          setTitle("");
          setText("");
          setState({ status: "idle" });
          onDone?.(doc.id);
        } catch (error) {
          setState({ status: "error", message: (error as Error).message });
        }
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        maxLength={160}
        disabled={disabled || saving}
        aria-label="Document title"
        className="h-10 rounded-xl field px-3.5 text-sm text-mist-50 placeholder:text-mist-500 focus:outline-none"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste meeting notes, an article, a policy…"
        maxLength={RAG_CONFIG.maxPastedChars}
        disabled={disabled || saving}
        aria-label="Document text"
        rows={6}
        className="min-h-[140px] flex-1 resize-y rounded-xl field p-3.5 text-sm leading-relaxed text-mist-50 placeholder:text-mist-500 focus:outline-none"
      />
      {state.status === "error" && <Alert title="Could not index text">{state.message}</Alert>}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-mist-500">{text.length.toLocaleString("en-US")} / {RAG_CONFIG.maxPastedChars.toLocaleString("en-US")}</span>
        <Button type="submit" disabled={disabled || saving || !text.trim()}>
          {saving ? <><Spinner className="border-violet-200/30 border-t-white" /> Indexing…</> : <><ClipboardPaste className="h-4 w-4" /> Index text</>}
        </Button>
      </div>
    </form>
  );
}
