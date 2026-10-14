"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useChat } from "@/components/providers/chat-provider";
import { Button } from "@/components/ui/button";

export function QuickAsk({ disabled }: { disabled: boolean }) {
  const [value, setValue] = useState("");
  const { ask } = useChat();
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        void ask(value);
        router.push("/chat");
      }}
      data-disabled={disabled}
      className="orbit-border group mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-ink-900/85 p-1.5 pl-4 shadow-[0_24px_60px_-22px_rgb(157_78_221/0.7)] backdrop-blur-xl transition"
    >
      <Sparkles className="h-4 w-4 shrink-0 text-violet-300" strokeWidth={1.75} />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "Add a document to start asking questions" : "Ask anything about your documents…"}
        aria-label="Ask a question"
        className="min-w-0 flex-1 bg-transparent py-2 text-sm text-mist-50 placeholder:text-mist-500 focus:outline-none disabled:cursor-not-allowed"
      />
      <Button type="submit" size="md" disabled={disabled || !value.trim()} aria-label="Ask">
        Ask <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
