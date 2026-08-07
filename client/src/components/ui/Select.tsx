import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, id, className = "", required, children, ...rest }, ref) => {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-ink)]">
        {label}
        {required && (
          <span className="text-[var(--color-danger)]" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <select
        id={selectId}
        ref={ref}
        required={required}
        className={`rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/10 ${
          error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = "Select";
