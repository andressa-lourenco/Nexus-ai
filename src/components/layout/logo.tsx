import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="NEXUS AI home">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(140deg,#c4a1ff_0%,#9d4edd_45%,#68418b_100%)] shadow-[0_0_26px_-6px_rgb(157_78_221/0.9),inset_0_1px_0_rgb(255_255_255/0.35)] transition duration-300 group-hover:shadow-[0_0_34px_-4px_rgb(157_78_221/1),inset_0_1px_0_rgb(255_255_255/0.4)]">
        <span className="absolute inset-[1px] rounded-[11px] bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.25),transparent_55%)]" />
        <svg viewBox="0 0 64 64" className="relative h-5 w-5" aria-hidden>
          <path d="M16 48V16l32 32V16" fill="none" stroke="#fbf7ff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[15px] font-bold tracking-[0.24em] text-mist-50">NEXUS</span>
          <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.24em] text-violet-300/80">Document AI</span>
        </span>
      )}
    </Link>
  );
}
