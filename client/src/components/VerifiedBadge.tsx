import { Badge } from "./ui/Badge";

export function VerifiedCheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M10 1.5l2.163 1.4 2.573-.2 1.014 2.36 2.36 1.014-.2 2.573 1.4 2.163-1.4 2.163.2 2.573-2.36 1.014-1.014 2.36-2.573-.2L10 18.5l-2.163-1.4-2.573.2-1.014-2.36-2.36-1.014.2-2.573L.69 10l1.4-2.163-.2-2.573 2.36-1.014L5.264 1.9l2.573.2L10 1.5zm3.03 6.53a.75.75 0 00-1.06-1.06L9 9.94 7.03 7.97a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l3.5-3.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function VerifiedBadge() {
  return (
    <Badge tone="success">
      <VerifiedCheckIcon />
      Verified nonprofit
    </Badge>
  );
}
