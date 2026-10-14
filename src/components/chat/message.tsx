"use client";

import { Check, CircleAlert, Copy, RotateCcw, SearchX, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useChat, type ChatMessage } from "@/components/providers/chat-provider";
import { Spinner } from "@/components/ui/primitives";
import { cn, formatNumber } from "@/lib/client/format";
import { extractCitations } from "@/lib/rag/prompt";
import { Markdown } from "./markdown";
import { SourceCard } from "./source-card";

function Avatar() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[linear-gradient(140deg,#c4a1ff_0%,#9d4edd_50%,#68418b_100%)] text-white shadow-[0_0_22px_-4px_rgb(157_78_221/0.9),inset_0_1px_0_rgb(255_255_255/0.3)]">
      <Sparkles className="h-4 w-4" strokeWidth={1.75} />
    </span>
  );
}

function Progress({ message }: { message: ChatMessage }) {
  const steps = [
    { key: "retrieving", label: `Searching ${formatNumber(message.searchedChunks ?? 0)} chunks` },
    { key: "generating", label: `Composing answer from ${message.sources?.length ?? 0} sources` },
  ];
  const current = message.status === "retrieving" ? 0 : 1;
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={s.key} className={cn("flex items-center gap-2.5 text-[13px] transition", i <= current ? "text-mist-200" : "text-mist-500")}>
          {i < current ? <Check className="h-4 w-4 text-emerald-300" /> : i === current ? <Spinner /> : <span className="h-4 w-4 rounded-full border border-violet-200/15" />}
          {s.label}
        </li>
      ))}
    </ol>
  );
}

export function AssistantMessage({ message, isLast }: { message: ChatMessage; isLast: boolean }) {
  const { ask, busy } = useChat();
  const [active, setActive] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const sources = useMemo(() => message.sources ?? [], [message.sources]);
  const cited = useMemo(() => new Set(extractCitations(message.content, sources.length)), [message.content, sources.length]);
  const streaming = message.status === "generating";
  const waiting = message.status === "retrieving" || (streaming && !message.content);

  const select = (n: number) => {
    const next = active === n ? null : n;
    setActive(next);
    const src = sources.find((s) => s.n === n);
    if (next != null && src) requestAnimationFrame(() => document.getElementById(`source-${src.documentId}-${src.chunkIndex}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  return (
    <div className="flex gap-3 animate-fade-up sm:gap-4">
      <Avatar />
      <div className="min-w-0 flex-1 pt-0.5">
        {waiting && <Progress message={message} />}

        {message.status === "no_results" && (
          <div className="flex gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.05] p-4 text-[13.5px] leading-relaxed text-amber-100/90">
            <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            {message.content}
          </div>
        )}

        {message.content && message.status !== "no_results" && (
          <div className={cn(streaming && "[&>div>*:last-child]:after:ml-0.5 [&>div>*:last-child]:after:inline-block [&>div>*:last-child]:after:h-4 [&>div>*:last-child]:after:w-[2px] [&>div>*:last-child]:after:translate-y-0.5 [&>div>*:last-child]:after:animate-blink [&>div>*:last-child]:after:bg-violet-300 [&>div>*:last-child]:after:content-['']")}>
            <Markdown
              text={message.content}
              renderCitation={(n, key) =>
                n >= 1 && n <= sources.length ? (
                  <button
                    key={key}
                    onClick={() => select(n)}
                    className={cn("mx-0.5 inline-grid h-[18px] min-w-[18px] -translate-y-px place-items-center rounded-md px-1 align-middle font-mono text-[10.5px] font-semibold transition", active === n ? "bg-violet-300 text-ink-950 shadow-[0_0_12px_rgb(196_161_255/0.8)]" : "bg-violet-500/25 text-violet-100 ring-1 ring-inset ring-violet-300/25 hover:bg-violet-500/40")}
                    aria-label={`Show source ${n}`}
                  >
                    {n}
                  </button>
                ) : null
              }
            />
          </div>
        )}

        {message.status === "error" && (
          <div role="alert" className="mt-2 flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] p-4 sm:flex-row sm:items-center">
            <CircleAlert className="h-4 w-4 shrink-0 text-rose-300" />
            <p className="flex-1 text-[13px] text-rose-100/90">{message.error}</p>
            {isLast && message.question && (
              <button disabled={busy} onClick={() => ask(message.question!)} className="inline-flex items-center gap-1.5 self-start rounded-lg border border-violet-200/10 px-2.5 py-1.5 text-xs font-semibold text-mist-50 transition hover:bg-violet-200/5 disabled:opacity-40">
                <RotateCcw className="h-3.5 w-3.5" /> Retry
              </button>
            )}
          </div>
        )}
        {message.status === "stopped" && <p className="mt-2 font-mono text-[11px] text-mist-500">Generation stopped.</p>}

        {sources.length > 0 && message.status !== "retrieving" && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist-500">
                Sources · {cited.size || sources.length} {cited.size ? "cited" : "retrieved"}
              </p>
              {message.status === "done" && (
                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(message.content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-mist-500 transition hover:bg-violet-200/5 hover:text-mist-200"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {sources
                .filter((s) => streaming || cited.size === 0 || cited.has(s.n) || active === s.n)
                .map((s) => (
                  <SourceCard key={s.n} source={s} cited={cited.size === 0 || cited.has(s.n)} active={active === s.n} onSelect={() => select(s.n)} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end animate-fade-up">
      <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-violet-300/25 bg-[linear-gradient(135deg,rgb(157_78_221/0.35),rgb(108_39_168/0.22))] px-4 py-2.5 shadow-[0_12px_32px_-16px_rgb(157_78_221/0.7)] backdrop-blur-xl text-[14.5px] leading-relaxed text-mist-50 sm:max-w-[75%]">
        {message.content}
      </p>
    </div>
  );
}
