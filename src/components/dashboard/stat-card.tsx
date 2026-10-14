import type { LucideIcon } from "lucide-react";
import { Card, IconTile, type Tone } from "@/components/ui/primitives";

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
  delay = 0,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: Tone;
  delay?: number;
  loading?: boolean;
}) {
  return (
    <Card className="surface-hover group relative overflow-hidden p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/15 blur-2xl transition duration-500 group-hover:bg-violet-500/30" />
      <div className="hairline pointer-events-none absolute inset-x-6 top-0 h-px opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-mist-400">{label}</span>
        <IconTile icon={icon} tone={tone} className="h-8 w-8 rounded-lg [&_svg]:h-4 [&_svg]:w-4" />
      </div>
      {loading ? <div className="skeleton mt-4 h-8 w-20" /> : <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-mist-50 tabular-nums">{value}</p>}
      <p className="mt-1 text-xs text-mist-500">{hint}</p>
    </Card>
  );
}
