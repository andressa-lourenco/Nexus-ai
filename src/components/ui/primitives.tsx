import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/client/format";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("surface", className)} {...props} />;
}

export type Tone = "violet" | "lilac" | "fuchsia" | "plum" | "emerald" | "amber" | "rose";

export function IconTile({ icon: Icon, className, tone = "violet" }: { icon: LucideIcon; className?: string; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    violet: "from-violet-500/35 to-violet-700/10 text-violet-200 ring-violet-300/25 shadow-[0_0_20px_-8px_rgb(157_78_221/0.8)]",
    lilac: "from-violet-300/30 to-violet-400/5 text-violet-100 ring-violet-200/25 shadow-[0_0_20px_-8px_rgb(196_161_255/0.7)]",
    fuchsia: "from-fuchsia-500/30 to-fuchsia-700/5 text-fuchsia-200 ring-fuchsia-300/25 shadow-[0_0_20px_-8px_rgb(217_70_239/0.6)]",
    plum: "from-purple-500/30 to-purple-800/5 text-purple-200 ring-purple-300/25 shadow-[0_0_20px_-8px_rgb(168_85_247/0.6)]",
    emerald: "from-emerald-500/25 to-emerald-500/5 text-emerald-300 ring-emerald-400/20",
    amber: "from-amber-500/25 to-amber-500/5 text-amber-300 ring-amber-400/20",
    rose: "from-rose-500/25 to-rose-500/5 text-rose-300 ring-rose-400/20",
  };
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b ring-1 ring-inset", tones[tone], className)}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "violet" | "emerald" | "amber" | "rose"; className?: string }) {
  const tones = {
    neutral: "border-violet-200/10 bg-violet-200/[0.04] text-mist-400",
    violet: "border-violet-300/30 bg-violet-500/15 text-violet-100",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    rose: "border-rose-400/25 bg-rose-500/10 text-rose-200",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-300/25 border-t-violet-300", className)}
    />
  );
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-violet-300/80">
            <span className="h-px w-4 bg-gradient-to-r from-violet-400 to-transparent" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-base font-semibold text-mist-50">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center animate-fade-up", className)}>
      <div className="relative mb-5">
        <div className="absolute -inset-2 rounded-3xl bg-violet-500/30 blur-2xl" />
        <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-violet-300/30 bg-gradient-to-b from-ink-700 to-ink-850 text-violet-200 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
      </div>
      <h3 className="text-lg font-semibold text-mist-50">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "error",
  title,
  children,
  action,
  className,
}: {
  tone?: "error" | "warning" | "info";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const tones = {
    error: "border-rose-400/25 bg-rose-500/[0.08] text-rose-100",
    warning: "border-amber-300/25 bg-amber-400/[0.07] text-amber-50",
    info: "border-violet-300/25 bg-violet-500/[0.08] text-violet-50",
  } as const;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-xl sm:flex-row sm:items-center", tones[tone], className)}>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 text-[13px] leading-relaxed opacity-80">{children}</div>}
      </div>
      {action}
    </div>
  );
}
