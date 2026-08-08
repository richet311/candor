import { useState } from "react";
import { Button } from "./ui/Button";
import { ImageUploadField } from "./ui/ImageUploadField";
import { AvatarPresetGrid } from "./AvatarPresetGrid";
import { useAuth } from "../context/AuthContext";

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
      <AvatarPresetGrid value={avatarUrl} onSelect={setAvatarUrl} />

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
