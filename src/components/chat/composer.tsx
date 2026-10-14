"use client";

import { ArrowUp, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@/components/providers/chat-provider";
import { RAG_CONFIG } from "@/lib/rag/config";

export function Composer({ disabled, placeholder }: { disabled: boolean; placeholder: string }) {
  const { ask, stop, busy } = useChat();
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  const submit = () => {
    if (!value.trim() || busy || disabled) return;
    void ask(value);
    setValue("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      data-disabled={disabled}
      className="orbit-border flex items-end gap-2 rounded-2xl bg-ink-900/90 p-2 pl-4 shadow-[0_20px_60px_-20px_rgb(8_3_18/0.9)] backdrop-blur-xl transition focus-within:shadow-[0_24px_64px_-20px_rgb(157_78_221/0.55)]"
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        maxLength={RAG_CONFIG.maxQuestionChars}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label="Your question"
        className="max-h-[180px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-[14.5px] text-mist-50 placeholder:text-mist-500 focus:outline-none disabled:cursor-not-allowed"
      />
      {busy ? (
        <button type="button" onClick={stop} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-200/10 bg-violet-200/[0.06] text-mist-50 transition hover:bg-violet-200/10" aria-label="Stop generating">
          <Square className="h-3.5 w-3.5 fill-current" />
        </button>
      ) : (
        <button type="submit" disabled={disabled || !value.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#b57bff_0%,#9d4edd_50%,#68418b_100%)] text-white shadow-[0_8px_22px_-6px_rgb(157_78_221/0.9),inset_0_1px_0_rgb(255_255_255/0.25)] transition hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:shadow-none" aria-label="Send question">
          <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
        </button>
      )}
    </form>
  );
}
