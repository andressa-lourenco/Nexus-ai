"use client";

import { Database, FileStack, HardDrive, Layers, MessagesSquare, ShieldCheck, Type } from "lucide-react";
import Link from "next/link";
import { PipelineCard } from "@/components/dashboard/pipeline-card";
import { QuickAsk } from "@/components/dashboard/quick-ask";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConfigBanner } from "@/components/layout/config-banner";
import { useChat } from "@/components/providers/chat-provider";
import { useLibrary } from "@/components/providers/library-provider";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { formatBytes, formatNumber } from "@/lib/client/format";

export default function DashboardPage() {
  const { totals, loading, health } = useLibrary();
  const { messages } = useChat();
  const aiReady = health.status === "ready" && health.data.configured;
  const questions = messages.filter((m) => m.role === "user").length;

  return (
    <>
      <ConfigBanner />
      <section className="relative mb-10 animate-fade-up">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-violet-200 shadow-[0_0_24px_-8px_rgb(157_78_221/0.8)] backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_rgb(196_161_255)]" /> Intelligent Document Assistant
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-mist-50 sm:text-5xl lg:text-6xl">
          Your documents, <span className="text-gradient">instantly answerable.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mist-400">
          Ask questions in natural language and get answers grounded in your own files — every claim linked to the exact passage it came from.
        </p>
        <QuickAsk disabled={totals.documents === 0 || !aiReady} />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Library summary">
        <StatCard icon={FileStack} label="Documents" value={formatNumber(totals.documents)} hint={totals.pages ? `${formatNumber(totals.pages)} pages total` : "PDF, TXT, Markdown"} loading={loading} delay={40} />
        <StatCard icon={Layers} label="Indexed chunks" value={formatNumber(totals.chunks)} hint="searchable vectors" tone="fuchsia" loading={loading} delay={80} />
        <StatCard icon={Type} label="Words" value={formatNumber(totals.words)} hint="extracted text" tone="plum" loading={loading} delay={120} />
        <StatCard icon={HardDrive} label="Source size" value={formatBytes(totals.bytes)} hint="stored locally" tone="lilac" loading={loading} delay={160} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <PipelineCard />
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-6 animate-fade-up [animation-delay:260ms]">
              <SectionHeading eyebrow="Session" title="Conversation" />
              <p className="mt-4 font-display text-3xl font-semibold text-mist-50 tabular-nums">{questions}</p>
              <p className="text-xs text-mist-500">questions asked this session</p>
              <Link href="/chat" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-violet-300 transition hover:text-violet-200">
                <MessagesSquare className="h-3.5 w-3.5" /> Open assistant
              </Link>
            </Card>
            <Card className="p-6 animate-fade-up [animation-delay:300ms]">
              <SectionHeading eyebrow="Privacy" title="Where your data lives" />
              <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-mist-400">
                <li className="flex gap-2"><Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" /> Vectors are stored in your browser (IndexedDB).</li>
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" /> API keys stay on the server, never in the client.</li>
              </ul>
            </Card>
          </div>
        </div>
        <div className="lg:col-span-2">
          <RecentDocuments />
        </div>
      </div>
    </>
  );
}
