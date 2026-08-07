export function OrgAvatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const dimensions = { sm: "h-8 w-8 text-sm", md: "h-11 w-11 text-base", lg: "h-14 w-14 text-lg" }[size];

  if (imageUrl) {
    // Org logos are usually wordmarks or non-square graphics, not headshots, so they get
    // cropped to fill a circle (object-cover) rather than shown whole. A rounded box with
    // object-contain shows the entire logo instead, letterboxed if it isn't square.
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 ring-1 ring-inset ring-black/5 ${dimensions}`}
      >
        <img src={imageUrl} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)]/10 font-bold text-[var(--color-navy)] ${dimensions}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
