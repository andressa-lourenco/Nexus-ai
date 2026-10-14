"use client";

import { ArrowRight, Upload } from "lucide-react";
import Link from "next/link";
import { DocIcon } from "@/components/common/doc-icon";
import { useLibrary } from "@/components/providers/library-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { formatRelativeTime, plural } from "@/lib/client/format";

export function RecentDocuments() {
  const { summaries, loading } = useLibrary();
  const recent = summaries.slice(0, 5);
  return (
    <Card className="flex flex-col p-6 animate-fade-up [animation-delay:220ms]">
      <SectionHeading
        eyebrow="Library"
        title="Recent documents"
        action={summaries.length > 0 && (
          <Link href="/documents" className="flex items-center gap-1 text-xs font-semibold text-violet-300 transition hover:text-violet-200">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      />
      {loading ? (
        <div className="mt-5 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : recent.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="Your library is empty"
          description="Upload a PDF, Markdown or text file. NEXUS will extract, chunk and embed it so you can ask questions with cited answers."
          action={<Link href="/documents" className={buttonStyles()}><Upload className="h-4 w-4" /> Add your first document</Link>}
          className="py-8"
        />
      ) : (
        <ul className="mt-4 divide-y divide-violet-200/[0.05]">
          {recent.map((doc) => (
            <li key={doc.id}>
              <Link href={`/documents?doc=${doc.id}`} className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-violet-200/[0.03]">
                <DocIcon kind={doc.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-mist-50">{doc.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-mist-500">
                    {plural(doc.chunkCount, "chunk")}{doc.pageCount ? ` · ${plural(doc.pageCount, "page")}` : ""} · {formatRelativeTime(doc.createdAt)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-mist-500 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
