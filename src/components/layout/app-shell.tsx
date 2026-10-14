"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLibrary } from "@/components/providers/library-provider";
import { cn, formatNumber } from "@/lib/client/format";
import { EngineStatusCard, StatusDot, useEngineTone } from "./engine-status";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_-10%,#2c1450_0%,#1d1033_45%,#160d26_75%)]" />
      <div className="grid-backdrop absolute inset-0" />
      <div className="absolute -top-48 right-[-8%] h-[560px] w-[560px] rounded-full bg-violet-500/25 blur-[130px] animate-float" />
      <div className="absolute top-1/3 -left-48 h-[460px] w-[460px] rounded-full bg-purple-700/20 blur-[130px] animate-float [animation-delay:-4s]" />
      <div className="absolute bottom-[-25%] right-1/4 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[130px]" />
      <div className="hairline absolute inset-x-0 top-0 h-px" />
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { totals } = useLibrary();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-violet-200/[0.08] bg-[linear-gradient(180deg,rgb(33_19_53/0.78),rgb(22_13_38/0.7))] px-4 py-6 backdrop-blur-2xl lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav className="mt-10 space-y-1" aria-label="Main">
        <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300/60">Workspace</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-gradient-to-r from-violet-500/25 via-violet-500/[0.08] to-transparent text-mist-50 shadow-[inset_0_0_0_1px_rgb(196_161_255/0.14)]" : "text-mist-400 hover:bg-violet-200/[0.05] hover:text-mist-50",
              )}
            >
              <span className={cn("absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-200 to-violet-500 shadow-[0_0_12px_rgb(157_78_221/0.9)] transition-all", active ? "opacity-100" : "opacity-0")} />
              <Icon className={cn("h-[18px] w-[18px] transition", active ? "text-violet-200 drop-shadow-[0_0_6px_rgb(196_161_255/0.6)]" : "text-mist-500 group-hover:text-mist-200")} strokeWidth={1.75} />
              {label}
              {href === "/documents" && totals.documents > 0 && (
                <span className="ml-auto rounded-md bg-violet-300/10 px-1.5 py-0.5 font-mono text-[10px] text-mist-400">{formatNumber(totals.documents)}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <EngineStatusCard />
      </div>
    </aside>
  );
}

function MobileHeader() {
  const { tone, label } = useEngineTone();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-violet-200/[0.08] bg-ink-950/75 px-4 py-3 backdrop-blur-2xl lg:hidden">
      <Logo />
      <span className="flex items-center gap-2 rounded-full border border-violet-200/15 bg-violet-200/[0.04] px-3 py-1 text-[11px] font-medium text-mist-400">
        <StatusDot tone={tone} /> {label}
      </span>
    </header>
  );
}

function MobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1 rounded-2xl border border-violet-200/12 bg-ink-900/95 p-1.5 shadow-[0_-8px_40px_-12px_rgb(8_3_18/0.9),0_0_0_1px_rgb(247_242_252/0.02)_inset] backdrop-blur-2xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition duration-300",
                active ? "bg-gradient-to-b from-violet-500/30 to-support/25 text-mist-50 shadow-[inset_0_0_0_1px_rgb(196_161_255/0.22),0_0_20px_-8px_rgb(157_78_221/0.9)]" : "text-mist-400 active:bg-violet-200/[0.06]",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-violet-200")} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-mist-50 focus:ring-2 focus:ring-violet-300">Skip to content</a>
      <Backdrop />
      <Sidebar />
      <div className="lg:pl-64">
        <MobileHeader />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
