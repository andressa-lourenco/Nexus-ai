import { FileText, FileType2, Hash } from "lucide-react";
import type { DocumentKind } from "@/lib/rag/types";
import { cn } from "@/lib/client/format";

const MAP = {
  pdf: { icon: FileText, label: "PDF", className: "from-pink-500/25 to-pink-600/5 text-pink-200 ring-pink-300/25" },
  markdown: { icon: Hash, label: "MD", className: "from-fuchsia-500/25 to-fuchsia-700/5 text-fuchsia-200 ring-fuchsia-300/25" },
  text: { icon: FileType2, label: "TXT", className: "from-violet-500/30 to-violet-700/5 text-violet-200 ring-violet-300/25" },
} as const;

export function kindLabel(kind: DocumentKind): string {
  return MAP[kind].label;
}

export function DocIcon({ kind, className }: { kind: DocumentKind; className?: string }) {
  const { icon: Icon, className: tone } = MAP[kind];
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b ring-1 ring-inset", tone, className)}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
  );
}
