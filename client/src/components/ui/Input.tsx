import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, id, className = "", required, ...rest }, ref) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-ink)]">
        {label}
        {required && (
          <span className="text-[var(--color-danger)]" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        ref={ref}
        required={required}
        className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/10 ${
          error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
