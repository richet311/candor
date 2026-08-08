import { useState } from "react";
import { Button } from "./ui/Button";
import { ImageUploadField } from "./ui/ImageUploadField";
import { useAuth } from "../context/AuthContext";

const PRESET_COUNT = 8;
// Absolute URL: updateProfileSchema requires avatarUrl to be a full URL, and the client's own
// origin is stable per deployment, so this resolves the same way in dev and in production.
const presetUrl = (n: number) => `${window.location.origin}/avatars/preset-${n}.svg`;

export function PickAvatarStep({ onDone }: { onDone: () => void }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { updateProfile } = useAuth();

  async function handleFinish() {
    if (!avatarUrl) {
      onDone();
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ avatarUrl });
    } catch {
      // toast already shown by AuthContext
    } finally {
      setIsSaving(false);
      onDone();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: PRESET_COUNT }, (_, i) => i + 1).map((n) => {
          const url = presetUrl(n);
          const isSelected = avatarUrl === url;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setAvatarUrl(url)}
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

      <div className="flex items-center gap-3 text-xs text-[var(--color-ink-soft)]">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        or upload your own
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <ImageUploadField label="Avatar" shape="circle" value={avatarUrl} onChange={setAvatarUrl} />

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleFinish} isLoading={isSaving} className="w-full">
          Finish
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} className="w-full">
          Skip for now
        </Button>
      </div>
    </div>
  );
}
