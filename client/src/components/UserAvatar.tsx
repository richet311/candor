import { useState } from "react";

export function UserAvatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const dimensions = { sm: "h-8 w-8 text-sm", md: "h-11 w-11 text-base", lg: "h-16 w-16 text-xl" }[size];

  if (imageUrl && imageUrl !== failedUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setFailedUrl(imageUrl)}
        className={`shrink-0 rounded-full object-cover ${dimensions}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 font-bold text-[var(--color-accent-dark)] ${dimensions}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
