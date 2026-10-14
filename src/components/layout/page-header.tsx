import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-5 animate-fade-up sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-violet-300/80">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-mist-50 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
