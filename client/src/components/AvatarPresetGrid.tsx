const PRESET_COUNT = 8;
// Absolute URL: updateProfileSchema requires avatarUrl to be a full URL, and the client's own
// origin is stable per deployment, so this resolves the same way in dev and in production.
const presetUrl = (n: number) => `${window.location.origin}/avatars/preset-${n}.svg`;

export function AvatarPresetGrid({ value, onSelect }: { value: string | null; onSelect: (url: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: PRESET_COUNT }, (_, i) => i + 1).map((n) => {
        const url = presetUrl(n);
        const isSelected = value === url;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(url)}
            aria-label={`Preset avatar ${n}`}
            aria-pressed={isSelected}
            className={`aspect-square overflow-hidden rounded-full transition-all ${
              isSelected ? "ring-2 ring-[var(--color-navy)] ring-offset-2" : "hover:opacity-80"
            }`}
          >
            <img src={url} alt="" className="h-full w-full" />
          </button>
        );
      })}
    </div>
  );
}
