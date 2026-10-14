"use client";

import { Binary, MessageSquareQuote, ScanText, Scissors, Search } from "lucide-react";
import { useLibrary } from "@/components/providers/library-provider";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { RAG_CONFIG } from "@/lib/rag/config";

export function PipelineCard() {
  const { health } = useLibrary();
  const models = health.status === "ready" ? health.data : null;
  const steps = [
    { icon: ScanText, title: "Extract", detail: "PDF per page · TXT · MD" },
    { icon: Scissors, title: "Chunk", detail: `${RAG_CONFIG.chunkSize} chars · ${RAG_CONFIG.chunkOverlap} overlap` },
    { icon: Binary, title: "Embed", detail: models ? `${models.embeddingModel} · ${models.dimensions}d` : "embedding model" },
    { icon: Search, title: "Retrieve", detail: `cosine · top ${RAG_CONFIG.topK} · ≥ ${RAG_CONFIG.minScore}` },
    { icon: MessageSquareQuote, title: "Generate", detail: models ? `${models.chatModel} · cited` : "grounded LLM" },
  ];
  return (
    <Card className="p-6 animate-fade-up [animation-delay:160ms]">
      <SectionHeading eyebrow="Architecture" title="Retrieval-Augmented Generation pipeline" />
      <ol className="mt-6 grid gap-3 sm:grid-cols-5">
        {steps.map(({ icon: Icon, title, detail }, i) => (
          <li key={title} className="group relative">
            {i < steps.length - 1 && (
              <span aria-hidden className="absolute left-[calc(50%+28px)] right-[calc(-50%+28px)] top-6 hidden h-px overflow-hidden bg-violet-200/[0.06] sm:block">
                <span className="block h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-violet-300 to-transparent bg-[length:200%_100%]" style={{ animationDelay: `${i * 0.3}s` }} />
              </span>
            )}
            <div className="flex items-center gap-3 sm:flex-col sm:text-center">
              <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-300/20 bg-gradient-to-b from-ink-700 to-ink-850 text-violet-200 shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_0_20px_-10px_rgb(157_78_221/0.8)] transition duration-300 group-hover:-translate-y-1 group-hover:border-violet-300/50 group-hover:shadow-[0_12px_32px_-10px_rgb(157_78_221/0.9)]">
                <Icon className="h-5 w-5" strokeWidth={1.6} />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-violet-500 font-mono text-[9px] font-semibold text-white shadow-[0_0_10px_rgb(157_78_221/0.8)]">{i + 1}</span>
              </span>
              <div>
                <p className="text-sm font-semibold text-mist-50">{title}</p>
                <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-mist-500">{detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
