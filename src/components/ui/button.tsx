import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/client/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#b98cf5_0%,#9d4edd_50%,#68418b_100%)] text-white shadow-[0_10px_28px_-10px_rgb(157_78_221/0.85),inset_0_1px_0_rgb(255_255_255/0.25)] hover:brightness-110 hover:shadow-[0_14px_36px_-10px_rgb(157_78_221/1),inset_0_1px_0_rgb(255_255_255/0.3)]",
  secondary: "border border-violet-200/15 bg-violet-200/[0.05] text-mist-50 hover:border-violet-300/40 hover:bg-violet-300/[0.09] hover:shadow-[0_0_24px_-10px_rgb(196_161_255/0.6)]",
  ghost: "text-mist-400 hover:bg-violet-200/[0.06] hover:text-mist-50",
  danger: "border border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  icon: "h-9 w-9 rounded-xl",
};

export function buttonStyles({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-semibold transition duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonStyles({ variant, size, className })} {...props} />;
});
