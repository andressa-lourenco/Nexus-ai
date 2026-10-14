"use client";

import { BookOpen, FileUp, ListChecks, MessagesSquare, Sparkles, Trash2, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ConfigBanner } from "@/components/layout/config-banner";
import { useChat } from "@/components/providers/chat-provider";
import { useLibrary } from "@/components/providers/library-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/primitives";
import { Composer } from "./composer";
import { AssistantMessage, UserMessage } from "./message";

function Suggestions({ latestDoc }: { latestDoc?: string }) {
  const { ask } = useChat();
  const prompts = [
    { icon: BookOpen, text: latestDoc ? `Summarize the key points of “${latestDoc}”` : "Summarize the key points of my documents" },
    { icon: ListChecks, text: "What are the main conclusions or recommendations?" },
    { icon: Lightbulb, text: "Which important numbers, dates or deadlines are mentioned?" },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {prompts.map(({ icon: Icon, text }, i) => (
        <button
          key={text}
          onClick={() => ask(text)}
          className="surface surface-hover group flex flex-col items-start gap-3 p-4 text-left text-[13px] leading-snug text-mist-200 animate-fade-up"
          style={{ animationDelay: `${120 + i * 60}ms` }}
        >
          <Icon className="h-4 w-4 text-violet-300 transition group-hover:scale-110" strokeWidth={1.75} />
          {text}
        </button>
      ))}
    </div>
  );
}

export function ChatView() {
  const { messages, clear, busy } = useChat();
  const { summaries, loading, health, totals } = useLibrary();
  const bottom = useRef<HTMLDivElement>(null);
  const aiReady = health.status === "ready" && health.data.configured;
  const hasDocs = summaries.length > 0;
  const last = messages[messages.length - 1];

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, last?.content.length, last?.status]);

  const placeholder = !aiReady ? "AI provider not configured" : !hasDocs ? "Add a document to start" : `Ask about ${totals.documents} document${totals.documents === 1 ? "" : "s"}…`;

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col lg:min-h-[calc(100dvh-5rem)]">
      <ConfigBanner />
      <header className="mb-6 flex items-center justify-between gap-4 animate-fade-up">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-violet-300/80">Grounded Q&amp;A</p>
          <h1 className="text-2xl font-semibold tracking-tight text-mist-50 sm:text-3xl">
            Ask your <span className="text-gradient">documents</span>
          </h1>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} disabled={busy}>
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </header>

      <div className="flex-1">
        {loading ? (
          <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : !hasDocs ? (
          <Card>
            <EmptyState
              icon={MessagesSquare}
              title="Nothing to search yet"
              description="The assistant only answers from your own documents. Add at least one file to your library first."
              action={<Link href="/documents" className={buttonStyles()}><FileUp className="h-4 w-4" /> Add documents</Link>}
            />
          </Card>
        ) : messages.length === 0 ? (
          <div className="mx-auto max-w-3xl pt-6 sm:pt-12">
            <div className="mb-8 text-center animate-fade-up">
              <span className="relative mx-auto mb-5 grid h-14 w-14 place-items-center">
                <span className="absolute -inset-3 rounded-3xl bg-violet-500/30 blur-2xl" />
                <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-[linear-gradient(140deg,#c4a1ff_0%,#9d4edd_50%,#68418b_100%)] text-white animate-pulse-glow"><Sparkles className="h-6 w-6" strokeWidth={1.5} /></span>
              </span>
              <h2 className="text-xl font-semibold text-mist-50">What would you like to know?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-mist-400">
                Answers are generated only from the {totals.chunks} indexed chunks in your library, with citations you can inspect.
              </p>
            </div>
            {aiReady && <Suggestions latestDoc={summaries[0]?.name} />}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-8 pb-4" aria-live="polite">
            {messages.map((m, i) => (m.role === "user" ? <UserMessage key={m.id} message={m} /> : <AssistantMessage key={m.id} message={m} isLast={i === messages.length - 1} />))}
          </div>
        )}
        <div ref={bottom} />
      </div>

      <div className="sticky bottom-[88px] z-20 mx-auto mt-6 w-full max-w-3xl pb-2 lg:bottom-6">
        <Composer disabled={!aiReady || !hasDocs || loading} placeholder={placeholder} />
        <p className="mt-2 text-center text-[11px] text-mist-500">Answers cite retrieved passages. Verify important information in the source.</p>
      </div>
    </div>
  );
}
