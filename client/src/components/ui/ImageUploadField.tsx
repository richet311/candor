import { useRef, useState, type ChangeEvent } from "react";
import { uploadImage, ApiError } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

const SHAPE_CLASSES = {
  circle: "h-20 w-20 rounded-full",
  banner: "aspect-[16/6] w-full rounded-xl",
  card: "aspect-[16/10] w-full rounded-xl",
} as const;

export function ImageUploadField({
  label,
  value,
  onChange,
  shape = "banner",
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  shape?: keyof typeof SHAPE_CLASSES;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not upload image";
      toast.error(message, err);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <div className="flex items-center gap-3">
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-[var(--color-border)] bg-black/[0.03] ${SHAPE_CLASSES[shape]}`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-[var(--color-ink-soft)]">No image</span>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white">
              Uploading…
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="w-fit rounded-full border border-[var(--color-border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-black/5 disabled:opacity-50"
          >
            {value ? "Change image" : "Upload image"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="w-fit rounded-full px-3.5 py-1.5 text-left text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-black/5"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-[var(--color-ink-soft)]">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
