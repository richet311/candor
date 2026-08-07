import type { HTMLAttributes } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-paper-raised)] shadow-[0_1px_2px_rgba(18,32,58,0.04),0_12px_28px_-10px_rgba(18,32,58,0.12)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`border-b border-[var(--color-border)]/60 px-6 py-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}
