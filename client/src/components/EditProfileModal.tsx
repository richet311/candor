import { useState, type FormEvent } from "react";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { ImageUploadField } from "./ui/ImageUploadField";
import { AvatarPresetGrid } from "./AvatarPresetGrid";
import { useAuth } from "../context/AuthContext";
import type { User } from "../lib/types";

export function EditProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateProfile } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({ name, avatarUrl, bio: bio.trim() });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Edit profile" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Display name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Avatar</span>
          <AvatarPresetGrid value={avatarUrl || null} onSelect={setAvatarUrl} />
          <div className="flex items-center gap-3 text-xs text-[var(--color-ink-soft)]">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            or upload your own
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <ImageUploadField label="" value={avatarUrl || null} onChange={(url) => setAvatarUrl(url ?? "")} shape="circle" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-bio" className="text-sm font-medium text-[var(--color-ink)]">
            Short bio (optional)
          </label>
          <textarea
            id="profile-bio"
            maxLength={280}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/10"
          />
        </div>
        <p className="-mt-2 text-xs text-[var(--color-ink-soft)]">
          This is visible on your own dashboard only, not on the public donation activity feed.
        </p>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Save changes
        </Button>
      </form>
    </Modal>
  );
}
