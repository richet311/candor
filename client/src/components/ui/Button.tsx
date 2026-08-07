import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-[var(--color-navy)] text-white shadow-sm hover:bg-[var(--color-navy-dark)] hover:shadow-md",
  secondary: "bg-[var(--color-accent)] text-white shadow-sm hover:bg-[var(--color-accent-dark)] hover:shadow-md",
  ghost: "bg-transparent text-[var(--color-navy)] border border-[var(--color-border)] hover:bg-black/5",
  danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
};

export function Button({ variant = "primary", isLoading, disabled, className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}
